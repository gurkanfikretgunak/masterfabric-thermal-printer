// Web Bluetooth API adapter for browser environments

import { BLUETOOTH_UUIDS } from "../utils/bluetooth";
import { BaseCharacteristicWrapper } from "./BaseCharacteristicWrapper";
import type {
  BluetoothAdapter,
  BluetoothDevice as PrinterBluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
} from "../core/types";

/**
 * Wrapper for Web Bluetooth API characteristic to match our interface
 */
class WebBluetoothCharacteristicWrapper extends BaseCharacteristicWrapper {
  constructor(private characteristic: BluetoothRemoteGATTCharacteristic) {
    super();
  }

  async writeValueWithoutResponse(data: BufferSource): Promise<void> {
    await this.characteristic.writeValueWithoutResponse(data);
  }

  async startNotifications(): Promise<void> {
    await this.characteristic.startNotifications();
  }

  async stopNotifications(): Promise<void> {
    await this.characteristic.stopNotifications();
  }

  addEventListener(event: string, callback: (event: any) => void): void {
    this.characteristic.addEventListener(event, callback);
  }

  removeEventListener(event: string, callback: (event: any) => void): void {
    this.characteristic.removeEventListener(event, callback);
  }
}

/**
 * Web Bluetooth adapter for browser environments
 * Uses the Web Bluetooth API to connect to Bluetooth devices
 */
export class WebBluetoothAdapter implements BluetoothAdapter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;

  /**
   * Check if Web Bluetooth is available
   */
  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.bluetooth !== "undefined"
    );
  }

  /**
   * Try to get a previously paired device without user interaction
   * Returns null if no device is available
   */
  async getPairedDevice(deviceId?: string): Promise<PrinterBluetoothDevice | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const devices = await navigator.bluetooth.getDevices();
      if (devices.length === 0) {
        return null;
      }

      // If deviceId is provided, try to find that specific device
      if (deviceId) {
        const foundDevice = devices.find(d => d.id === deviceId);
        if (foundDevice) {
          this.device = foundDevice;
          return {
            id: foundDevice.id,
            name: foundDevice.name,
          };
        }
      }

      // Otherwise, use the first available device
      this.device = devices[0];
      return {
        id: devices[0].id,
        name: devices[0].name,
      };
    } catch (error) {
      console.error("Error getting paired device:", error);
      return null;
    }
  }

  /**
   * Request a Bluetooth device with printer services
   */
  async requestDevice(): Promise<PrinterBluetoothDevice> {
    if (!this.isAvailable()) {
      throw new Error("Web Bluetooth API is not available in this browser");
    }

    try {
      // Request Bluetooth device with support for both standard and macOS UUIDs
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLUETOOTH_UUIDS.PRINTER_SERVICE] },
          { services: [BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT] },
        ],
        optionalServices: [
          BLUETOOTH_UUIDS.PRINTER_SERVICE,
          BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT,
        ],
      });

      return {
        id: this.device.id,
        name: this.device.name,
      };
    } catch (error) {
      throw new Error(
        `Failed to request Bluetooth device: ${(error as Error).message}`
      );
    }
  }

  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  async connect(
    device: PrinterBluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo> {
    if (!this.device || this.device.id !== device.id) {
      throw new Error("Device not found. Please request device first.");
    }

    try {
      // Connect to GATT server
      const gatt = this.device.gatt;
      if (!gatt) {
        throw new Error("GATT not available on device");
      }
      this.server = await gatt.connect();
      if (!this.server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Access printer service - try standard UUID first, then macOS alternate
      let service: BluetoothRemoteGATTService;
      try {
        service = await this.server.getPrimaryService(
          BLUETOOTH_UUIDS.PRINTER_SERVICE
        );
      } catch (error) {
        console.log("Trying alternate UUID for macOS compatibility...");
        service = await this.server.getPrimaryService(
          BLUETOOTH_UUIDS.PRINTER_SERVICE_ALT
        );
      }

      // Get characteristics
      const [controlChar, notifyChar, dataChar] = await Promise.all([
        service.getCharacteristic(BLUETOOTH_UUIDS.CONTROL),
        service.getCharacteristic(BLUETOOTH_UUIDS.NOTIFY),
        service.getCharacteristic(BLUETOOTH_UUIDS.DATA),
      ]);

      return {
        device,
        disconnect: async () => {
          if (this.server?.connected) {
            this.server.disconnect();
          }
          this.device = null;
          this.server = null;
        },
        controlCharacteristic: new WebBluetoothCharacteristicWrapper(
          controlChar
        ),
        dataCharacteristic: new WebBluetoothCharacteristicWrapper(dataChar),
        notifyCharacteristic: new WebBluetoothCharacteristicWrapper(notifyChar),
      };
    } catch (error) {
      throw new Error(
        `Failed to connect to device: ${(error as Error).message}`
      );
    }
  }
}


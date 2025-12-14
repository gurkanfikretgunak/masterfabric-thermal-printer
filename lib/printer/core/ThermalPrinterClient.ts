// Platform-agnostic thermal printer client
// Simplified with delegated responsibilities

import { MXW01Printer } from "../services/printer";
import { EventEmitter } from "./EventEmitter";
import { ClientState } from "./ClientState";
import { PrintJob } from "./PrintJob";
import type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothConnection,
  BluetoothServiceInfo,
  PrinterState,
  PrinterEventType,
  PrinterEventListener,
  PrinterImageData,
  PrintOptions,
  ImageProcessorOptions,
} from "./types";

/**
 * Platform-agnostic thermal printer client
 * Works with any BluetoothAdapter implementation (Web Bluetooth, Noble, etc.)
 */
export class ThermalPrinterClient {
  private adapter: BluetoothAdapter;
  private printer: MXW01Printer | null = null;
  private connection: (BluetoothConnection & BluetoothServiceInfo) | null = null;
  private device: BluetoothDevice | null = null;
  private eventEmitter: EventEmitter;
  private state: ClientState;

  constructor(adapter: BluetoothAdapter) {
    if (!adapter.isAvailable()) {
      throw new Error("Bluetooth is not available in this environment");
    }
    this.adapter = adapter;
    this.eventEmitter = new EventEmitter();
    this.state = new ClientState();
  }

  // Public getters delegated to state
  get isConnected(): boolean {
    return this.state.isConnected;
  }

  get isPrinting(): boolean {
    return this.state.isPrinting;
  }

  get printerState(): PrinterState | null {
    return this.state.printerState;
  }

  get statusMessage(): string {
    return this.state.statusMessage;
  }

  get ditherMethod(): ImageProcessorOptions["dither"] {
    return this.state.ditherMethod;
  }

  get printIntensity(): number {
    return this.state.printIntensity;
  }

  // Public setters delegated to state
  setDitherMethod(method: ImageProcessorOptions["dither"]): void {
    this.state.setDitherMethod(method);
  }

  setPrintIntensity(intensity: number): void {
    this.state.setPrintIntensity(intensity);
  }

  /**
   * Subscribe to events
   */
  on<T extends PrinterEventType>(
    eventType: T,
    listener: PrinterEventListener<T>
  ): () => void {
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Update status message and emit state change if needed
   */
  private updateStatus(message: string, newPrinterState?: PrinterState): void {
    this.state.setStatusMessage(message);

    if (newPrinterState) {
      this.state.setPrinterState(newPrinterState);
      this.eventEmitter.emit({ type: "stateChange", state: newPrinterState });
    }
  }

  /**
   * Try to reconnect to a previously paired device without user interaction
   * Returns true if reconnection was successful, false otherwise
   */
  async reconnect(deviceId?: string): Promise<boolean> {
    try {
      // Check if adapter has getPairedDevice method (WebBluetoothAdapter)
      const adapter = this.adapter as any;
      if (typeof adapter.getPairedDevice !== 'function') {
        return false;
      }

      this.updateStatus("Checking for paired devices...");

      // Try to get a paired device
      const device = await adapter.getPairedDevice(deviceId);
      if (!device) {
        return false;
      }

      this.updateStatus("Connecting to paired device...");

      // Connect to the device
      this.device = device;
      this.connection = await this.adapter.connect(device);

      // Initialize printer
      this.printer = new MXW01Printer(
        this.connection.controlCharacteristic.writeValueWithoutResponse.bind(
          this.connection.controlCharacteristic
        ),
        this.connection.dataCharacteristic.writeValueWithoutResponse.bind(
          this.connection.dataCharacteristic
        )
      );

      // Setup notifications
      await this.setupNotifications();

      this.state.setConnected(true);
      this.updateStatus("Reconnected to printer");
      if (this.device) {
        this.eventEmitter.emit({ type: "connected", device: this.device });
      }

      // Initial status request
      await this.getStatus();
      return true;
    } catch (error) {
      const err = error as Error;
      console.log("Reconnection failed:", err.message);
      return false;
    }
  }

  /**
   * Connect to printer via Bluetooth
   */
  async connect(): Promise<void> {
    try {
      this.updateStatus("Connecting to printer...");

      // Request and connect to device
      this.device = await this.adapter.requestDevice();
      this.connection = await this.adapter.connect(this.device);

      // Initialize printer
      this.printer = new MXW01Printer(
        this.connection.controlCharacteristic.writeValueWithoutResponse.bind(
          this.connection.controlCharacteristic
        ),
        this.connection.dataCharacteristic.writeValueWithoutResponse.bind(
          this.connection.dataCharacteristic
        )
      );

      // Setup notifications
      await this.setupNotifications();

      this.state.setConnected(true);
      this.updateStatus("Printer connected");
      if (this.device) {
        this.eventEmitter.emit({ type: "connected", device: this.device });
      }

      // Initial status request
      await this.getStatus();
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.eventEmitter.emit({ type: "error", error: err });
      throw error;
    }
  }

  /**
   * Setup notification listener
   */
  private async setupNotifications(): Promise<void> {
    if (!this.connection || !this.printer) {
      throw new Error("No connection or printer available");
    }

    const notifier = (event: any) => {
      const characteristic = event.target;
      const value = characteristic.value;
      if (value && this.printer) {
        this.printer.notify(new Uint8Array(value.buffer));
        this.updateStatus("Printer state updated", { ...this.printer.state });
      }
    };

    await this.connection.notifyCharacteristic.startNotifications();
    this.connection.notifyCharacteristic.addEventListener(
      "characteristicvaluechanged",
      notifier
    );
  }

  /**
   * Get current printer status
   */
  async getStatus(): Promise<PrinterState | null> {
    if (!this.printer || !this.state.isConnected) {
      this.updateStatus("Printer not connected");
      return null;
    }

    try {
      await this.printer.requestStatus();
      const newState = { ...this.printer.state };
      this.updateStatus("Status updated", newState);
      return newState;
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.eventEmitter.emit({ type: "error", error: err });
      return null;
    }
  }

  /**
   * Print from image data
   */
  async print(
    imageData: PrinterImageData,
    options: PrintOptions = {}
  ): Promise<void> {
    if (!this.printer || !this.state.isConnected) {
      throw new Error("Printer not connected");
    }

    try {
      this.state.setPrinting(true);
      this.updateStatus("Preparing to print...");

      // Create and prepare print job
      const printJob = new PrintJob(imageData, options);
      const { imageBuffer, numLines } = printJob.prepare(
        this.state.ditherMethod
      );
      const intensity = printJob.getIntensity(this.state.printIntensity);

      // Configure printer
      this.updateStatus("Configuring printer...");
      await this.printer.setIntensity(intensity);

      // Check printer status
      const status = await this.printer.requestStatus();
      if (status.length >= 13 && status[12] !== 0) {
        throw new Error(`Printer error: ${status[13]}`);
      }

      // Send print request
      this.updateStatus("Sending data...");
      const ack = await this.printer.printRequest(numLines, 0);
      if (!ack || ack[0] !== 0) {
        throw new Error("Print request rejected");
      }

      // Send image data
      await this.printer.sendDataChunks(imageBuffer);
      await this.printer.flushData();

      // Wait for completion
      this.updateStatus("Printing...");
      await this.printer.waitForPrintComplete();

      this.updateStatus("Print completed");
      await this.getStatus();
    } catch (error) {
      const err = error as Error;
      this.updateStatus(`Error: ${err.message}`);
      this.eventEmitter.emit({ type: "error", error: err });
      throw error;
    } finally {
      this.state.setPrinting(false);
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    if (this.connection?.notifyCharacteristic) {
      try {
        await this.connection.notifyCharacteristic.stopNotifications();
      } catch (error) {
        console.warn("Error stopping notifications:", error);
      }
    }

    if (this.connection) {
      try {
        await this.connection.disconnect();
      } catch (error) {
        console.warn("Error disconnecting:", error);
      }
    }

    this.printer = null;
    this.connection = null;
    this.device = null;
    this.state.reset();
    this.updateStatus("Printer disconnected");
    this.eventEmitter.emit({ type: "disconnected" });
  }

  /**
   * Dispose of the client and clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.eventEmitter.clear();
  }
}


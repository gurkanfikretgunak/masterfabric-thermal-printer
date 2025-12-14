// Core types for thermal printer client

export interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}

export interface BluetoothDevice {
  id: string;
  name?: string;
}

export interface BluetoothConnection {
  device: BluetoothDevice;
  disconnect(): Promise<void>;
}

export interface BluetoothCharacteristic {
  writeValueWithoutResponse(data: BufferSource): Promise<void>;
  startNotifications(): Promise<void>;
  stopNotifications(): Promise<void>;
  addEventListener(event: string, callback: (event: any) => void): void;
  removeEventListener(event: string, callback: (event: any) => void): void;
}

export interface BluetoothServiceInfo {
  controlCharacteristic: BluetoothCharacteristic;
  dataCharacteristic: BluetoothCharacteristic;
  notifyCharacteristic: BluetoothCharacteristic;
}

/**
 * Abstract interface for Bluetooth adapters
 * Implementations can use Web Bluetooth API, Noble, or other BLE libraries
 */
export interface BluetoothAdapter {
  /**
   * Request a Bluetooth device with printer services
   */
  requestDevice(): Promise<BluetoothDevice>;

  /**
   * Connect to a Bluetooth device and get service characteristics
   */
  connect(
    device: BluetoothDevice
  ): Promise<BluetoothConnection & BluetoothServiceInfo>;

  /**
   * Check if Bluetooth is available in the current environment
   */
  isAvailable(): boolean;
}

/**
 * Event types emitted by ThermalPrinterClient
 */
export type PrinterEvent =
  | { type: "connected"; device: BluetoothDevice }
  | { type: "disconnected" }
  | { type: "stateChange"; state: PrinterState }
  | { type: "printProgress"; progress: number }
  | { type: "error"; error: Error };

export type PrinterEventType = PrinterEvent["type"];

export type PrinterEventListener<
  T extends PrinterEventType = PrinterEventType
> = (event: Extract<PrinterEvent, { type: T }>) => void;

/**
 * Options for image processing
 */
export type DitherMethod =
  | "threshold"
  | "steinberg"
  | "bayer"
  | "atkinson"
  | "pattern";

export interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: "none" | "h" | "v" | "both";
  brightness: number;
}

/**
 * Image data interface - compatible with both Canvas and Node.js
 * Renamed to avoid conflict with DOM ImageData
 */
export interface PrinterImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Print options
 */
export interface PrintOptions extends Partial<ImageProcessorOptions> {
  intensity?: number;
}


// Shared Bluetooth utilities and constants

/**
 * Bluetooth service UUIDs for MXW01 printer
 */
export const BLUETOOTH_UUIDS = {
  // Service UUIDs
  PRINTER_SERVICE: "0000ae30-0000-1000-8000-00805f9b34fb",
  PRINTER_SERVICE_ALT: "0000af30-0000-1000-8000-00805f9b34fb", // macOS alternate

  // Characteristic UUIDs
  CONTROL: "0000ae01-0000-1000-8000-00805f9b34fb",
  NOTIFY: "0000ae02-0000-1000-8000-00805f9b34fb",
  DATA: "0000ae03-0000-1000-8000-00805f9b34fb",

  // Short format for Noble (Node.js)
  CONTROL_SHORT: "ae01",
  NOTIFY_SHORT: "ae02",
  DATA_SHORT: "ae03",
} as const;


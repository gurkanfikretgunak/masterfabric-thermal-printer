// MXW01 Thermal Printer - Simplified with delegated responsibilities

import { delay } from "../utils/helpers";
import { makeCommand, parseNotification, Command } from "./protocol";
import { PrinterStateManager } from "./printerState";
import type { PrinterState } from "./printerState";

export const PRINTER_WIDTH = 384;
export const PRINTER_WIDTH_BYTES = PRINTER_WIDTH / 8; // 48 bytes
export const MIN_DATA_BYTES = 90 * PRINTER_WIDTH_BYTES; // 4320 bytes minimum

// Re-export for backward compatibility
export { Command, type PrinterState };

// Type for Bluetooth write functions
export type WriteFunction = (data: BufferSource) => Promise<void>;

/**
 * MXW01 Thermal Printer Controller
 * Simplified class that delegates to protocol and state management modules
 */
export class MXW01Printer {
  private controlWrite: WriteFunction;
  private dataWrite: WriteFunction;
  private stateManager: PrinterStateManager;

  constructor(controlWrite: WriteFunction, dataWrite: WriteFunction) {
    this.controlWrite = controlWrite;
    this.dataWrite = dataWrite;
    this.stateManager = new PrinterStateManager();
  }

  /**
   * Get current printer state
   */
  get state(): PrinterState {
    return this.stateManager.getState();
  }

  /**
   * Process incoming notification from printer
   */
  notify(message: Uint8Array): void {
    const parsed = parseNotification(message);
    if (!parsed) {
      console.warn("Ignoring unexpected notification format");
      return;
    }

    this.stateManager.processNotification(parsed.cmdId, parsed.payload);
  }

  /**
   * Set print intensity (darkness)
   */
  async setIntensity(intensity = 0x5d): Promise<void> {
    const command = makeCommand(Command.SetIntensity, Uint8Array.of(intensity));
    await this.controlWrite(command as BufferSource);
    await delay(50);
  }

  /**
   * Request current printer status
   */
  async requestStatus(): Promise<Uint8Array> {
    const command = makeCommand(Command.GetStatus, Uint8Array.of(0x00));
    await this.controlWrite(command as BufferSource);
    return this.stateManager.waitForNotification(Command.GetStatus, 5000);
  }

  /**
   * Send print request with number of lines
   */
  async printRequest(lines: number, mode = 0): Promise<Uint8Array> {
    const payload = new Uint8Array(4);
    payload[0] = lines & 0xff;
    payload[1] = (lines >> 8) & 0xff;
    payload[2] = 0x30;
    payload[3] = mode;

    const command = makeCommand(Command.PrintRequest, payload);
    await this.controlWrite(command as BufferSource);
    return this.stateManager.waitForNotification(Command.PrintRequest, 5000);
  }

  /**
   * Flush data to printer
   */
  async flushData(): Promise<void> {
    const command = makeCommand(Command.FlushData, Uint8Array.of(0x00));
    await this.controlWrite(command as BufferSource);
    await delay(50);
  }

  /**
   * Send data chunks to printer
   */
  async sendDataChunks(
    data: Uint8Array,
    chunkSize = PRINTER_WIDTH_BYTES
  ): Promise<void> {
    let pos = 0;
    while (pos < data.length) {
      const chunk = data.slice(pos, Math.min(pos + chunkSize, data.length));
      await this.dataWrite(chunk);
      pos += chunk.length;
      await delay(15);
    }
  }

  /**
   * Wait for print completion
   */
  async waitForPrintComplete(timeoutMs = 20000): Promise<void> {
    this.stateManager.resetPrintComplete();
    const startTime = Date.now();

    while (
      !this.stateManager.isPrintComplete() &&
      Date.now() - startTime < timeoutMs
    ) {
      await delay(100);
    }

    if (!this.stateManager.isPrintComplete()) {
      throw new Error("Print timeout: Did not receive completion notification");
    }
  }
}

/**
 * Encode a row of boolean pixels to binary format
 */
export function encode1bppRow(rowBool: boolean[]): Uint8Array {
  if (rowBool.length !== PRINTER_WIDTH) {
    throw new Error(
      `Row length must be ${PRINTER_WIDTH}, got ${rowBool.length}`
    );
  }

  const rowBytes = new Uint8Array(PRINTER_WIDTH_BYTES);
  for (let byteIndex = 0; byteIndex < PRINTER_WIDTH_BYTES; byteIndex++) {
    let byteVal = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (rowBool[byteIndex * 8 + bit]) {
        byteVal |= 1 << bit;
      }
    }
    rowBytes[byteIndex] = byteVal;
  }

  return rowBytes;
}

/**
 * Prepare image data buffer with padding
 */
export function prepareImageDataBuffer(imageRowsBool: boolean[][]): Uint8Array {
  const height = imageRowsBool.length;
  let buffer = new Uint8Array(0);

  for (let y = 0; y < height; y++) {
    const rowBytes = encode1bppRow(imageRowsBool[y]);
    const newBuf = new Uint8Array(buffer.length + rowBytes.length);
    newBuf.set(buffer);
    newBuf.set(rowBytes, buffer.length);
    buffer = newBuf;
  }

  // Pad to minimum size if needed
  if (buffer.length < MIN_DATA_BYTES) {
    const pad = new Uint8Array(MIN_DATA_BYTES - buffer.length);
    const newBuf = new Uint8Array(buffer.length + pad.length);
    newBuf.set(buffer);
    newBuf.set(pad, buffer.length);
    buffer = newBuf;
  }

  return buffer;
}


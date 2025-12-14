// Centralized state management for ThermalPrinterClient

import type { PrinterState } from "./types";
import type { ImageProcessorOptions } from "../services/imageProcessor";

/**
 * Client state manager
 * Centralizes all state management for the printer client
 */
export class ClientState {
  private _isConnected = false;
  private _isPrinting = false;
  private _printerState: PrinterState | null = null;
  private _statusMessage = "Ready to connect printer";
  private _ditherMethod: ImageProcessorOptions["dither"] = "steinberg";
  private _printIntensity = 0x5d;

  // Getters
  get isConnected(): boolean {
    return this._isConnected;
  }

  get isPrinting(): boolean {
    return this._isPrinting;
  }

  get printerState(): PrinterState | null {
    return this._printerState;
  }

  get statusMessage(): string {
    return this._statusMessage;
  }

  get ditherMethod(): ImageProcessorOptions["dither"] {
    return this._ditherMethod;
  }

  get printIntensity(): number {
    return this._printIntensity;
  }

  // Setters with validation
  setConnected(value: boolean): void {
    this._isConnected = value;
  }

  setPrinting(value: boolean): void {
    this._isPrinting = value;
  }

  setPrinterState(state: PrinterState | null): void {
    this._printerState = state;
  }

  setStatusMessage(message: string): void {
    this._statusMessage = message;
  }

  setDitherMethod(method: ImageProcessorOptions["dither"]): void {
    this._ditherMethod = method;
  }

  setPrintIntensity(intensity: number): void {
    if (intensity < 0 || intensity > 255) {
      throw new Error("Print intensity must be between 0 and 255");
    }
    this._printIntensity = intensity;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this._isConnected = false;
    this._isPrinting = false;
    this._printerState = null;
    this._statusMessage = "Ready to connect printer";
  }
}


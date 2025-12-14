// Printer state management

import { Command } from "./protocol";

/**
 * Printer state interface
 */
export interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}

/**
 * Parse printer state from status response payload
 * @param payload Status response payload
 * @returns Parsed printer state or null if invalid
 */
export function parsePrinterState(payload: Uint8Array): PrinterState | null {
  if (payload.length < 7) {
    return null;
  }

  const statusByte = payload[6];
  return {
    printing: (statusByte & 0x01) !== 0,
    paper_jam: (statusByte & 0x02) !== 0,
    out_of_paper: (statusByte & 0x04) !== 0,
    cover_open: (statusByte & 0x08) !== 0,
    battery_low: (statusByte & 0x10) !== 0,
    overheat: (statusByte & 0x20) !== 0,
  };
}

/**
 * Create initial/default printer state
 */
export function createDefaultState(): PrinterState {
  return {
    printing: false,
    paper_jam: false,
    out_of_paper: false,
    cover_open: false,
    battery_low: false,
    overheat: false,
  };
}

/**
 * Printer state manager
 * Handles state updates and notification processing
 */
export class PrinterStateManager {
  private state: PrinterState;
  private printComplete: boolean = false;
  private pendingResolvers: Map<number, (payload: Uint8Array) => void> =
    new Map();

  constructor() {
    this.state = createDefaultState();
  }

  /**
   * Get current printer state
   */
  getState(): PrinterState {
    return { ...this.state };
  }

  /**
   * Check if print is complete
   */
  isPrintComplete(): boolean {
    return this.printComplete;
  }

  /**
   * Reset print complete flag
   */
  resetPrintComplete(): void {
    this.printComplete = false;
  }

  /**
   * Process notification and update state
   * @param cmdId Command ID from notification
   * @param payload Notification payload
   */
  processNotification(cmdId: number, payload: Uint8Array): void {
    // Check for print complete notification
    if (cmdId === Command.PrintComplete) {
      this.printComplete = true;
    }

    // Update state from status response
    if (cmdId === Command.GetStatus) {
      const newState = parsePrinterState(payload);
      if (newState) {
        this.state = newState;
      }
    }

    // Resolve any pending promise for this command
    const resolver = this.pendingResolvers.get(cmdId);
    if (resolver) {
      resolver(payload);
      this.pendingResolvers.delete(cmdId);
    }
  }

  /**
   * Wait for notification response
   * @param cmdId Command ID to wait for
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves with the payload
   */
  waitForNotification(cmdId: number, timeoutMs = 10000): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResolvers.delete(cmdId);
        reject(
          new Error(`Timeout waiting for notification 0x${cmdId.toString(16)}`)
        );
      }, timeoutMs);

      this.pendingResolvers.set(cmdId, (payload) => {
        clearTimeout(timer);
        resolve(payload);
      });
    });
  }
}


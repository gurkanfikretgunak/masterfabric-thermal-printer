// Base characteristic wrapper for Bluetooth adapters

import type { BluetoothCharacteristic } from "../core/types";

/**
 * Base class for wrapping Bluetooth characteristic implementations
 * Provides common functionality for both Web Bluetooth and Noble
 */
export abstract class BaseCharacteristicWrapper
  implements BluetoothCharacteristic
{
  protected dataListeners: Map<Function, Function> = new Map();

  abstract writeValueWithoutResponse(data: BufferSource): Promise<void>;
  abstract startNotifications(): Promise<void>;
  abstract stopNotifications(): Promise<void>;

  /**
   * Add event listener (to be implemented by subclasses)
   */
  abstract addEventListener(event: string, callback: (event: any) => void): void;

  /**
   * Remove event listener (to be implemented by subclasses)
   */
  abstract removeEventListener(
    event: string,
    callback: (event: any) => void
  ): void;

  /**
   * Clear all registered listeners
   */
  clearListeners(): void {
    this.dataListeners.clear();
  }
}


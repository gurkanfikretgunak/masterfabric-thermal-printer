// Generic event emitter for printer events

import type {
  PrinterEvent,
  PrinterEventType,
  PrinterEventListener,
} from "./types";

/**
 * Simple type-safe event emitter for printer events
 */
export class EventEmitter {
  private listeners: Map<PrinterEventType, Set<PrinterEventListener>> =
    new Map();

  /**
   * Subscribe to an event
   * @param eventType Event type to listen for
   * @param listener Callback function
   * @returns Unsubscribe function
   */
  on<T extends PrinterEventType>(
    eventType: T,
    listener: PrinterEventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener as any);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener as any);
      }
    };
  }

  /**
   * Emit an event to all listeners
   * @param event Event to emit
   */
  emit(event: PrinterEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as any)(event);
        } catch (error) {
          console.error("Error in event listener:", error);
        }
      });
    }
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Remove all listeners for a specific event type
   * @param eventType Event type to clear
   */
  clearEventType(eventType: PrinterEventType): void {
    this.listeners.delete(eventType);
  }
}


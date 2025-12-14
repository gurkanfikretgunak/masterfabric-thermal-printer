# Printer Hook Analysis (usePrinter)

## Overview

The `usePrinter` custom React Hook wraps the `ThermalPrinterClient` from the mxw01-thermal-printer library, providing a React-friendly interface for printer connection and printing operations.

---

## Hook Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Client Management | Creates and manages ThermalPrinterClient instance |
| Connection State | Tracks `isConnected`, `isPrinting`, `statusMessage` |
| Auto-Reconnect | Attempts to reconnect to last used device |
| Event Handling | Subscribes to printer events and updates React state |
| Cleanup | Handles disconnection and cleanup on unmount |

---

## Underlying Library

The hook uses the **mxw01-thermal-printer** library from `example-resource/`:

```typescript
import { 
  ThermalPrinterClient, 
  WebBluetoothAdapter,
  type PrinterState,
  type PrinterImageData,
  type PrintOptions,
} from '@/lib/printer';
```

---

## Hook API

```typescript
interface UsePrinterReturn {
  // State
  isConnected: boolean;
  isPrinting: boolean;
  isConnecting: boolean;
  statusMessage: string;
  printerState: PrinterState | null;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  reconnect: (deviceId?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (imageData: PrinterImageData, options?: PrintOptions) => Promise<void>;
  getStatus: () => Promise<PrinterState | null>;
  
  // Settings
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
}
```

---

## Implementation

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ThermalPrinterClient, 
  WebBluetoothAdapter 
} from '@/lib/printer';
import type { 
  PrinterState, 
  PrinterImageData, 
  PrintOptions,
  DitherMethod 
} from '@/lib/printer';
import { useSettingsStore } from '@/stores/settingsStore';

export function usePrinter() {
  const clientRef = useRef<ThermalPrinterClient | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [printerState, setPrinterState] = useState<PrinterState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { setLastDeviceId } = useSettingsStore();

  // Initialize client
  useEffect(() => {
    const adapter = new WebBluetoothAdapter();
    if (!adapter.isAvailable()) {
      setError('Web Bluetooth is not available');
      return;
    }
    
    clientRef.current = new ThermalPrinterClient(adapter);
    
    // Subscribe to events
    const unsubConnected = clientRef.current.on('connected', (event) => {
      setIsConnected(true);
      setIsConnecting(false);
      setStatusMessage('Connected');
      setLastDeviceId(event.device.id);
    });
    
    const unsubDisconnected = clientRef.current.on('disconnected', () => {
      setIsConnected(false);
      setStatusMessage('Disconnected');
    });
    
    const unsubStateChange = clientRef.current.on('stateChange', (event) => {
      setPrinterState(event.state);
    });
    
    const unsubError = clientRef.current.on('error', (event) => {
      setError(event.error.message);
      setStatusMessage(`Error: ${event.error.message}`);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubStateChange();
      unsubError();
      clientRef.current?.dispose();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await clientRef.current.connect();
    } catch (err) {
      setIsConnecting(false);
      throw err;
    }
  }, []);

  const reconnect = useCallback(async (deviceId?: string) => {
    if (!clientRef.current) return false;
    
    setStatusMessage('Reconnecting...');
    return await clientRef.current.reconnect(deviceId);
  }, []);

  const disconnect = useCallback(async () => {
    if (!clientRef.current) return;
    await clientRef.current.disconnect();
  }, []);

  const print = useCallback(async (
    imageData: PrinterImageData, 
    options?: PrintOptions
  ) => {
    if (!clientRef.current) throw new Error('Printer not initialized');
    
    setIsPrinting(true);
    try {
      await clientRef.current.print(imageData, options);
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const getStatus = useCallback(async () => {
    if (!clientRef.current) return null;
    return await clientRef.current.getStatus();
  }, []);

  const setDitherMethod = useCallback((method: DitherMethod) => {
    clientRef.current?.setDitherMethod(method);
  }, []);

  const setPrintIntensity = useCallback((intensity: number) => {
    clientRef.current?.setPrintIntensity(intensity);
  }, []);

  return {
    isConnected,
    isPrinting,
    isConnecting,
    statusMessage,
    printerState,
    error,
    connect,
    reconnect,
    disconnect,
    print,
    getStatus,
    setDitherMethod,
    setPrintIntensity,
  };
}
```

---

## Connection Flow

```
┌─────────────────┐
│  User Clicks    │
│  "Connect"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ WebBluetooth    │
│ Adapter         │
│ requestDevice() │──────► Device Picker Dialog
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ adapter.connect │
│ - GATT connect  │
│ - Get service   │
│ - Get chars     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ThermalPrinter  │
│ Client ready    │
│ - Events active │
│ - Status polled │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Ready to       │
│  Print          │
└─────────────────┘
```

---

## Auto-Reconnect Flow

```
┌─────────────────┐
│  App Start      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load lastDevice │
│ from IndexedDB  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Has Device   No Device
    │         │
    ▼         ▼
┌────────────┐ Manual
│ reconnect()│ Connect
│ (silent)   │
└─────┬──────┘
      │
 ┌────┴────┐
 │         │
 ▼         ▼
Success   Failed
 │         │
 ▼         ▼
Dashboard  Show Connect
           Button
```

---

## MXW01 Printer UUIDs

From `example-resource/mxw01-thermal-printer/src/utils/bluetooth.ts`:

```typescript
const BLUETOOTH_UUIDS = {
  // Service UUIDs
  PRINTER_SERVICE: "0000ae30-0000-1000-8000-00805f9b34fb",
  PRINTER_SERVICE_ALT: "0000af30-0000-1000-8000-00805f9b34fb", // macOS

  // Characteristic UUIDs
  CONTROL: "0000ae01-0000-1000-8000-00805f9b34fb",
  NOTIFY: "0000ae02-0000-1000-8000-00805f9b34fb",
  DATA: "0000ae03-0000-1000-8000-00805f9b34fb",
};
```

---

## Printer State Interface

From the mxw01-thermal-printer library:

```typescript
interface PrinterState {
  printing: boolean;
  paper_jam: boolean;
  out_of_paper: boolean;
  cover_open: boolean;
  battery_low: boolean;
  overheat: boolean;
}
```

---

## Error Handling

| Error Scenario | Handling |
|----------------|----------|
| Web Bluetooth unavailable | Show browser compatibility alert |
| User cancels device picker | Set error, keep disconnected state |
| GATT connection fails | Show error message, allow retry |
| Print fails | Show error toast, allow retry |
| Unexpected disconnect | Update state, show reconnect option |

---

## Browser Compatibility Check

```typescript
// Must check for browser environment
const [isSupported, setIsSupported] = useState(false);

useEffect(() => {
  setIsSupported(
    typeof navigator !== 'undefined' && 
    'bluetooth' in navigator
  );
}, []);
```

---

## Usage Example

```tsx
'use client';

import { usePrinter } from '@/hooks/usePrinter';
import { processImageForPrinter } from '@/lib/printer';

export function PrintButton() {
  const { isConnected, isPrinting, connect, print } = usePrinter();

  const handlePrint = async (imageData: ImageData) => {
    if (!isConnected) {
      await connect();
    }
    
    const { binaryRows, ...processed } = processImageForPrinter(imageData, {
      dither: 'steinberg',
      rotate: 0,
      flip: 'none',
      brightness: 1.0,
    });
    
    await print({
      data: new Uint8ClampedArray(processed.processedData.buffer),
      width: processed.width,
      height: processed.height,
    });
  };

  return (
    <button 
      onClick={() => handlePrint(myImageData)}
      disabled={isPrinting}
    >
      {isPrinting ? 'Printing...' : 'Print'}
    </button>
  );
}
```

---

## Security Considerations

- Web Bluetooth requires HTTPS (or localhost for development)
- Device pairing is handled by the browser/OS
- Printer client instance should not be exposed globally

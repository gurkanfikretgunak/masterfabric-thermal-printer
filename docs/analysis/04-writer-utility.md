# Print Service Analysis (mxw01-thermal-printer)

## Overview

The print functionality is handled by the `ThermalPrinterClient` from the mxw01-thermal-printer library. This document describes how the library manages data transmission to the MXW01 printer.

---

## Library Print Flow

The `ThermalPrinterClient.print()` method handles the complete print flow:

```
┌─────────────────┐
│ ThermalPrinter  │
│ Client.print()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create PrintJob │
│ - processImage  │
│ - prepareBuffer │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MXW01Printer    │
│ - setIntensity  │
│ - printRequest  │
│ - sendDataChunks│
│ - flushData     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ waitForPrint    │
│ Complete        │
└─────────────────┘
```

---

## MXW01 Protocol Commands

From `services/protocol.ts`:

```typescript
const Command = {
  GetStatus: 0xa1,
  SetIntensity: 0xa2,
  PrintRequest: 0xa9,
  FlushData: 0xad,
  PrintComplete: 0xaa,
};

const PROTOCOL = {
  HEADER_BYTE_1: 0x22,
  HEADER_BYTE_2: 0x21,
  TERMINATOR: 0xff,
};
```

---

## Data Transmission

### Chunk Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Chunk Size | 48 bytes | PRINTER_WIDTH_BYTES (one row) |
| Delay | 15ms | Between chunks |
| Timeout | 20000ms | Wait for print complete |

### Send Data Flow

```typescript
async sendDataChunks(
  data: Uint8Array,
  chunkSize = PRINTER_WIDTH_BYTES  // 48 bytes
): Promise<void> {
  let pos = 0;
  while (pos < data.length) {
    const chunk = data.slice(pos, Math.min(pos + chunkSize, data.length));
    await this.dataWrite(chunk);
    pos += chunk.length;
    await delay(15);  // 15ms between chunks
  }
}
```

---

## Print Intensity

The printer supports intensity control for darker/lighter prints:

```typescript
// Set print intensity (darkness)
// Default: 0x5d
// Range: typically 0x30 - 0x7f
await printer.setIntensity(0x5d);
```

---

## Printer State

The library tracks printer status via notifications:

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

## Complete Print Sequence

```
1. setIntensity(intensity)
         │
         ▼
2. requestStatus()
   └── Check for errors
         │
         ▼
3. printRequest(numLines, mode)
   └── Wait for ACK
         │
         ▼
4. sendDataChunks(imageBuffer)
   └── Send row by row with 15ms delay
         │
         ▼
5. flushData()
   └── Signal end of data
         │
         ▼
6. waitForPrintComplete()
   └── Wait for printer notification
```

---

## Using the Library Directly

```typescript
import { 
  ThermalPrinterClient, 
  WebBluetoothAdapter,
  processImageForPrinter,
  prepareImageDataBuffer,
} from '@/lib/printer';

async function printImage(imageData: ImageData) {
  // 1. Create client
  const adapter = new WebBluetoothAdapter();
  const client = new ThermalPrinterClient(adapter);

  // 2. Connect
  await client.connect();

  // 3. Process image
  const { binaryRows } = processImageForPrinter(imageData, {
    dither: 'steinberg',
    rotate: 0,
    flip: 'none',
    brightness: 1.0,
  });

  // 4. Print
  await client.print({
    data: new Uint8ClampedArray(imageData.data),
    width: imageData.width,
    height: imageData.height,
  }, {
    dither: 'steinberg',
    brightness: 1.0,
  });

  // 5. Done
  console.log('Print complete');
}
```

---

## Error Handling

| Error Type | Handling |
|------------|----------|
| Print request rejected | Throw error with message |
| Timeout waiting for completion | Throw timeout error |
| Printer error (paper jam, etc.) | Read from PrinterState |
| Connection lost | Client emits 'disconnected' event |

---

## Progress Tracking

The library doesn't expose progress callbacks directly, but you can estimate:

```typescript
function estimatePrintTime(imageHeight: number): number {
  const rowsPerSecond = 1000 / 15;  // ~66 rows/sec
  return Math.ceil(imageHeight / rowsPerSecond) * 1000;
}

// For a 500-line image:
// ~7.5 seconds print time
```

---

## Minimum Data Size

The printer requires minimum data:

```typescript
const PRINTER_WIDTH_BYTES = 48;           // 384 pixels / 8
const MIN_DATA_BYTES = 90 * PRINTER_WIDTH_BYTES; // 4320 bytes

// Images shorter than 90 lines are automatically padded
```

---

## Testing Checklist

- [ ] Test print with small image (< 100 lines)
- [ ] Test print with large image (> 500 lines)
- [ ] Test print intensity adjustment
- [ ] Test different dither methods
- [ ] Test printer state monitoring
- [ ] Test error handling (disconnect during print)
- [ ] Test timeout handling

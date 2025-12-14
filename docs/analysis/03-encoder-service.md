# Image Processing & Encoding Analysis

## Overview

The mxw01-thermal-printer library handles all image processing and encoding. This document describes how to prepare images for printing using the library's `processImageForPrinter` function.

---

## Library Exports

From `example-resource/mxw01-thermal-printer`:

```typescript
import { 
  processImageForPrinter,
  PRINTER_WIDTH,           // 384 pixels
  PRINTER_WIDTH_BYTES,     // 48 bytes
  type DitherMethod,
  type ImageProcessorOptions,
} from '@/lib/printer';
```

---

## Image Processing Interface

```typescript
interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: 'none' | 'h' | 'v' | 'both';
  brightness: number;       // Multiplier (1.0 = normal)
}

type DitherMethod = 
  | 'threshold'    // Simple black/white cutoff
  | 'steinberg'    // Floyd-Steinberg error diffusion
  | 'bayer'        // Ordered dithering
  | 'atkinson'     // Atkinson dithering
  | 'pattern';     // Pattern-based dithering
```

---

## Processing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   ImageData │───►│  Grayscale  │───►│  Brightness │───►│  Dithering  │
│   Input     │    │  Conversion │    │  Adjustment │    │  Algorithm  │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Binary    │◄───│    Flip     │◄───│   Rotation  │◄───│  Monochrome │
│   Rows      │    │ Transforms  │    │ (0/90/180/  │    │  1-bit Data │
│   Output    │    │             │    │  270)       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Using processImageForPrinter

```typescript
import { processImageForPrinter } from '@/lib/printer';

// Input: Canvas ImageData
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Process for printing
const result = processImageForPrinter(imageData, {
  dither: 'steinberg',
  rotate: 0,
  flip: 'none',
  brightness: 1.0,
});

// Result contains:
// - processedData: Uint32Array (RGBA for preview)
// - width: number (after rotation)
// - height: number (after rotation)
// - binaryRows: boolean[][] (for printing)
```

---

## Dithering Methods

### Threshold (Simple)
- Fastest method
- Pure black/white at 50% cutoff
- Best for high-contrast images

### Floyd-Steinberg
- Error diffusion algorithm
- Best quality for photos
- Natural-looking gradients

### Bayer (Ordered)
- Ordered dithering pattern
- Consistent texture
- Good for flat colors

### Atkinson
- Used by original Macintosh
- Retro aesthetic
- Good for line art

### Pattern
- Pattern-based dithering
- Predictable output
- Good for graphics

---

## Text to Image Conversion

To print text, first render it to a canvas:

```typescript
export function textToImageData(
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    maxWidth?: number;
  } = {}
): ImageData {
  const {
    fontSize = 24,
    fontFamily = 'Arial, sans-serif',
    align = 'left',
    bold = false,
    maxWidth = 384, // PRINTER_WIDTH
  } = options;

  // Create off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set font
  const fontWeight = bold ? 'bold' : 'normal';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  // Calculate text dimensions
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;

  // Set canvas size
  canvas.width = maxWidth;
  canvas.height = Math.max(totalHeight + 20, 100);

  // Fill white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text
  ctx.fillStyle = 'black';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  const x = align === 'center' ? maxWidth / 2 : align === 'right' ? maxWidth - 10 : 10;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, x, 10 + index * lineHeight);
  });

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth - 20 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}
```

---

## Image Upload and Resize

```typescript
export async function loadAndResizeImage(
  file: File,
  maxWidth: number = 384  // PRINTER_WIDTH
): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate dimensions (maintain aspect ratio)
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(ctx.getImageData(0, 0, width, height));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

---

## Complete Print Flow

```typescript
import { 
  processImageForPrinter, 
  prepareImageDataBuffer 
} from '@/lib/printer';
import { usePrinter } from '@/hooks/usePrinter';

async function printImage(imageData: ImageData) {
  const { print } = usePrinter();

  // 1. Process image with dithering and transforms
  const processed = processImageForPrinter(imageData, {
    dither: 'steinberg',
    rotate: 0,
    flip: 'none',
    brightness: 1.0,
  });

  // 2. Convert to printer format (handled by ThermalPrinterClient)
  await print({
    data: new Uint8ClampedArray(
      new Uint8Array(processed.processedData.buffer)
    ),
    width: processed.width,
    height: processed.height,
  }, {
    dither: 'steinberg',
    brightness: 1.0,
  });
}
```

---

## Printer Constants

From `mxw01-thermal-printer`:

| Constant | Value | Description |
|----------|-------|-------------|
| `PRINTER_WIDTH` | 384 | Max width in pixels |
| `PRINTER_WIDTH_BYTES` | 48 | Width in bytes (384/8) |
| `MIN_DATA_BYTES` | 4320 | Minimum data size (90 rows) |

---

## Preview Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import { processImageForPrinter, type DitherMethod } from '@/lib/printer';

interface ImagePreviewProps {
  imageData: ImageData | null;
  ditherMethod: DitherMethod;
  brightness: number;
}

export function ImagePreview({ imageData, ditherMethod, brightness }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageData) {
      setPreviewUrl(null);
      return;
    }

    // Process image
    const { processedData, width, height } = processImageForPrinter(imageData, {
      dither: ditherMethod,
      rotate: 0,
      flip: 'none',
      brightness,
    });

    // Create preview canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Convert Uint32Array back to ImageData
    const previewImageData = ctx.createImageData(width, height);
    const rgba = new Uint8ClampedArray(processedData.buffer);
    previewImageData.data.set(rgba);
    ctx.putImageData(previewImageData, 0, 0);

    setPreviewUrl(canvas.toDataURL());
  }, [imageData, ditherMethod, brightness]);

  if (!previewUrl) return null;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-sm text-muted-foreground mb-2">Print Preview</p>
      <img 
        src={previewUrl} 
        alt="Print preview" 
        className="max-w-full h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
```

---

## Error Prevention

| Issue | Solution |
|-------|----------|
| Image too wide | Auto-resize to PRINTER_WIDTH (384px) |
| Image too tall | No limit, but warn for very tall images |
| Invalid dither method | Default to 'steinberg' |
| Empty image | Prevent print, show error |

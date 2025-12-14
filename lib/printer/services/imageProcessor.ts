// Image processing service for MXW01 thermal printer
// Simplified to use modular dithering and transformation utilities

import { getDitherAlgorithm } from "./dithering";
import { rgbaToGray, grayToRgba, rotate, flip } from "./imageTransforms";
import type { DitherMethod } from "./dithering";

// Re-export for backward compatibility
export type { DitherMethod };

/**
 * Image processor options
 */
export interface ImageProcessorOptions {
  dither: DitherMethod;
  rotate: 0 | 90 | 180 | 270;
  flip: "none" | "h" | "v" | "both";
  brightness: number;
}

/**
 * Process an image for thermal printer
 * @param imageData Source image data
 * @param options Processing options
 * @returns Processed image data and binary rows for printing
 */
export function processImageForPrinter(
  imageData: ImageData,
  options: ImageProcessorOptions
): {
  processedData: Uint32Array;
  width: number;
  height: number;
  binaryRows: boolean[][];
} {
  // Convert to RGBA array
  const rgbaData = new Uint32Array(
    new Uint8ClampedArray(imageData.data).buffer
  );

  const width = imageData.width;
  const height = imageData.height;

  // Convert to grayscale with brightness adjustment
  let mono = rgbaToGray(rgbaData, options.brightness, true);

  // Apply dithering
  const ditherAlgorithm = getDitherAlgorithm(options.dither);
  mono = ditherAlgorithm.apply(mono, width, height);

  // Apply flip transformation
  mono = flip(mono, width, height, options.flip);

  // Apply rotation and determine final dimensions
  let finalWidth = width;
  let finalHeight = height;

  // Always pass input dimensions to rotate function
  mono = rotate(mono, width, height, options.rotate);
  
  // For 90° and 270° rotations, dimensions are swapped in the output
  if (options.rotate === 90 || options.rotate === 270) {
    finalWidth = height;
    finalHeight = width;
  }

  // Convert to RGBA for display
  const processedData = grayToRgba(mono, true);

  // Create binary rows array for printing
  // Rows must always be 384 pixels wide (printer requirement)
  const PRINTER_WIDTH = 384;
  const binaryRows: boolean[][] = [];

  for (let y = 0; y < finalHeight; y++) {
    const row: boolean[] = [];
    
    // Add actual image pixels
    for (let x = 0; x < finalWidth; x++) {
      const idx = y * finalWidth + x;
      const lum = mono[idx];
      row.push(lum < 128); // true = black (print), false = white
    }
    
    // Pad with white pixels to reach 384px width if needed
    while (row.length < PRINTER_WIDTH) {
      row.push(false); // false = white (no print)
    }
    
    binaryRows.push(row);
  }

  return {
    processedData,
    width: finalWidth,
    height: finalHeight,
    binaryRows,
  };
}


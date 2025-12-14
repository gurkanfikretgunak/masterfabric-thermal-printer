// Print job encapsulation for ThermalPrinterClient

import { PRINTER_WIDTH, prepareImageDataBuffer } from "../services/printer";
import { processImageForPrinter } from "../services/imageProcessor";
import { cropImageData } from "../services/imageTransforms";
import type { PrinterImageData, PrintOptions } from "./types";
import type { ImageProcessorOptions } from "../services/imageProcessor";

/**
 * Encapsulates a print job with image processing and preparation
 */
export class PrintJob {
  private imageData: PrinterImageData;
  private options: PrintOptions;

  constructor(imageData: PrinterImageData, options: PrintOptions = {}) {
    this.imageData = imageData;
    this.options = options;
  }

  /**
   * Process and prepare image for printing
   * @param defaultDither Default dithering method
   * @returns Prepared image buffer and metadata
   */
  prepare(defaultDither: ImageProcessorOptions["dither"]): {
    imageBuffer: Uint8Array;
    numLines: number;
  } {
    // Default processing options
    const processingOptions: ImageProcessorOptions = {
      dither: this.options.dither ?? defaultDither,
      brightness: this.options.brightness ?? 128,
      flip: this.options.flip ?? "none",
      rotate: this.options.rotate ?? 0,
    };

    // If width <= PRINTER_WIDTH: no modification needed
    // If width > PRINTER_WIDTH: crop to PRINTER_WIDTH
    let processedImage = this.imageData;
    
    if (this.imageData.width > PRINTER_WIDTH) {
      processedImage = cropImageData(
        this.imageData,
        PRINTER_WIDTH,
        this.imageData.height
      ) as any;
    }

    // Process image for printing (rotation is applied here on the content)
    const { binaryRows } = processImageForPrinter(
      processedImage as any,
      processingOptions
    );

    // Prepare print buffer
    const imageBuffer = prepareImageDataBuffer(binaryRows);

    return {
      imageBuffer,
      numLines: binaryRows.length,
    };
  }

  /**
   * Get print intensity from options or default
   * @param defaultIntensity Default intensity value
   * @returns Print intensity
   */
  getIntensity(defaultIntensity: number): number {
    return this.options.intensity ?? defaultIntensity;
  }
}


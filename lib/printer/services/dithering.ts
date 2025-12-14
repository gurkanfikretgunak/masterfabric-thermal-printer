// Dithering algorithms for thermal printer image processing

/**
 * Abstract base class for dithering algorithms
 */
export abstract class DitherAlgorithm {
  abstract apply(
    mono: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray;

  /**
   * Get the name of this dithering algorithm
   */
  abstract getName(): string;
}

/**
 * Simple threshold dithering
 */
export class ThresholdDither extends DitherAlgorithm {
  // eslint-disable-next-line no-unused-vars
  apply(
    mono: Uint8ClampedArray,
    _width: number,
    _height: number
  ): Uint8ClampedArray {
    for (let i = 0; i < mono.length; ++i) {
      mono[i] = mono[i] > 0x80 ? 0xff : 0x00;
    }
    return mono;
  }

  getName(): string {
    return "threshold";
  }
}

/**
 * Floyd-Steinberg error diffusion dithering
 */
export class SteinbergDither extends DitherAlgorithm {
  apply(
    mono: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    let p = 0;

    for (let j = 0; j < height; ++j) {
      for (let i = 0; i < width; ++i) {
        const oldPixel = mono[p];
        const newPixel = oldPixel > 0x80 ? 0xff : 0x00;
        const error = oldPixel - newPixel;
        mono[p] = newPixel;

        // Distribute error to neighboring pixels
        if (i < width - 1) {
          mono[p + 1] += (error * 7) / 16;
        }
        if (j < height - 1) {
          if (i > 0) {
            mono[p + width - 1] += (error * 3) / 16;
          }
          mono[p + width] += (error * 5) / 16;
          if (i < width - 1) {
            mono[p + width + 1] += (error) / 16;
          }
        }
        ++p;
      }
    }

    return mono;
  }

  getName(): string {
    return "steinberg";
  }
}

/**
 * Bayer matrix dithering
 */
export class BayerDither extends DitherAlgorithm {
  private readonly bayer8 = [
    0, 48, 12, 60, 3, 51, 15, 63, 32, 16, 44, 28, 35, 19, 47, 31, 8, 56, 4, 52,
    11, 59, 7, 55, 40, 24, 36, 20, 43, 27, 39, 23, 2, 50, 14, 62, 1, 49, 13,
    61, 34, 18, 46, 30, 33, 17, 45, 29, 10, 58, 6, 54, 9, 57, 5, 53, 42, 26,
    38, 22, 41, 25, 37, 21,
  ];
  private readonly ditherFactor = 0.6;

  apply(
    mono: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    let p = 0;

    for (let j = 0; j < height; ++j) {
      for (let i = 0; i < width; ++i) {
        const bayerValue = this.bayer8[(j % 8) * 8 + (i % 8)];
        let pixelValue = mono[p];
        pixelValue = pixelValue + (bayerValue - 32) * this.ditherFactor;
        pixelValue = Math.max(0, Math.min(255, pixelValue));
        mono[p] = pixelValue > 128 ? 0xff : 0x00;
        ++p;
      }
    }

    return mono;
  }

  getName(): string {
    return "bayer";
  }
}

/**
 * Atkinson dithering algorithm
 */
export class AtkinsonDither extends DitherAlgorithm {
  apply(
    mono: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    let p = 0;

    for (let j = 0; j < height; ++j) {
      for (let i = 0; i < width; ++i) {
        const oldPixel = mono[p];
        const newPixel = oldPixel > 0x80 ? 0xff : 0x00;
        const error = (oldPixel - newPixel) >> 3; // Division by 8
        mono[p] = newPixel;

        // Distribute error to neighboring pixels
        if (i < width - 1) {
          mono[p + 1] += error;
        }
        if (i < width - 2) {
          mono[p + 2] += error;
        }
        if (j < height - 1) {
          if (i > 0) {
            mono[p + width - 1] += error;
          }
          mono[p + width] += error;
          if (i < width - 1) {
            mono[p + width + 1] += error;
          }
        }
        if (j < height - 2) {
          mono[p + 2 * width] += error;
        }

        ++p;
      }
    }

    return mono;
  }

  getName(): string {
    return "atkinson";
  }
}

/**
 * Halftone pattern dithering
 */
export class HalftoneDither extends DitherAlgorithm {
  apply(
    mono: Uint8ClampedArray,
    width: number,
    height: number
  ): Uint8ClampedArray {
    const spot = 4;
    const spot_h = spot / 2 + 1;
    const spot_s = spot * spot;

    for (let j = 0; j < height - spot; j += spot) {
      for (let i = 0; i < width - spot; i += spot) {
        let sum = 0;
        for (let x = 0; x < spot; ++x) {
          for (let y = 0; y < spot; ++y) {
            sum += mono[(j + y) * width + i + x];
          }
        }
        const threshold = (1 - sum / spot_s / 0xff) * spot;

        for (let x = 0; x < spot; ++x) {
          for (let y = 0; y < spot; ++y) {
            mono[(j + y) * width + i + x] =
              Math.abs(x - spot_h) >= threshold ||
              Math.abs(y - spot_h) >= threshold
                ? 0xff
                : 0x00;
          }
        }
      }

      // Fill remaining columns
      for (let i = width - (width % spot); i < width; ++i) {
        mono[j * width + i] = 0xff;
      }
    }

    // Fill remaining rows
    for (let j = height - (height % spot); j < height; ++j) {
      for (let i = 0; i < width; ++i) {
        mono[j * width + i] = 0xff;
      }
    }

    return mono;
  }

  getName(): string {
    return "pattern";
  }
}

/**
 * Dithering method type
 */
export type DitherMethod =
  | "threshold"
  | "steinberg"
  | "bayer"
  | "atkinson"
  | "pattern";

/**
 * Factory to get dithering algorithm by name
 */
export function getDitherAlgorithm(method: DitherMethod): DitherAlgorithm {
  switch (method) {
    case "steinberg":
      return new SteinbergDither();
    case "bayer":
      return new BayerDither();
    case "atkinson":
      return new AtkinsonDither();
    case "pattern":
      return new HalftoneDither();
    case "threshold":
    default:
      return new ThresholdDither();
  }
}


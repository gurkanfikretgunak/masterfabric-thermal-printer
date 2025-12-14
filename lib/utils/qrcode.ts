/**
 * QR Code generator using qrcode library
 * Generates a proper, scannable QR code for thermal printing
 */
import QRCode from 'qrcode';

export async function generateQRCode(
  text: string,
  size: number = 120
): Promise<HTMLCanvasElement> {
  try {
    // Generate QR code using the qrcode library
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, text || ' ', {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M', // Medium error correction for better scanning
    });
    return canvas;
  } catch (error) {
    console.error('QR code generation error:', error);
    // Fallback: create a simple placeholder
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('QR ERROR', size / 2, size / 2);
    }
    return canvas;
  }
}


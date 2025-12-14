'use client';

import { useState, useRef } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { processImageForPrinter } from '@/lib/printer';

export default function SendImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { print, isPrinting, isConnected } = usePrinter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to printer width (384px) maintaining aspect ratio
        const maxWidth = 384;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill white background and draw image
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Get image data
        const data = ctx.getImageData(0, 0, width, height);
        setImageData(data);
        setPreview(canvas.toDataURL());
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = async () => {
    if (!imageData || !isConnected) return;

    try {
      const processed = processImageForPrinter(imageData, {
        dither: 'steinberg',
        rotate: 0,
        flip: 'none',
        brightness: 128,
      });

      // Convert processed data to Uint8ClampedArray for printing
      const rgbaArray = new Uint8ClampedArray(processed.processedData.buffer);

      await print({
        data: rgbaArray,
        width: processed.width,
        height: processed.height,
      });
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Image</CardTitle>
        <CardDescription>Upload an image to print</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full"
        >
          Select Image
        </Button>

        {preview && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-2 bg-white">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <Button
              onClick={handlePrint}
              disabled={!isConnected || isPrinting}
              className="w-full"
            >
              {isPrinting ? 'Printing...' : 'Print Image'}
            </Button>
          </div>
        )}

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Please connect to a printer first
          </p>
        )}
      </CardContent>
    </Card>
  );
}


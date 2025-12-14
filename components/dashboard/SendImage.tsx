'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { processImageForPrinter } from '@/lib/printer';
import { RotateCw, X, Maximize2, Minimize2, Sun, FlipHorizontal, FlipVertical, FlipHorizontal2 } from 'lucide-react';

const PRINTER_WIDTH = 384;

export default function SendImage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [coverMode, setCoverMode] = useState(false);
  const [coverHeight, setCoverHeight] = useState<number>(500); // Default height for cover mode
  const [brightness, setBrightness] = useState<number>(128); // Brightness: 0-255, default 128
  const [flip, setFlip] = useState<'none' | 'h' | 'v' | 'both'>('none'); // Flip/flop: none, horizontal, vertical, both
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { print, isPrinting, isConnected } = usePrinter();

  // Update preview when rotation, cover mode, brightness, or flip changes
  useEffect(() => {
    if (!originalImageData) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number;
    let height: number;
    let sourceWidth: number;
    let sourceHeight: number;

    if (coverMode && originalImage) {
      // Cover mode: fill entire canvas area
      width = PRINTER_WIDTH;
      height = coverHeight;
      sourceWidth = originalImage.width;
      sourceHeight = originalImage.height;
    } else {
      // Fit mode: use current image data dimensions
      width = originalImageData.width;
      height = originalImageData.height;
      sourceWidth = width;
      sourceHeight = height;
    }

    // Calculate dimensions based on rotation
    if (rotation === 90 || rotation === 270) {
      // Swap width and height for 90/270 degree rotations
      canvas.width = height;
      canvas.height = width;
      // Update dimensions for display
      setImageDimensions({ width: height, height: width });
    } else {
      canvas.width = width;
      canvas.height = height;
      // Update dimensions for display
      setImageDimensions({ width, height });
    }

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    if (coverMode && originalImage) {
      // Cover mode: scale and crop to fill
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const scaledWidth = sourceWidth * scale;
      const scaledHeight = sourceHeight * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;
      
      ctx.drawImage(originalImage, -width / 2 + x, -height / 2 + y, scaledWidth, scaledHeight);
    } else {
      // Fit mode: draw image data directly
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(originalImageData, 0, 0);
        ctx.drawImage(tempCanvas, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
      }
    }
    
    ctx.restore();

    // Apply flip/flop transformation
    if (flip !== 'none') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const flippedData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      const flipped = flippedData.data;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const srcX = flip === 'h' || flip === 'both' ? canvas.width - 1 - x : x;
          const srcY = flip === 'v' || flip === 'both' ? canvas.height - 1 - y : y;
          
          const srcIdx = (srcY * canvas.width + srcX) * 4;
          const dstIdx = (y * canvas.width + x) * 4;
          
          flipped[dstIdx] = data[srcIdx];
          flipped[dstIdx + 1] = data[srcIdx + 1];
          flipped[dstIdx + 2] = data[srcIdx + 2];
          flipped[dstIdx + 3] = data[srcIdx + 3];
        }
      }
      ctx.putImageData(flippedData, 0, 0);
    }

    // Apply brightness adjustment for preview
    if (brightness !== 128) {
      let processedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = processedImageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Get RGB values
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to grayscale
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        // Apply brightness adjustment
        const brightnessFactor = (brightness - 128) / 128;
        const adjustedGray = Math.max(0, Math.min(255, gray + brightnessFactor * 64));
        
        // Set RGB to adjusted grayscale value
        data[i] = adjustedGray;
        data[i + 1] = adjustedGray;
        data[i + 2] = adjustedGray;
      }
      ctx.putImageData(processedImageData, 0, 0);
    }

    setPreview(canvas.toDataURL());
  }, [rotation, originalImageData, coverMode, coverHeight, originalImage, brightness, flip]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Store original image for cover mode
        setOriginalImage(img);

        // Always resize to printer width (384px) maintaining aspect ratio for fit mode
        const maxWidth = PRINTER_WIDTH;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions to fit 384px width
        if (width !== maxWidth) {
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
        setOriginalImageData(data);
        setRotation(0); // Reset rotation when new image is loaded
        setBrightness(128); // Reset brightness
        setFlip('none'); // Reset flip
        setImageDimensions({ width, height }); // Set initial dimensions
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
    const currentIndex = rotations.indexOf(rotation);
    const newIndex = (currentIndex + 1) % rotations.length;
    setRotation(rotations[newIndex] as 0 | 90 | 180 | 270);
  };

  const handleDeselect = () => {
    setPreview(null);
    setOriginalImageData(null);
    setOriginalImage(null);
    setRotation(0);
    setBrightness(128);
    setFlip('none');
    setImageDimensions(null);
    setCoverMode(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFlip = () => {
    const flips: ('none' | 'h' | 'v' | 'both')[] = ['none', 'h', 'v', 'both'];
    const currentIndex = flips.indexOf(flip);
    const newIndex = (currentIndex + 1) % flips.length;
    setFlip(flips[newIndex] as 'none' | 'h' | 'v' | 'both');
  };

  const handleToggleCover = () => {
    setCoverMode(!coverMode);
  };

  const handlePrint = async () => {
    if (!isConnected) return;

    try {
      // Create canvas with rotation applied (same as preview)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width: number;
      let height: number;
      let sourceWidth: number;
      let sourceHeight: number;

      if (coverMode && originalImage) {
        // Cover mode: fill entire canvas area
        width = PRINTER_WIDTH;
        height = coverHeight;
        sourceWidth = originalImage.width;
        sourceHeight = originalImage.height;
      } else if (originalImageData) {
        // Fit mode: use current image data dimensions
        width = originalImageData.width;
        height = originalImageData.height;
        sourceWidth = width;
        sourceHeight = height;
      } else {
        return;
      }

      // Calculate dimensions based on rotation
      if (rotation === 90 || rotation === 270) {
        // Swap width and height for 90/270 degree rotations
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply rotation centered
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      if (coverMode && originalImage) {
        // Cover mode: scale and crop to fill
        const scale = Math.max(width / sourceWidth, height / sourceHeight);
        const scaledWidth = sourceWidth * scale;
        const scaledHeight = sourceHeight * scale;
        
        ctx.drawImage(originalImage, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      } else if (originalImageData) {
        // Fit mode: draw image data directly
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = sourceWidth;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(originalImageData, 0, 0);
          ctx.drawImage(tempCanvas, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
        }
      }
      
      ctx.restore();

      // Get final image data (rotation already applied)
      const imageDataToPrint = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Process for printer (rotation is already applied, so set to 0)
      // Flip will be applied during processing
      const processed = processImageForPrinter(imageDataToPrint, {
        dither: 'steinberg',
        rotate: 0, // Rotation already applied in canvas
        flip: flip, // Apply flip/flop transformation
        brightness: brightness,
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
            {/* Preview Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={handleFlip}
                    variant={flip !== 'none' ? "default" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={`Flip: ${flip === 'none' ? 'None' : flip === 'h' ? 'Horizontal' : flip === 'v' ? 'Vertical' : 'Both'}`}
                  >
                    {flip === 'v' || flip === 'both' ? (
                      <FlipVertical className="h-4 w-4" />
                    ) : (
                      <FlipHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleToggleCover}
                    variant={coverMode ? "default" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={coverMode ? "Cover fill mode (fills entire area)" : "Fit mode (maintains aspect ratio)"}
                  >
                    {coverMode ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    onClick={handleRotate}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Rotate image"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleDeselect}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border p-2 bg-white">
                <div className="bg-gray-100 p-1.5 rounded mb-2 text-xs text-gray-600 text-center">
                  Thermal Printer Preview (384px width)
                  {imageDimensions && (
                    <span className="block mt-1 font-medium">
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  )}
                </div>
                <div className="flex justify-center bg-white p-2 rounded overflow-x-auto">
                  <div className="relative inline-block">
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="block border-x border-gray-300 relative z-10"
                        style={{ 
                          imageRendering: 'pixelated',
                          maxWidth: '100%',
                          height: 'auto'
                        }}
                      />
                      {/* Width guide lines overlay - SVG overlay that scales with image */}
                      {preview && imageDimensions && (
                        <svg
                          className="absolute inset-0 pointer-events-none z-20"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          preserveAspectRatio="none"
                        >
                          {/* Left edge line */}
                          <line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="100%"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            opacity="0.6"
                          />
                          {/* Right edge line */}
                          <line
                            x1="100%"
                            y1="0"
                            x2="100%"
                            y2="100%"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            opacity="0.6"
                          />
                          {/* Center line */}
                          <line
                            x1="50%"
                            y1="0"
                            x2="50%"
                            y2="100%"
                            stroke="#60a5fa"
                            strokeWidth="0.5"
                            opacity="0.4"
                          />
                          {/* Quarter lines */}
                          <line
                            x1="25%"
                            y1="0"
                            x2="25%"
                            y2="100%"
                            stroke="#93c5fd"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                          <line
                            x1="75%"
                            y1="0"
                            x2="75%"
                            y2="100%"
                            stroke="#93c5fd"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Adjustments */}
            <div className="space-y-4">
              {/* Brightness Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Brightness
                  </label>
                  <span className="text-xs text-muted-foreground">{brightness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Dark</span>
                  <span>Normal</span>
                  <span>Bright</span>
                </div>
              </div>

              {/* Cover Mode Height Control */}
              {coverMode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cover Height</label>
                  <input
                    type="number"
                    value={coverHeight}
                    onChange={(e) => setCoverHeight(Math.max(100, Math.min(2000, Number(e.target.value))))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min="100"
                    max="2000"
                    step="50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Image will fill {PRINTER_WIDTH} × {coverHeight}px area
                  </p>
                </div>
              )}
            </div>

            {/* Print Button */}
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


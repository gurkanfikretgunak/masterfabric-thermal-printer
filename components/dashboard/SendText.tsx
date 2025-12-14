'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { processImageForPrinter } from '@/lib/printer';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Eye, Printer, X } from 'lucide-react';

type TextAlign = 'left' | 'center' | 'right';
type FontSize = 'small' | 'medium' | 'large';

export default function SendText() {
  const [text, setText] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [showPreview, setShowPreview] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { print, isPrinting, isConnected } = usePrinter();

  const fontSizeMap = {
    small: 18,
    medium: 24,
    large: 32,
  };

  const renderTextToCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const maxWidth = 384;
    const currentFontSize = fontSizeMap[fontSize];
    const lineHeight = currentFontSize * 1.3;
    
    // Build font string
    let fontStyle = '';
    if (isBold) fontStyle += 'bold ';
    if (isItalic) fontStyle += 'italic ';
    fontStyle += `${currentFontSize}px Arial, sans-serif`;
    
    ctx.font = fontStyle;
    
    // Split text into lines and handle word wrapping
    const lines: string[] = [];
    const textLines = text.split('\n');
    
    for (const line of textLines) {
      if (!line.trim()) {
        lines.push('');
        continue;
      }
      
      const words = line.split(' ');
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
    }

    const totalHeight = Math.max(lines.length * lineHeight + 40, 100);
    canvas.width = maxWidth;
    canvas.height = totalHeight;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = 'black';
    ctx.font = fontStyle;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top';

    let x = 10;
    if (textAlign === 'center') {
      x = maxWidth / 2;
    } else if (textAlign === 'right') {
      x = maxWidth - 10;
    }

    lines.forEach((line, index) => {
      const y = 20 + index * lineHeight;
      
      if (isUnderline) {
        const metrics = ctx.measureText(line);
        const underlineY = y + currentFontSize + 2;
        let underlineX = x;
        if (textAlign === 'center') {
          underlineX = x - metrics.width / 2;
        } else if (textAlign === 'right') {
          underlineX = x - metrics.width;
        }
        ctx.fillRect(underlineX, underlineY, metrics.width, 2);
      }
      
      ctx.fillText(line, x, y);
    });

    return canvas;
  };

  const handlePreview = () => {
    if (!text.trim()) return;
    setShowPreview(true);
  };

  useEffect(() => {
    if (showPreview && previewCanvasRef.current && text.trim()) {
      const canvas = renderTextToCanvas();
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        previewCanvasRef.current.width = canvas.width;
        previewCanvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
      }
    }
  }, [showPreview, text, isBold, isItalic, isUnderline, textAlign, fontSize]);

  const handlePrint = async () => {
    if (!text.trim() || !isConnected) return;

    try {
      const canvas = renderTextToCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const processed = processImageForPrinter(imageData, {
        dither: 'steinberg',
        rotate: 0,
        flip: 'none',
        brightness: 128,
      });

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Send Text</CardTitle>
          <CardDescription>Type and format text to print</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-muted/30">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={isBold ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsBold(!isBold)}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={isItalic ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsItalic(!isItalic)}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={isUnderline ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsUnderline(!isUnderline)}
                className="h-8 w-8 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-6 w-px bg-border mx-1" />
            
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={textAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('left')}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={textAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('center')}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={textAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTextAlign('right')}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={fontSize === 'small' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('small')}
                className="h-8 px-2 text-xs"
              >
                S
              </Button>
              <Button
                type="button"
                variant={fontSize === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('medium')}
                className="h-8 px-2 text-xs"
              >
                M
              </Button>
              <Button
                type="button"
                variant={fontSize === 'large' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFontSize('large')}
                className="h-8 px-2 text-xs"
              >
                L
              </Button>
            </div>
          </div>

          {/* Active Formatting Indicators */}
          {(isBold || isItalic || isUnderline) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active:</span>
              {isBold && <Badge variant="secondary" className="text-xs">Bold</Badge>}
              {isItalic && <Badge variant="secondary" className="text-xs">Italic</Badge>}
              {isUnderline && <Badge variant="secondary" className="text-xs">Underline</Badge>}
            </div>
          )}

          {/* Text Input */}
          <Textarea
            placeholder="Enter text to print..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="resize-none font-mono"
            style={{
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              textAlign: textAlign,
              fontSize: fontSizeMap[fontSize] + 'px',
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              disabled={!text.trim()}
              variant="outline"
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!isConnected || !text.trim() || isPrinting}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? 'Printing...' : 'Print'}
            </Button>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground text-center">
              Please connect to a printer first
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg">Text Preview</CardTitle>
                <CardDescription>How it will appear on thermal printer</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
                className="flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
              <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-gray-300 shadow-lg">
                <div className="bg-gray-100 p-2 rounded mb-2 text-xs text-gray-600 text-center">
                  Thermal Printer Preview (384px width)
                </div>
                <div className="flex justify-center bg-white p-2 sm:p-4 rounded overflow-x-auto">
                  <canvas
                    ref={previewCanvasRef}
                    className="border border-gray-300 shadow-sm"
                    style={{ 
                      imageRendering: 'pixelated', 
                      maxWidth: '100%', 
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-shrink-0">
                <Button
                  onClick={handlePrint}
                  disabled={!isConnected || isPrinting}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

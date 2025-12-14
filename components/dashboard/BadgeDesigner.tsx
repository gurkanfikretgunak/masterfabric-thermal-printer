'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateQRCode } from '@/lib/utils/qrcode';
import { Move, Type, Image as ImageIcon, QrCode, Trash2, Plus, Minus, ArrowUp, ArrowDown, Layers } from 'lucide-react';

export interface BadgeElement {
  id: string;
  type: 'text' | 'image' | 'qr';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  fontSize?: number;
  fontBold?: boolean;
  align?: 'left' | 'center' | 'right';
  imageSrc?: string;
  qrData?: string;
  qrSize?: number;
}

interface BadgeDesignerProps {
  badgeHeight: number;
  onBadgeHeightChange: (height: number) => void;
  elements: BadgeElement[];
  onElementsChange: (elements: BadgeElement[]) => void;
  eventName: string;
  attendeeName: string;
  logo: string | null;
  qrData: string;
  selectedElement?: string | null;
  onSelectedElementChange?: (id: string | null) => void;
  onLayerOrderUpdate?: (elements: BadgeElement[]) => void;
}

export default function BadgeDesigner({
  badgeHeight,
  onBadgeHeightChange,
  elements,
  onElementsChange,
  eventName,
  attendeeName,
  logo,
  qrData,
  selectedElement: externalSelectedElement,
  onSelectedElementChange,
  onLayerOrderUpdate,
}: BadgeDesignerProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(externalSelectedElement || null);
  
  // Sync external selected element
  useEffect(() => {
    if (externalSelectedElement !== undefined) {
      setSelectedElement(externalSelectedElement);
    }
  }, [externalSelectedElement]);

  const handleSelectElement = (id: string | null) => {
    setSelectedElement(id);
    onSelectedElementChange?.(id);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const badgeWidth = 384; // Thermal printer width

  const updateElement = (id: string, updates: Partial<BadgeElement>) => {
    onElementsChange(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    onElementsChange(elements.filter((el) => el.id !== id));
    handleSelectElement(null);
  };

  const addTextElement = () => {
    const newElement: BadgeElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: badgeWidth / 2,
      y: 50,
      content: 'Text',
      fontSize: 24,
      fontBold: false,
      align: 'center',
    };
    onElementsChange([...elements, newElement]);
    handleSelectElement(newElement.id);
  };

  const addImageElement = () => {
    logoInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newElement: BadgeElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        x: badgeWidth / 2,
        y: 100,
        width: 60,
        height: 60,
        imageSrc: event.target?.result as string,
      };
      onElementsChange([...elements, newElement]);
      handleSelectElement(newElement.id);
    };
    reader.readAsDataURL(file);
  };

  const addQRElement = () => {
    const newElement: BadgeElement = {
      id: `qr-${Date.now()}`,
      type: 'qr',
      x: badgeWidth / 2,
      y: 200,
      qrSize: 120,
      qrData: qrData || `${eventName} - ${attendeeName}`,
    };
    onElementsChange([...elements, newElement]);
    handleSelectElement(newElement.id);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    const element = elements.find((el) => el.id === elementId);
    if (!element) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate overlay position based on element type and alignment
    let overlayLeft: number;
    let overlayTop: number;
    let overlayWidth: number;
    let overlayHeight: number;

    if (element.type === 'text') {
      overlayWidth = 150;
      overlayHeight = element.fontSize ? element.fontSize + 10 : 30;
      
      if (element.align === 'center') {
        overlayLeft = element.x - overlayWidth / 2;
      } else if (element.align === 'right') {
        overlayLeft = element.x - overlayWidth;
      } else {
        overlayLeft = element.x;
      }
      overlayTop = element.y - overlayHeight / 2;
    } else if (element.type === 'qr') {
      overlayWidth = element.qrSize || 120;
      overlayHeight = element.qrSize || 120;
      overlayLeft = element.x - overlayWidth / 2;
      overlayTop = element.y - overlayHeight / 2;
    } else {
      overlayWidth = element.width || 60;
      overlayHeight = element.height || 60;
      overlayLeft = element.x - overlayWidth / 2;
      overlayTop = element.y - overlayHeight / 2;
    }

    // Calculate offset from overlay position
    const offsetX = mouseX - overlayLeft;
    const offsetY = mouseY - overlayTop;

    // Store the offset relative to the overlay, and also store element reference point
    setDragOffset({
      x: offsetX,
      y: offsetY,
    });
    setIsDragging(true);
    handleSelectElement(elementId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const element = elements.find((el) => el.id === selectedElement);
    if (!element) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new overlay position
    const newOverlayLeft = mouseX - dragOffset.x;
    const newOverlayTop = mouseY - dragOffset.y;

    // Convert overlay position back to element.x and element.y
    let newX: number;
    let newY: number;

    if (element.type === 'text') {
      const overlayWidth = 150;
      const overlayHeight = element.fontSize ? element.fontSize + 10 : 30;
      
      // Convert overlay position to element.x based on alignment
      if (element.align === 'center') {
        newX = newOverlayLeft + overlayWidth / 2;
      } else if (element.align === 'right') {
        newX = newOverlayLeft + overlayWidth;
      } else {
        newX = newOverlayLeft;
      }
      newY = newOverlayTop + overlayHeight / 2;
    } else if (element.type === 'qr') {
      const overlayWidth = element.qrSize || 120;
      const overlayHeight = element.qrSize || 120;
      newX = newOverlayLeft + overlayWidth / 2;
      newY = newOverlayTop + overlayHeight / 2;
    } else {
      const overlayWidth = element.width || 60;
      const overlayHeight = element.height || 60;
      newX = newOverlayLeft + overlayWidth / 2;
      newY = newOverlayTop + overlayHeight / 2;
    }

    // Clamp to canvas bounds
    newX = Math.max(0, Math.min(badgeWidth, newX));
    newY = Math.max(0, Math.min(badgeHeight, newY));

    updateElement(selectedElement, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderBadge = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = badgeWidth;
    canvas.height = badgeHeight;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, badgeWidth, badgeHeight);

    // Render all elements
    for (const element of elements) {
      if (element.type === 'text') {
        ctx.fillStyle = 'black';
        ctx.font = `${element.fontBold ? 'bold' : 'normal'} ${element.fontSize || 24}px Arial`;
        ctx.textAlign = element.align || 'left';
        
        // Use element.x directly - textAlign will handle alignment relative to this position
        // 'left': text starts at x
        // 'center': text centered at x
        // 'right': text ends at x
        ctx.fillText(element.content || '', element.x, element.y);
      } else if (element.type === 'image' && element.imageSrc) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = () => {
            const imgWidth = element.width || 60;
            const imgHeight = element.height || 60;
            const imgX = element.x - imgWidth / 2;
            const imgY = element.y - imgHeight / 2;
            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
            resolve(null);
          };
          img.onerror = resolve;
          img.src = element.imageSrc!;
        });
      } else if (element.type === 'qr') {
        try {
          const qrCanvas = await generateQRCode(
            element.qrData || qrData || `${eventName} - ${attendeeName}`,
            element.qrSize || 120
          );
          const qrX = element.x - (element.qrSize || 120) / 2;
          const qrY = element.y - (element.qrSize || 120) / 2;
          ctx.drawImage(qrCanvas, qrX, qrY);
        } catch (error) {
          console.error('QR render error:', error);
        }
      }
    }
  };

  useEffect(() => {
    renderBadge();
  }, [elements, badgeHeight, eventName, attendeeName, qrData]);

  const selectedElementData = elements.find((el) => el.id === selectedElement);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTextElement}
        >
          <Type className="h-4 w-4 mr-2" />
          Add Text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImageElement}
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Image
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQRElement}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Add QR Code
        </Button>
        {selectedElement && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => deleteElement(selectedElement)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Badge Height Control */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Badge Height</label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onBadgeHeightChange(Math.max(200, badgeHeight - 50))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            type="number"
            value={badgeHeight}
            onChange={(e) => onBadgeHeightChange(Math.max(200, Math.min(1000, Number(e.target.value))))}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            min="200"
            max="1000"
            step="50"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onBadgeHeightChange(Math.min(1000, badgeHeight + 50))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {badgeHeight}px height
        </p>
      </div>

      {/* Main Designer Layout - Canvas Left, Properties Right */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Side - Designer Canvas */}
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium text-foreground">Badge Designer</label>
          <div
            ref={containerRef}
            className="relative border-2 border-border rounded-lg bg-white overflow-hidden"
            style={{ width: '100%', maxWidth: `${badgeWidth}px`, margin: '0 auto' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              className="block w-full"
              style={{ imageRendering: 'pixelated' }}
            />
            
          {/* Element Overlays for Selection */}
          {elements.map((element) => {
            let width: number;
            let height: number;
            let left: number;
            let top: number;

            if (element.type === 'text') {
              // For text, use a fixed width for the overlay
              width = 150; // Approximate width for overlay
              height = element.fontSize ? element.fontSize + 10 : 30;
              
              // Position based on text alignment
              if (element.align === 'center') {
                left = element.x - width / 2;
              } else if (element.align === 'right') {
                left = element.x - width;
              } else {
                // 'left' or default
                left = element.x;
              }
              top = element.y - height / 2;
            } else if (element.type === 'qr') {
              width = element.qrSize || 120;
              height = element.qrSize || 120;
              left = element.x - width / 2;
              top = element.y - height / 2;
            } else {
              // image
              width = element.width || 60;
              height = element.height || 60;
              left = element.x - width / 2;
              top = element.y - height / 2;
            }
            
            return (
              <div
                key={element.id}
                className={`absolute border-2 cursor-move ${
                  selectedElement === element.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onClick={() => handleSelectElement(element.id)}
              />
            );
          })}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Click and drag elements to reposition • Click to select
          </p>
        </div>

        {/* Right Side - Element Properties Panel */}
        <div className="lg:w-80 flex-shrink-0">
          {selectedElementData ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Element Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
            {selectedElementData.type === 'text' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Text Content</label>
                  <input
                    type="text"
                    value={selectedElementData.content || ''}
                    onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Font Size</label>
                  <input
                    type="number"
                    value={selectedElementData.fontSize || 24}
                    onChange={(e) => updateElement(selectedElementData.id, { fontSize: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min="8"
                    max="72"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Alignment</label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <Button
                        key={align}
                        type="button"
                        variant={selectedElementData.align === align ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { align })}
                        className="flex-1"
                      >
                        {align}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedElementData.fontBold || false}
                    onChange={(e) => updateElement(selectedElementData.id, { fontBold: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm text-foreground">Bold</label>
                </div>
              </>
            )}

            {selectedElementData.type === 'image' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Width</label>
                  <input
                    type="number"
                    value={selectedElementData.width || 60}
                    onChange={(e) => updateElement(selectedElementData.id, { width: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min="20"
                    max="200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Height</label>
                  <input
                    type="number"
                    value={selectedElementData.height || 60}
                    onChange={(e) => updateElement(selectedElementData.id, { height: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min="20"
                    max="200"
                  />
                </div>
              </>
            )}

            {selectedElementData.type === 'qr' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">QR Code Data</label>
                  <input
                    type="text"
                    value={selectedElementData.qrData || ''}
                    onChange={(e) => updateElement(selectedElementData.id, { qrData: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="QR code content"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">QR Code Size</label>
                  <input
                    type="number"
                    value={selectedElementData.qrSize || 120}
                    onChange={(e) => updateElement(selectedElementData.id, { qrSize: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    min="60"
                    max="200"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">X</label>
                  <input
                    type="number"
                    value={selectedElementData.x}
                    onChange={(e) => updateElement(selectedElementData.id, { x: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    min="0"
                    max={badgeWidth}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Y</label>
                  <input
                    type="number"
                    value={selectedElementData.y}
                    onChange={(e) => updateElement(selectedElementData.id, { y: Number(e.target.value) })}
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    min="0"
                    max={badgeHeight}
                  />
                </div>
              </div>
            </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  Select an element to edit its properties
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden file input for images */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}


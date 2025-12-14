'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BadgeElement } from './BadgeDesigner';
import { Type, Image as ImageIcon, QrCode, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElementLayerListProps {
  elements: BadgeElement[];
  selectedElement: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export default function ElementLayerList({
  elements,
  selectedElement,
  onSelectElement,
  onMoveUp,
  onMoveDown,
  onBringToFront,
  onSendToBack,
}: ElementLayerListProps) {
  if (elements.length === 0) {
    return null;
  }

  const getElementIcon = (type: BadgeElement['type']) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'qr':
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getElementLabel = (element: BadgeElement, index: number) => {
    if (element.type === 'text') {
      return element.content || `Text ${index + 1}`;
    } else if (element.type === 'image') {
      return `Image ${index + 1}`;
    } else {
      return `QR Code ${index + 1}`;
    }
  };

  return (
    <Card className="flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Element Layers</CardTitle>
        <CardDescription className="text-xs">Reorder elements (top = front)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {elements.slice().reverse().map((element, reverseIndex) => {
          const actualIndex = elements.length - 1 - reverseIndex;
          const isSelected = selectedElement === element.id;
          
          return (
            <div
              key={element.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border transition-colors cursor-pointer",
                isSelected
                  ? "bg-blue-500/10 border-blue-500"
                  : "bg-muted/30 border-border hover:bg-muted/50"
              )}
              onClick={() => onSelectElement(element.id)}
            >
              <div className="flex-shrink-0 text-muted-foreground">
                {getElementIcon(element.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {getElementLabel(element, actualIndex)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Layer {actualIndex + 1} of {elements.length}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(actualIndex);
                  }}
                  disabled={actualIndex === elements.length - 1}
                  title="Bring Forward"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(actualIndex);
                  }}
                  disabled={actualIndex === 0}
                  title="Send Backward"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}


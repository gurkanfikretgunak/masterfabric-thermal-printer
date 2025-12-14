'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrinter } from '@/hooks/usePrinter';
import { Printer, Copy, Check, Eye, X, ChevronDown, ChevronUp } from 'lucide-react';
import { processImageForPrinter } from '@/lib/printer';
import { cn } from '@/lib/utils';

interface TextTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
}

const textTemplates: TextTemplate[] = [
  {
    id: '1',
    name: 'Receipt Header',
    description: 'Standard receipt header with company info',
    category: 'Receipt',
    content: '================================\n  MASTERFABRIC PRINTER\n  Thank you for your purchase!\n================================\n',
  },
  {
    id: '2',
    name: 'Receipt Footer',
    description: 'Standard receipt footer',
    category: 'Receipt',
    content: '\n--------------------------------\n  Thank you for shopping!\n  Visit us again soon\n--------------------------------\n',
  },
  {
    id: '3',
    name: 'Order Confirmation',
    description: 'Order confirmation template',
    category: 'Order',
    content: 'ORDER CONFIRMATION\n==================\nOrder #: [ORDER_NUMBER]\nDate: [DATE]\nTime: [TIME]\n\nItems:\n[ITEMS]\n\nTotal: $[TOTAL]\n',
  },
  {
    id: '4',
    name: 'Shipping Label',
    description: 'Shipping label template',
    category: 'Shipping',
    content: 'SHIPPING LABEL\n==============\nTo:\n[RECIPIENT_NAME]\n[ADDRESS]\n[CITY], [STATE] [ZIP]\n\nFrom:\n[YOUR_NAME]\n[YOUR_ADDRESS]\n',
  },
  {
    id: '5',
    name: 'Invoice',
    description: 'Simple invoice template',
    category: 'Invoice',
    content: 'INVOICE\n========\nInvoice #: [INVOICE_NUMBER]\nDate: [DATE]\nDue Date: [DUE_DATE]\n\nBill To:\n[CLIENT_NAME]\n[CLIENT_ADDRESS]\n\nItems:\n[ITEMS]\n\nSubtotal: $[SUBTOTAL]\nTax: $[TAX]\nTotal: $[TOTAL]\n',
  },
  {
    id: '6',
    name: 'Price Tag',
    description: 'Product price tag',
    category: 'Product',
    content: '================\n  [PRODUCT_NAME]\n  $[PRICE]\n  SKU: [SKU]\n================\n',
  },
  {
    id: '7',
    name: 'Event Ticket',
    description: 'Event ticket template',
    category: 'Ticket',
    content: '================================\n        EVENT TICKET\n================================\nEvent: [EVENT_NAME]\nDate: [DATE]\nTime: [TIME]\nVenue: [VENUE]\nTicket #: [TICKET_NUMBER]\n================================\n',
  },
  {
    id: '8',
    name: 'QR Code Label',
    description: 'Label with QR code placeholder',
    category: 'Label',
    content: 'SCAN QR CODE\n============\n[QR_CODE_PLACEHOLDER]\n\nItem: [ITEM_NAME]\nID: [ITEM_ID]\n',
  },
  {
    id: '9',
    name: 'Barcode Label',
    description: 'Barcode label template',
    category: 'Label',
    content: '[BARCODE]\n\nProduct: [PRODUCT_NAME]\nSKU: [SKU]\nPrice: $[PRICE]\n',
  },
  {
    id: '10',
    name: 'Return Label',
    description: 'Return authorization label',
    category: 'Return',
    content: 'RETURN AUTHORIZATION\n===================\nRMA #: [RMA_NUMBER]\nDate: [DATE]\n\nReturn To:\n[RETURN_ADDRESS]\n\nReason: [REASON]\n',
  },
  {
    id: '11',
    name: 'Pick List',
    description: 'Warehouse pick list',
    category: 'Warehouse',
    content: 'PICK LIST\n=========\nOrder #: [ORDER_NUMBER]\nDate: [DATE]\n\nItems to Pick:\n[ITEMS]\n\nLocation: [LOCATION]\n',
  },
  {
    id: '12',
    name: 'Delivery Note',
    description: 'Delivery note template',
    category: 'Delivery',
    content: 'DELIVERY NOTE\n=============\nDelivery #: [DELIVERY_NUMBER]\nDate: [DATE]\nDriver: [DRIVER_NAME]\n\nDeliver To:\n[ADDRESS]\n\nItems:\n[ITEMS]\n',
  },
  {
    id: '13',
    name: 'Inventory Tag',
    description: 'Inventory tracking tag',
    category: 'Inventory',
    content: 'INVENTORY TAG\n=============\nItem: [ITEM_NAME]\nSKU: [SKU]\nLocation: [LOCATION]\nQuantity: [QTY]\nLast Count: [DATE]\n',
  },
  {
    id: '14',
    name: 'Warranty Card',
    description: 'Product warranty card',
    category: 'Warranty',
    content: 'WARRANTY CARD\n=============\nProduct: [PRODUCT_NAME]\nSerial #: [SERIAL]\nPurchase Date: [DATE]\nWarranty: [PERIOD]\n\nCustomer:\n[NAME]\n[EMAIL]\n',
  },
  {
    id: '15',
    name: 'Gift Receipt',
    description: 'Gift receipt template',
    category: 'Receipt',
    content: 'GIFT RECEIPT\n============\nDate: [DATE]\n\nItems:\n[ITEMS]\n\nTotal: $[TOTAL]\n\n(No prices shown)\n',
  },
  {
    id: '16',
    name: 'Appointment Reminder',
    description: 'Appointment reminder card',
    category: 'Appointment',
    content: 'APPOINTMENT REMINDER\n===================\nDate: [DATE]\nTime: [TIME]\nService: [SERVICE]\n\nPlease arrive 10 minutes early\n\nContact: [PHONE]\n',
  },
  {
    id: '17',
    name: 'Loyalty Card',
    description: 'Customer loyalty card',
    category: 'Loyalty',
    content: 'LOYALTY CARD\n============\nCustomer: [NAME]\nCard #: [CARD_NUMBER]\n\nPoints: [POINTS]\n\nVisit us again!\n',
  },
  {
    id: '18',
    name: 'Coupon',
    description: 'Discount coupon template',
    category: 'Coupon',
    content: '================================\n        SPECIAL OFFER\n================================\n[COUPON_CODE]\n\nSave [DISCOUNT]%\n\nValid until: [DATE]\n\nTerms apply\n================================\n',
  },
  {
    id: '19',
    name: 'Work Order',
    description: 'Service work order',
    category: 'Service',
    content: 'WORK ORDER\n==========\nWO #: [WORK_ORDER_NUMBER]\nDate: [DATE]\n\nCustomer: [NAME]\nService: [SERVICE]\n\nTechnician: [TECH_NAME]\nStatus: [STATUS]\n\nNotes:\n[NOTES]\n',
  },
  {
    id: '20',
    name: 'Time Card',
    description: 'Employee time card',
    category: 'Time',
    content: 'TIME CARD\n=========\nEmployee: [NAME]\nID: [EMPLOYEE_ID]\nDate: [DATE]\n\nClock In: [IN_TIME]\nClock Out: [OUT_TIME]\n\nTotal Hours: [HOURS]\n',
  },
  {
    id: '21',
    name: 'Check-In Tag',
    description: 'Event or service check-in tag',
    category: 'Tag',
    content: 'CHECK-IN\n========\nName: [NAME]\nEvent: [EVENT]\nDate: [DATE]\nTime: [TIME]\n\nWelcome!\n',
  },
  {
    id: '22',
    name: 'Donation Receipt',
    description: 'Charity donation receipt',
    category: 'Receipt',
    content: 'DONATION RECEIPT\n===============\nDate: [DATE]\n\nDonor: [NAME]\nAmount: $[AMOUNT]\n\nThank you for your\ngenerous donation!\n\nTax ID: [TAX_ID]\n',
  },
  {
    id: '23',
    name: 'Menu Item',
    description: 'Restaurant menu item label',
    category: 'Menu',
    content: '[ITEM_NAME]\n------------\n$[PRICE]\n\n[DESCRIPTION]\n\nAllergens: [ALLERGENS]\n',
  },
  {
    id: '24',
    name: 'Parking Ticket',
    description: 'Parking validation ticket',
    category: 'Ticket',
    content: 'PARKING TICKET\n==============\nDate: [DATE]\nTime: [TIME]\n\nValid for: [DURATION]\n\nTicket #: [TICKET_NUMBER]\n',
  },
  {
    id: '25',
    name: 'Sample Label',
    description: 'Generic sample label',
    category: 'Label',
    content: 'SAMPLE\n======\nName: [NAME]\nDate: [DATE]\n\nDescription:\n[DESCRIPTION]\n',
  },
];

export default function TemplateList() {
  const [selectedTemplate, setSelectedTemplate] = useState<TextTemplate | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { print, isPrinting, isConnected } = usePrinter();

  const categories = Array.from(new Set(textTemplates.map(t => t.category)));

  // Initialize all categories as collapsed by default
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    categories.forEach(category => {
      initialExpanded[category] = false;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  useEffect(() => {
    if (previewCanvas && previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        previewCanvasRef.current.width = previewCanvas.width;
        previewCanvasRef.current.height = previewCanvas.height;
        ctx.drawImage(previewCanvas, 0, 0);
      }
    }
  }, [previewCanvas]);

  const renderTemplateToCanvas = (template: TextTemplate): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const maxWidth = 384;
    const fontSize = 24;
    const lineHeight = fontSize * 1.2;
    
    ctx.font = `${fontSize}px Arial, sans-serif`;
    
    const lines: string[] = [];
    const templateLines = template.content.split('\n');
    
    for (const line of templateLines) {
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

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'black';
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach((line, index) => {
      ctx.fillText(line, 10, 20 + index * lineHeight);
    });

    return canvas;
  };

  const handlePreview = (template: TextTemplate) => {
    const canvas = renderTemplateToCanvas(template);
    setPreviewCanvas(canvas);
    setSelectedTemplate(template);
  };

  const handlePrint = async (template: TextTemplate) => {
    if (!isConnected) return;

    try {
      const canvas = renderTemplateToCanvas(template);
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

  const handleCopy = (template: TextTemplate) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="overflow-hidden w-full h-full flex flex-col">
        <div className="pb-2 mb-4 flex-shrink-0 text-center">
          <h2 className="text-lg font-semibold text-foreground">Templates</h2>
          <p className="text-sm text-muted-foreground">{textTemplates.length} text templates available</p>
        </div>
        <div className="space-y-4 overflow-x-hidden overflow-y-auto flex-1 min-h-0 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const categoryTemplates = textTemplates.filter(t => t.category === category);
              const isExpanded = expandedCategories[category] ?? false;
              return (
                <div key={category} className="space-y-3">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group border border-border bg-card"
                  >
                    <h3 className="text-sm font-semibold text-foreground text-center flex-1">
                      {category}
                      <span className="text-xs text-muted-foreground ml-2 font-normal">
                        ({categoryTemplates.length})
                      </span>
                    </h3>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    )}
                  </button>
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-3 w-full transition-all duration-300 ease-in-out overflow-hidden",
                      isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    {categoryTemplates.map((template) => (
                    <Card key={template.id} className="border flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex flex-col flex-1 min-w-0 h-full">
                        <div className="flex flex-col items-center text-center mb-3 min-w-0">
                          <Badge variant="secondary" className="mb-2 text-xs whitespace-nowrap">
                            {template.category}
                          </Badge>
                          <h4 className="text-sm font-medium text-foreground leading-tight mb-1.5">{template.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words leading-relaxed">{template.description}</p>
                        </div>
                        <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(template)}
                            className="w-full h-9"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Preview
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handlePrint(template)}
                              disabled={!isConnected || isPrinting}
                              className="flex-1 h-9"
                            >
                              <Printer className="h-3.5 w-3.5 mr-1.5" />
                              {isPrinting ? '...' : 'Print'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(template)}
                              className="flex-1 h-9"
                            >
                              {copiedId === template.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 mr-1.5" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedTemplate && previewCanvas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg truncate">{selectedTemplate.name}</CardTitle>
                <CardDescription className="truncate">{selectedTemplate.category}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTemplate(null);
                  setPreviewCanvas(null);
                }}
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
                  onClick={() => handlePrint(selectedTemplate)}
                  disabled={!isConnected || isPrinting}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setPreviewCanvas(null);
                  }}
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

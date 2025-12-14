'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { processImageForPrinter } from '@/lib/printer';
import { generateQRCode } from '@/lib/utils/qrcode';
import { Printer, Eye, Upload, X, Layout, ChevronDown, ChevronUp, QrCode, Palette, Save, FileText } from 'lucide-react';
import BadgeDesigner, { BadgeElement } from './BadgeDesigner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type BadgeLayout = 'classic' | 'modern' | 'minimal' | 'elegant';

interface BadgeTemplate {
  id: string;
  name: string;
  description: string;
  layout: BadgeLayout;
  badgeHeight: number;
  logoPosition: 'top' | 'bottom';
  logoGap: number;
  logoRadius: number;
  qrSize: number;
}

const badgeTemplates: BadgeTemplate[] = [
  {
    id: 'classic-top',
    name: 'Classic Top Logo',
    description: 'Traditional badge with logo at top, centered layout. Perfect for conferences and formal events.',
    layout: 'classic',
    badgeHeight: 600,
    logoPosition: 'top',
    logoGap: 20,
    logoRadius: 0,
    qrSize: 120,
  },
  {
    id: 'classic-bottom',
    name: 'Classic Bottom Logo',
    description: 'Traditional badge with logo at bottom. Great for corporate events and workshops.',
    layout: 'classic',
    badgeHeight: 600,
    logoPosition: 'bottom',
    logoGap: 20,
    logoRadius: 0,
    qrSize: 120,
  },
  {
    id: 'modern-top',
    name: 'Modern Top Bar',
    description: 'Modern design with top bar and side-by-side layout. Ideal for tech conferences and startup events.',
    layout: 'modern',
    badgeHeight: 550,
    logoPosition: 'top',
    logoGap: 15,
    logoRadius: 0,
    qrSize: 120,
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Clean and simple design with minimal spacing. Perfect for minimalist events and modern gatherings.',
    layout: 'minimal',
    badgeHeight: 500,
    logoPosition: 'top',
    logoGap: 15,
    logoRadius: 0,
    qrSize: 100,
  },
  {
    id: 'elegant-rounded',
    name: 'Elegant Rounded',
    description: 'Elegant design with decorative borders and rounded logo. Best for gala events and formal ceremonies.',
    layout: 'elegant',
    badgeHeight: 650,
    logoPosition: 'top',
    logoGap: 25,
    logoRadius: 15,
    qrSize: 120,
  },
  {
    id: 'compact',
    name: 'Compact Badge',
    description: 'Compact design for smaller badges. Great for networking events and quick check-ins.',
    layout: 'minimal',
    badgeHeight: 400,
    logoPosition: 'top',
    logoGap: 10,
    logoRadius: 0,
    qrSize: 80,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Professional layout with balanced spacing. Suitable for business meetings and corporate gatherings.',
    layout: 'classic',
    badgeHeight: 580,
    logoPosition: 'top',
    logoGap: 18,
    logoRadius: 0,
    qrSize: 110,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Creative design with modern layout. Perfect for design conferences and creative workshops.',
    layout: 'modern',
    badgeHeight: 570,
    logoPosition: 'top',
    logoGap: 20,
    logoRadius: 8,
    qrSize: 115,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Standard badge layout with optimal spacing. Works well for most events and conferences.',
    layout: 'classic',
    badgeHeight: 550,
    logoPosition: 'top',
    logoGap: 15,
    logoRadius: 0,
    qrSize: 100,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Premium design with elegant spacing and rounded corners. Ideal for VIP events and exclusive gatherings.',
    layout: 'elegant',
    badgeHeight: 620,
    logoPosition: 'top',
    logoGap: 22,
    logoRadius: 12,
    qrSize: 125,
  },
];

interface SendEventProps {
  onPreviewUpdate?: (canvas: HTMLCanvasElement | null) => void;
  onNavigationCheck?: () => Promise<boolean>; // Returns true if navigation should proceed
  onDesignerElementsChange?: (elements: BadgeElement[]) => void;
  onSelectedDesignerElementChange?: (id: string | null) => void;
}

const DRAFT_STORAGE_KEY = 'badge-designer-draft';

interface BadgeDraft {
  eventName: string;
  attendeeName: string;
  logo: string | null;
  qrData: string;
  customBadgeHeight: number;
  designerElements: BadgeElement[];
  useDesigner: boolean;
  selectedTemplateId: string;
  timestamp: number;
}

export default function SendEvent({ 
  onPreviewUpdate, 
  onNavigationCheck,
  onDesignerElementsChange,
  onSelectedDesignerElementChange,
}: SendEventProps) {
  const [eventName, setEventName] = useState('Tech Conference 2024');
  const [attendeeName, setAttendeeName] = useState('John Smith');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BadgeTemplate>(badgeTemplates[0]);
  const [customBadgeHeight, setCustomBadgeHeight] = useState(600);
  const [useDesigner, setUseDesigner] = useState(false);
  const [designerElements, setDesignerElements] = useState<BadgeElement[]>([]);
  const [selectedDesignerElement, setSelectedDesignerElement] = useState<string | null>(null);
  const [qrData, setQrData] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarPreviewRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { print, isPrinting, isConnected } = usePrinter();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft: BadgeDraft = JSON.parse(savedDraft);
        setEventName(draft.eventName || 'Tech Conference 2024');
        setAttendeeName(draft.attendeeName || 'John Smith');
        setLogo(draft.logo);
        setQrData(draft.qrData || '');
        setCustomBadgeHeight(draft.customBadgeHeight || 600);
        setDesignerElements(draft.designerElements || []);
        setUseDesigner(draft.useDesigner || false);
        const template = badgeTemplates.find(t => t.id === draft.selectedTemplateId) || badgeTemplates[0];
        setSelectedTemplate(template);
        if (draft.timestamp) {
          setLastSaved(new Date(draft.timestamp));
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Notify parent of designer elements changes
  useEffect(() => {
    if (useDesigner && onDesignerElementsChange) {
      onDesignerElementsChange(designerElements);
    }
  }, [designerElements, useDesigner, onDesignerElementsChange]);

  // Notify parent of selected element changes
  useEffect(() => {
    if (useDesigner && onSelectedDesignerElementChange) {
      onSelectedDesignerElementChange(selectedDesignerElement);
    }
  }, [selectedDesignerElement, useDesigner, onSelectedDesignerElementChange]);

  // Auto-save draft when in designer mode
  useEffect(() => {
    if (useDesigner && (designerElements.length > 0 || eventName || attendeeName)) {
      const draft: BadgeDraft = {
        eventName,
        attendeeName,
        logo,
        qrData,
        customBadgeHeight,
        designerElements,
        useDesigner,
        selectedTemplateId: selectedTemplate.id,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }
  }, [eventName, attendeeName, logo, qrData, customBadgeHeight, designerElements, useDesigner, selectedTemplate.id]);

  // Track unsaved changes
  useEffect(() => {
    if (useDesigner && designerElements.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [designerElements, useDesigner]);

  // Save draft manually
  const saveDraft = () => {
    const draft: BadgeDraft = {
      eventName,
      attendeeName,
      logo,
      qrData,
      customBadgeHeight,
      designerElements,
      useDesigner,
      selectedTemplateId: selectedTemplate.id,
      timestamp: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
  };

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastSaved(null);
    setHasUnsavedChanges(false);
  };

  // Expose navigation check to parent
  useEffect(() => {
    if (onNavigationCheck) {
      // Store the check function in a way that parent can access
      (window as any).__badgeDesignerNavigationCheck = async () => {
        if (useDesigner && hasUnsavedChanges) {
          return new Promise<boolean>((resolve) => {
            setPendingNavigation(() => () => resolve(true));
            setShowNavigationWarning(true);
            // Store resolve function to call later
            (window as any).__badgeDesignerResolve = resolve;
          });
        }
        return true;
      };
    }
    return () => {
      delete (window as any).__badgeDesignerNavigationCheck;
      delete (window as any).__badgeDesignerResolve;
    };
  }, [useDesigner, hasUnsavedChanges, onNavigationCheck]);

  // Handle navigation away warning
  const handleNavigationAttempt = (navigationFn: () => void) => {
    if (useDesigner && hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowNavigationWarning(true);
    } else {
      navigationFn();
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    if ((window as any).__badgeDesignerResolve) {
      (window as any).__badgeDesignerResolve(true);
      delete (window as any).__badgeDesignerResolve;
    }
    setShowNavigationWarning(false);
    setHasUnsavedChanges(false);
  };

  const handleCancelNavigation = () => {
    if ((window as any).__badgeDesignerResolve) {
      (window as any).__badgeDesignerResolve(false);
      delete (window as any).__badgeDesignerResolve;
    }
    setPendingNavigation(null);
    setShowNavigationWarning(false);
  };

  // Apply template settings when template changes
  const applyTemplate = (template: BadgeTemplate) => {
    if (useDesigner && hasUnsavedChanges) {
      handleNavigationAttempt(() => {
        setSelectedTemplate(template);
        setUseDesigner(false);
      });
    } else {
      setSelectedTemplate(template);
      setUseDesigner(false);
    }
  };

  // Load logo image when logo URL changes
  useEffect(() => {
    if (logo) {
      const img = new Image();
      img.onload = () => {
        setLogoImage(img);
      };
      img.onerror = () => {
        setLogoImage(null);
      };
      img.src = logo;
    } else {
      setLogoImage(null);
    }
  }, [logo]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const renderBadge = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = 384; // Thermal printer width
    const height = selectedTemplate.badgeHeight;
    const layout = selectedTemplate.layout;
    const logoPosition = selectedTemplate.logoPosition;
    const logoGap = selectedTemplate.logoGap;
    const logoRadius = selectedTemplate.logoRadius;
    const qrSize = selectedTemplate.qrSize;

    canvas.width = width;
    canvas.height = height;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Generate QR code (now async)
    const qrText = qrData || `${eventName || 'Event'} - ${attendeeName || 'Attendee'}`;
    let qrCanvas: HTMLCanvasElement;
    try {
      qrCanvas = await generateQRCode(qrText, qrSize);
    } catch (error) {
      console.error('QR code generation error:', error);
      // Create a fallback QR code placeholder
      qrCanvas = document.createElement('canvas');
      qrCanvas.width = qrSize;
      qrCanvas.height = qrSize;
      const qrCtx = qrCanvas.getContext('2d');
      if (qrCtx) {
        qrCtx.fillStyle = 'white';
        qrCtx.fillRect(0, 0, qrSize, qrSize);
        qrCtx.fillStyle = 'black';
        qrCtx.font = '12px Arial';
        qrCtx.textAlign = 'center';
        qrCtx.fillText('QR ERROR', qrSize / 2, qrSize / 2);
      }
    }

    // Helper function to draw logo with rounded corners
    const drawLogo = (x: number, y: number, size: number) => {
      if (!logoImage) return;
      
      if (logoRadius > 0) {
        // Draw rounded rectangle logo using path
        ctx.save();
        ctx.beginPath();
        const radius = Math.min(logoRadius, size / 2);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImage, x, y, size, size);
        ctx.restore();
      } else {
        // Draw regular logo
        ctx.drawImage(logoImage, x, y, size, size);
      }
    };

    if (layout === 'classic') {
      // Classic Layout: Logo top/bottom, Event name, Attendee name, QR code
      let y = logoGap;

      // Logo at top if position is top
      if (logoImage && logoPosition === 'top') {
        const logoSize = 60;
        const logoX = (width - logoSize) / 2;
        drawLogo(logoX, y, logoSize);
        y += logoSize + logoGap;
      }

      // Event name
      ctx.fillStyle = 'black';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(eventName || 'Event Name', width / 2, y);
      y += 40;

      // Divider line
      ctx.fillRect(20, y, width - 40, 2);
      y += 30;

      // Attendee name
      ctx.font = 'bold 24px Arial';
      ctx.fillText(attendeeName || 'Attendee Name', width / 2, y);
      y += 50;

      // QR code at bottom
      const qrX = (width - qrSize) / 2;
      // Ensure QR code is drawn
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, y, qrSize, qrSize);
      }
      y += qrSize + 15;

      // QR text below
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText(qrText.substring(0, 40), width / 2, y);
      y += 20;

      // Logo at bottom if position is bottom
      if (logoImage && logoPosition === 'bottom') {
        const logoSize = 60;
        const logoX = (width - logoSize) / 2;
        const logoY = height - logoSize - logoGap;
        drawLogo(logoX, logoY, logoSize);
      }

      // Height is fixed to badgeHeight
    } else if (layout === 'modern') {
      // Modern Layout: Top bar, side-by-side layout
      let y = 20;

      // Top bar
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, 40);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(eventName || 'Event Name', width / 2, 28);

      y = 60;

      // Left side - Logo
      if (logoImage) {
        const logoSize = 80;
        ctx.drawImage(logoImage, 30, y, logoSize, logoSize);
      }

      // Right side - Attendee name
      ctx.fillStyle = 'black';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(attendeeName || 'Attendee Name', width - 200, y + 40);

      y = 180;

      // QR code centered
      const qrX = (width - qrSize) / 2;
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, y, qrSize, qrSize);
      }
      y += qrSize + 20;

      // Bottom bar
      ctx.fillStyle = 'black';
      ctx.fillRect(0, y, width, 30);

      // Ensure content fits within badge height
      if (y + 30 > height) {
        // Content exceeds height, but we'll still render it
      }
    } else if (layout === 'minimal') {
      // Minimal Layout: Clean and simple
      let y = logoGap;

      // Logo at top if position is top
      if (logoImage && logoPosition === 'top') {
        const logoSize = 40;
        const logoX = (width - logoSize) / 2;
        drawLogo(logoX, y, logoSize);
        y += logoSize + logoGap;
      }

      // Event name at top
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(eventName || 'Event Name', width / 2, y);
      y += 50;

      // Thin divider
      ctx.fillRect(40, y, width - 80, 1);
      y += 30;

      // Attendee name
      ctx.font = '20px Arial';
      ctx.fillText(attendeeName || 'Attendee Name', width / 2, y);
      y += 60;

      // QR code
      const qrX = (width - qrSize) / 2;
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, y, qrSize, qrSize);
      }
      y += qrSize + 20;

      // Logo at bottom if position is bottom
      if (logoImage && logoPosition === 'bottom') {
        const logoSize = 40;
        const logoX = (width - logoSize) / 2;
        const logoY = height - logoSize - logoGap;
        drawLogo(logoX, logoY, logoSize);
      }

      // Ensure content fits within badge height
      if (y > height) {
        // Content exceeds height, but we'll still render it
      }
    } else if (layout === 'elegant') {
      // Elegant Layout: Decorative borders and centered design
      let y = 20;

      // Top decorative border
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, 4);
      ctx.fillRect(0, 8, width, 2);
      y = 30;

      // Logo at top
      if (logoImage) {
        const logoSize = 50;
        const logoX = (width - logoSize) / 2;
        ctx.drawImage(logoImage, logoX, y, logoSize, logoSize);
        y += logoSize + 25;
      }

      // Event name with underline
      ctx.fillStyle = 'black';
      ctx.font = 'bold 26px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(eventName || 'Event Name', width / 2, y);
      const eventMetrics = ctx.measureText(eventName || 'Event Name');
      ctx.fillRect((width - eventMetrics.width) / 2 - 10, y + 5, eventMetrics.width + 20, 2);
      y += 50;

      // Attendee name
      ctx.font = '22px Arial';
      ctx.fillText(attendeeName || 'Attendee Name', width / 2, y);
      y += 60;

      // QR code with decorative border
      const qrX = (width - qrSize) / 2;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 5, y - 5, qrSize + 10, qrSize + 10);
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, y, qrSize, qrSize);
      }
      y += qrSize + 25;

      // QR text
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText(qrText.substring(0, 35), width / 2, y);

      // Bottom decorative border
      ctx.fillRect(0, y + 20, width, 2);
      ctx.fillRect(0, y + 26, width, 2);

      // Logo at bottom if position is bottom
      if (logoImage && logoPosition === 'bottom') {
        const logoSize = 50;
        const logoX = (width - logoSize) / 2;
        const logoY = height - logoSize - logoGap - 30;
        drawLogo(logoX, logoY, logoSize);
      }

      // Ensure content fits within badge height
      if (y + 30 > height) {
        // Content exceeds height, but we'll still render it
      }
    }

    // Use the user-defined badge height
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = width;
    finalCanvas.height = height;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
      finalCtx.fillStyle = 'white';
      finalCtx.fillRect(0, 0, width, height);
      finalCtx.drawImage(canvas, 0, 0);
    }

    return finalCanvas;
  };

  const handlePreview = () => {
    if (!eventName.trim() || !attendeeName.trim()) return;
    setShowPreview(true);
  };

  // Update sidebar preview whenever badge data changes (only in template mode)
  useEffect(() => {
    const updateSidebarPreview = async () => {
      // Don't show preview in designer mode
      if (useDesigner) {
        if (onPreviewUpdate) {
          onPreviewUpdate(null);
        }
        return;
      }

      if (eventName.trim() && attendeeName.trim()) {
        try {
          const canvas = await renderBadge();
          const ctx = sidebarPreviewRef.current?.getContext('2d');
          if (ctx && sidebarPreviewRef.current) {
            sidebarPreviewRef.current.width = canvas.width;
            sidebarPreviewRef.current.height = canvas.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, sidebarPreviewRef.current.width, sidebarPreviewRef.current.height);
            ctx.drawImage(canvas, 0, 0);
            // Notify parent component
            if (onPreviewUpdate) {
              onPreviewUpdate(canvas);
            }
          }
        } catch (error) {
          console.error('Sidebar preview render error:', error);
          if (onPreviewUpdate) {
            onPreviewUpdate(null);
          }
        }
      } else {
        if (onPreviewUpdate) {
          onPreviewUpdate(null);
        }
      }
    };

    if (logo && !logoImage) {
      // Wait for logo to load
      const checkLogo = setInterval(() => {
        if (logoImage) {
          clearInterval(checkLogo);
          updateSidebarPreview();
        }
      }, 50);
      
      setTimeout(() => {
        clearInterval(checkLogo);
        updateSidebarPreview();
      }, 2000);

      return () => clearInterval(checkLogo);
    } else {
      const timer = setTimeout(updateSidebarPreview, 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, attendeeName, logoImage, qrData, selectedTemplate, customBadgeHeight, useDesigner, designerElements, logo, onPreviewUpdate]);

  // Modal preview effect
  useEffect(() => {
    if (showPreview && previewCanvasRef.current && eventName.trim() && attendeeName.trim()) {
      const renderPreview = async () => {
        try {
          const canvas = await renderBadge();
          const ctx = previewCanvasRef.current?.getContext('2d');
          if (ctx && previewCanvasRef.current) {
            previewCanvasRef.current.width = canvas.width;
            previewCanvasRef.current.height = canvas.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
            ctx.drawImage(canvas, 0, 0);
          }
        } catch (error) {
          console.error('Preview render error:', error);
        }
      };

      if (logo && !logoImage) {
        const checkLogo = setInterval(() => {
          if (logoImage) {
            clearInterval(checkLogo);
            renderPreview();
          }
        }, 50);
        
        setTimeout(() => {
          clearInterval(checkLogo);
          renderPreview();
        }, 2000);

        return () => clearInterval(checkLogo);
      } else {
        const timer = setTimeout(() => {
          renderPreview();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [showPreview, eventName, attendeeName, logoImage, qrData, selectedTemplate, customBadgeHeight, useDesigner, designerElements, logo]);

  const handlePrint = async () => {
    if (!eventName.trim() || !attendeeName.trim() || !isConnected) return;

    try {
      const canvas = await renderBadge();
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
          <CardTitle>Event Badge</CardTitle>
          <CardDescription>Create event attendee badges with QR codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Badge Creation Mode</label>
              {useDesigner && (
                <div className="flex items-center gap-2">
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={saveDraft}
                    className="h-8"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save Draft
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useDesigner ? 'default' : 'outline'}
                onClick={() => {
                  if (useDesigner && hasUnsavedChanges) {
                    handleNavigationAttempt(() => setUseDesigner(false));
                  } else {
                    setUseDesigner(false);
                  }
                }}
                className="flex-1"
              >
                <Layout className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button
                type="button"
                variant={useDesigner ? 'default' : 'outline'}
                onClick={() => setUseDesigner(true)}
                className="flex-1"
              >
                <Palette className="h-4 w-4 mr-2" />
                Designer
              </Button>
            </div>
          </div>

          {useDesigner ? (
            /* Badge Designer Mode */
            <BadgeDesigner
              badgeHeight={customBadgeHeight}
              onBadgeHeightChange={setCustomBadgeHeight}
              elements={designerElements}
              onElementsChange={setDesignerElements}
              eventName={eventName}
              attendeeName={attendeeName}
              logo={logo}
              qrData={qrData}
              selectedElement={selectedDesignerElement}
              onSelectedElementChange={setSelectedDesignerElement}
              onLayerOrderUpdate={setDesignerElements}
            />
          ) : (
            /* Template Mode */
            <>
              {/* Badge Template Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Badge Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {badgeTemplates.map((template) => (
                    <Button
                      key={template.id}
                      type="button"
                      variant={selectedTemplate.id === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template)}
                      className="h-auto py-3 flex flex-col items-start gap-1 text-left"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Layout className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-medium flex-1">{template.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground text-left leading-tight">{template.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Event Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Attendee Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Attendee Name (Full)</label>
            <input
              type="text"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              placeholder="Enter attendee full name..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Logo (Optional)</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {logo ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {logo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLogo(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {logo && (
              <div className="mt-2 rounded-md border border-border p-2 bg-muted/30">
                <img 
                  src={logo} 
                  alt="Logo preview" 
                  className="h-16 w-auto mx-auto"
                  style={{ borderRadius: `${selectedTemplate.logoRadius}px` }}
                />
              </div>
            )}
          </div>

          {/* QR Code Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">QR Code Data (Optional)</label>
            <input
              type="text"
              value={qrData}
              onChange={(e) => setQrData(e.target.value)}
              placeholder="Auto-generated from event + attendee name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from event name and attendee name
            </p>
          </div>

          {/* Advanced Options - Collapsible */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span>Advanced Options</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                {useDesigner ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Custom Badge Settings</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Badge Height:</strong> {customBadgeHeight}px</p>
                      <p><strong>Elements:</strong> {designerElements.length}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Current Template Settings</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Template:</strong> {selectedTemplate.name}</p>
                        <p><strong>Layout:</strong> {selectedTemplate.layout}</p>
                        <p><strong>Badge Height:</strong> {selectedTemplate.badgeHeight}px</p>
                        <p><strong>Logo Position:</strong> {selectedTemplate.logoPosition}</p>
                        <p><strong>Logo Gap:</strong> {selectedTemplate.logoGap}px</p>
                        <p><strong>Logo Radius:</strong> {selectedTemplate.logoRadius}px</p>
                        <p><strong>QR Code Size:</strong> {selectedTemplate.qrSize}px</p>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-sm font-medium text-foreground">Custom Badge Height (Override)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="200"
                          max="1000"
                          step="50"
                          value={customBadgeHeight}
                          onChange={(e) => setCustomBadgeHeight(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground min-w-[4rem] text-right">
                          {customBadgeHeight}px
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Override template height (200px - 1000px)
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      To fully customize, switch to Designer mode above.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

              {/* Hidden canvas for sidebar preview */}
              <canvas ref={sidebarPreviewRef} className="hidden" />

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handlePreview}
                  disabled={!eventName.trim() || !attendeeName.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={!isConnected || !eventName.trim() || !attendeeName.trim() || isPrinting}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print Badge'}
                </Button>
              </div>

              {!isConnected && (
                <p className="text-sm text-muted-foreground text-center">
                  Please connect to a printer first
                </p>
              )}
            </>
          )}

          {/* Hidden canvas for sidebar preview (for designer mode) */}
          {useDesigner && <canvas ref={sidebarPreviewRef} className="hidden" />}

          {/* Action Buttons (for designer mode) */}
          {useDesigner && (
            <>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handlePreview}
                  disabled={designerElements.length === 0}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={!isConnected || designerElements.length === 0 || isPrinting}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print Badge'}
                </Button>
              </div>

              {!isConnected && (
                <p className="text-sm text-muted-foreground text-center">
                  Please connect to a printer first
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation Warning Dialog */}
      <AlertDialog open={showNavigationWarning} onOpenChange={setShowNavigationWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in the designer. Do you want to save your draft before navigating away?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                saveDraft();
                handleConfirmNavigation();
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save & Leave
            </Button>
            <AlertDialogAction
              onClick={() => {
                clearDraft();
                handleConfirmNavigation();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-hidden">
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg">Badge Preview</CardTitle>
                <CardDescription>{selectedTemplate.name} Template</CardDescription>
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
                  {isPrinting ? 'Printing...' : 'Print Badge'}
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

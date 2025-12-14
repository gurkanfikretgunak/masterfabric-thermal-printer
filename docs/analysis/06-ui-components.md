# UI Components Analysis (shadcn/ui)

## Overview

The UI layer uses shadcn/ui components to create a responsive, accessible interface for the thermal printer PWA. The design follows a mobile-first, centered white hierarchy approach.

---

## Required shadcn/ui Components

```bash
npx shadcn-ui@latest add button card input textarea tabs badge progress dialog toast alert slider select
```

| Component | Purpose |
|-----------|---------|
| `Button` | Actions (connect, print, etc.) |
| `Card` | Content containers |
| `Input` | Text fields |
| `Textarea` | Multi-line text input |
| `Tabs` | Dashboard navigation |
| `Badge` | Status indicators |
| `Progress` | Print progress |
| `Dialog` | Modals (settings, confirmations) |
| `Toast` | Notifications |
| `Alert` | Warnings (browser compatibility) |
| `Slider` | Brightness, intensity controls |
| `Select` | Dither method selection |

---

## App Screen Components

### 1. Splash Screen

```tsx
// components/splash/SplashScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
      <div className={`transition-all duration-500 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <Printer className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Printer App
          </h1>
          <p className="text-sm text-muted-foreground">
            Thermal Printer Manager
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. Onboarding Components

```tsx
// components/onboarding/OnboardingStep.tsx
'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
}

export function OnboardingStep({
  step,
  totalSteps,
  title,
  description,
  icon,
  onNext,
  onSkip,
  nextLabel = 'Next',
}: OnboardingStepProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      
      <CardContent>
        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Skip
          </Button>
        )}
        <Button onClick={onNext} className="flex-1">
          {nextLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 3. Dashboard Layout

```tsx
// app/dashboard/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { SendTextTab } from '@/components/dashboard/SendTextTab';
import { SendImageTab } from '@/components/dashboard/SendImageTab';
import { TemplatesTab } from '@/components/dashboard/TemplatesTab';
import { MobileContainer } from '@/components/layout/MobileContainer';

export default function DashboardPage() {
  return (
    <MobileContainer>
      {/* Connection Status Header */}
      <ConnectionStatus className="mb-4" />

      {/* Main Tabs */}
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-4">
          <SendTextTab />
        </TabsContent>
        
        <TabsContent value="image" className="mt-4">
          <SendImageTab />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </MobileContainer>
  );
}
```

---

### 4. Connection Status

```tsx
// components/dashboard/ConnectionStatus.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bluetooth, BluetoothOff, Loader2, Settings } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { 
    isConnected, 
    isConnecting, 
    statusMessage, 
    printerState,
    connect, 
    disconnect 
  } = usePrinter();

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Bluetooth className="w-5 h-5 text-green-600" />
          ) : (
            <BluetoothOff className="w-5 h-5 text-muted-foreground" />
          )}
          
          <div>
            <p className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
            <p className="text-xs text-muted-foreground">
              {statusMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Printer status badges */}
          {printerState && (
            <div className="hidden sm:flex gap-1">
              {printerState.out_of_paper && (
                <Badge variant="destructive" className="text-xs">No Paper</Badge>
              )}
              {printerState.battery_low && (
                <Badge variant="outline" className="text-xs">Low Battery</Badge>
              )}
            </div>
          )}

          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### 5. Send Text Tab

```tsx
// components/dashboard/SendTextTab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Save, Loader2 } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { textToImageData } from '@/lib/textRenderer';

export function SendTextTab() {
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left');
  const { isConnected, isPrinting, print } = usePrinter();

  const fontSizeMap = { small: 16, medium: 24, large: 32 };

  const handlePrint = async () => {
    if (!text.trim()) return;
    
    const imageData = textToImageData(text, {
      fontSize: fontSizeMap[fontSize],
      align,
    });
    
    await print({
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Send Text</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter text to print..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[150px] resize-none"
        />
        
        <div className="flex gap-2">
          <Select value={fontSize} onValueChange={(v) => setFontSize(v as any)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={align} onValueChange={(v) => setAlign(v as any)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" disabled={!text.trim()}>
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
        <Button 
          className="flex-1" 
          onClick={handlePrint}
          disabled={!isConnected || !text.trim() || isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 mr-2" />
          )}
          Print
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 6. Send Image Tab

```tsx
// components/dashboard/SendImageTab.tsx
'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Printer, Loader2, RotateCw } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { loadAndResizeImage } from '@/lib/imageLoader';
import { ImagePreview } from './ImagePreview';
import type { DitherMethod } from '@/lib/printer';

export function SendImageTab() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [ditherMethod, setDitherMethod] = useState<DitherMethod>('steinberg');
  const [brightness, setBrightness] = useState(1.0);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  
  const { isConnected, isPrinting, print } = usePrinter();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const data = await loadAndResizeImage(file);
    setImageData(data);
    setFileName(file.name);
  }, []);

  const handlePrint = async () => {
    if (!imageData) return;
    
    await print({
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
    }, {
      dither: ditherMethod,
      brightness,
      rotate: rotation,
      flip: 'none',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Send Image</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File upload */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label 
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {fileName || 'Click to upload image'}
            </span>
          </label>
        </div>

        {/* Preview */}
        {imageData && (
          <ImagePreview
            imageData={imageData}
            ditherMethod={ditherMethod}
            brightness={brightness}
            rotation={rotation}
          />
        )}

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm w-20">Dither:</span>
            <Select value={ditherMethod} onValueChange={(v) => setDitherMethod(v as DitherMethod)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="threshold">Threshold</SelectItem>
                <SelectItem value="steinberg">Floyd-Steinberg</SelectItem>
                <SelectItem value="bayer">Bayer</SelectItem>
                <SelectItem value="atkinson">Atkinson</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm w-20">Brightness:</span>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={0.5}
              max={1.5}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm w-10 text-right">{brightness.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm w-20">Rotate:</span>
            <div className="flex gap-1">
              {([0, 90, 180, 270] as const).map((deg) => (
                <Button
                  key={deg}
                  variant={rotation === deg ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRotation(deg)}
                >
                  {deg}°
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handlePrint}
          disabled={!isConnected || !imageData || isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 mr-2" />
          )}
          Print Image
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 7. Templates Tab

```tsx
// components/dashboard/TemplatesTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { TemplateService, type Template } from '@/lib/db';

export function TemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const all = await TemplateService.getAll();
    setTemplates(all);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    await TemplateService.delete(id);
    loadTemplates();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No templates saved yet.</p>
          <p className="text-sm mt-1">Create templates from the Text or Image tabs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {template.type === 'text' ? (
                <FileText className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{template.name}</p>
                <Badge variant="outline" className="text-xs">
                  {template.type}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button size="sm" variant="ghost">
                <Printer className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### 8. Print Progress Dialog

```tsx
// components/dashboard/PrintProgressDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PrintProgressDialogProps {
  open: boolean;
  progress: number;
  status: 'printing' | 'success' | 'error';
  errorMessage?: string;
}

export function PrintProgressDialog({
  open,
  progress,
  status,
  errorMessage,
}: PrintProgressDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'printing' && 'Printing...'}
            {status === 'success' && 'Print Complete!'}
            {status === 'error' && 'Print Failed'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center gap-4">
          {status === 'printing' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Sending data to printer... {progress}%
              </p>
            </>
          )}
          
          {status === 'success' && (
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-destructive" />
              <p className="text-sm text-destructive text-center">
                {errorMessage || 'An error occurred while printing.'}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Toast Notifications Setup

```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

// Usage in components
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Print Complete',
      description: 'Your content has been printed successfully.',
    });
  };

  const handleError = (error: string) => {
    toast({
      variant: 'destructive',
      title: 'Print Failed',
      description: error,
    });
  };
}
```

---

## Browser Compatibility Alert

```tsx
// components/alerts/BrowserCompatibilityAlert.tsx
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function BrowserCompatibilityAlert() {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' && 
      'bluetooth' in navigator
    );
  }, []);

  if (isSupported) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Browser Not Supported</AlertTitle>
      <AlertDescription>
        Web Bluetooth is not available in this browser. 
        Please use Chrome, Edge, or Opera on desktop.
      </AlertDescription>
    </Alert>
  );
}
```

---

## Testing Checklist

- [ ] Test all components render correctly
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test touch interactions
- [ ] Test loading states
- [ ] Test error states
- [ ] Test toast notifications
- [ ] Verify accessibility (WCAG AA)

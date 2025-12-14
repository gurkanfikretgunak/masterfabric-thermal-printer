# Mobile-First PWA Design Analysis

## Overview

This document defines the mobile-first, centered white hierarchy design system for the Printer App PWA using shadcn/ui components.

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **White Hierarchy** | Clean white backgrounds with subtle gray separators |
| **Centered Layout** | All content centered with max-width constraints |
| **Mobile-First** | Design for 320px+ screens, scale up for desktop |
| **Touch-Friendly** | Minimum 44px touch targets, generous spacing |
| **PWA Optimized** | Installable, works offline, native-like experience |

---

## App Flow Screens

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Splash    │────►│  Onboarding │────►│   Session   │
│   Screen    │     │  (3 steps)  │     │   Check     │
│   (2 sec)   │     │             │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Dashboard  │
                                        │  - Text     │
                                        │  - Image    │
                                        │  - Templates│
                                        └─────────────┘
```

---

## Color System (White Hierarchy)

```css
:root {
  /* Background Layers */
  --background: 0 0% 100%;           /* Pure white - main bg */
  --card: 0 0% 100%;                 /* White cards */
  --muted: 0 0% 98%;                 /* Subtle gray sections */
  
  /* Borders & Dividers */
  --border: 0 0% 94%;                /* Light gray borders */
  --ring: 0 0% 90%;                  /* Focus rings */
  
  /* Text Hierarchy */
  --foreground: 0 0% 9%;             /* Primary text - near black */
  --muted-foreground: 0 0% 45%;      /* Secondary text */
  
  /* Accent (Brand) */
  --primary: 0 0% 9%;                /* Dark buttons */
  --primary-foreground: 0 0% 100%;   /* White text on dark */
  
  /* Status Colors */
  --destructive: 0 84% 60%;          /* Error states */
  --success: 142 76% 36%;            /* Success/Connected */
}
```

---

## Responsive Breakpoints

```typescript
const breakpoints = {
  xs: '320px',   // Small phones
  sm: '375px',   // Standard phones (iPhone SE+)
  md: '428px',   // Large phones (iPhone Pro Max)
  lg: '768px',   // Tablets
  xl: '1024px',  // Desktop
};
```

---

## Mobile Container Component

```tsx
// components/layout/MobileContainer.tsx
'use client';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Safe area padding for notched devices */}
      <div className={cn(
        "mx-auto w-full max-w-md px-4 pb-safe pt-safe sm:px-6",
        className
      )}>
        <div className="flex min-h-screen flex-col py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Safe Area CSS

```css
/* globals.css */
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## Screen Layouts

### Splash Screen Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│          ┌───────────┐          │
│          │    🖨️     │          │
│          │   Logo    │          │
│          └───────────┘          │
│                                 │
│         Printer App             │
│     Thermal Printer Manager     │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Onboarding Layout

```
┌─────────────────────────────────┐
│                                 │
│          ┌───────────┐          │
│          │   Icon    │          │
│          └───────────┘          │
│                                 │
│           Title Text            │
│                                 │
│       Description paragraph     │
│       with explanation          │
│                                 │
│            ● ○ ○                │
│                                 │
│   ┌──────────┐ ┌──────────┐    │
│   │   Skip   │ │   Next   │    │
│   └──────────┘ └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │ 🔵 Connected  [Disconnect]│   │
│  │ Status message           │   │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────┬─────┬──────────────┐   │
│  │Text │Image│  Templates   │   │
│  └─────┴─────┴──────────────┘   │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │    Tab Content Area     │    │
│  │                         │    │
│  │    - Text input         │    │
│  │    - Image upload       │    │
│  │    - Template list      │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │     Print Button        │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## Component Spacing System

### Vertical Rhythm

```
Header Section     → mb-6 (24px)
Card Component     → mb-4 (16px)
Card Content       → space-y-4 (16px gaps)
Form Elements      → space-y-3 (12px gaps)
Button Groups      → gap-2 (8px)
```

### Touch Target Sizing

| Element | Minimum Size | Recommended |
|---------|-------------|-------------|
| Buttons | 44px height | 48px height |
| Inputs | 44px height | 48px height |
| Touch areas | 44x44px | 48x48px |
| Icon buttons | 40x40px | 44x44px |

---

## Mobile-Optimized Components

### Full-Width Button

```tsx
// components/ui/mobile-button.tsx
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MobileButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export function MobileButton({ 
  children, 
  isLoading, 
  disabled,
  className, 
  ...props 
}: MobileButtonProps) {
  return (
    <Button
      className={cn(
        'h-12 w-full text-base font-medium',
        'active:scale-[0.98] transition-transform',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
```

### Mobile Input

```tsx
// components/ui/mobile-input.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function MobileInput({ label, className, ...props }: MobileInputProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <Input
        className={cn(
          'h-12 w-full text-base',
          'border-border/50 bg-white',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          className
        )}
        {...props}
      />
    </div>
  );
}
```

---

## PWA Configuration

### Viewport Meta

```html
<!-- app/layout.tsx -->
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
/>

<!-- PWA / Mobile App Feel -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="theme-color" content="#ffffff" />
```

### Manifest.json

```json
{
  "name": "Printer App",
  "short_name": "Printer",
  "description": "Thermal Printer Manager",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Touch Interaction States

```css
/* Touch feedback for buttons */
.touch-active {
  @apply active:scale-[0.98] active:opacity-90;
  transition: transform 0.1s, opacity 0.1s;
}

/* Disable hover on touch devices */
@media (hover: none) {
  .hover\:bg-accent:hover {
    background-color: inherit;
  }
}

/* Increase tap highlight */
button, a, [role="button"] {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}
```

---

## Offline Indicator

```tsx
// components/layout/OfflineIndicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-sm z-50">
      <WifiOff className="inline w-4 h-4 mr-1" />
      You're offline - App works in offline mode
    </div>
  );
}
```

---

## Testing Checklist (Mobile)

### Screen Sizes
- [ ] iPhone SE (375x667)
- [ ] iPhone 14 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Android small (360x640)
- [ ] Android large (412x915)

### Interactions
- [ ] Touch targets ≥ 44px
- [ ] Input focus doesn't zoom
- [ ] Keyboard doesn't overlap inputs
- [ ] Scroll behavior smooth
- [ ] Pull-to-refresh disabled

### Visual
- [ ] White hierarchy clear
- [ ] Text readable (16px+ body)
- [ ] Contrast WCAG AA
- [ ] Cards have subtle shadows
- [ ] Centered alignment consistent

### PWA
- [ ] Installable on iOS
- [ ] Installable on Android
- [ ] Works offline
- [ ] Splash screen shows on launch
- [ ] Status bar styling correct

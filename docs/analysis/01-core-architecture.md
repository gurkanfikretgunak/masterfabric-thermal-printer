# Core Architecture: Offline-First PWA with Bluetooth Printer

## Project Overview

An **offline-first** Progressive Web Application for MXW01 thermal printer management. The app enables users to connect to Bluetooth printers and print text, images, and custom templates without any internet connection.

---

## Feasibility Matrix

| Aspect | Status | Notes |
|--------|--------|-------|
| Feasibility | Possible (Client-Side) | Browser-dependent via `'use client'` directive |
| Next.js Role | Frontend Host & State Management | Manages UI/UX, BLE connection state, local storage |
| Data Storage | IndexedDB | Fully offline, no cloud dependency |
| Communication Protocol | GATT/Custom BLE | Uses MXW01 printer UUIDs |
| Printing Protocol | MXW01 Custom Protocol | Not ESC/POS - uses mxw01-thermal-printer library |
| UI Framework | shadcn/ui | Essential for staff interface |

---

## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js PWA Application                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           App Navigation                                │ │
│  │  ┌─────────┐    ┌────────────┐    ┌──────────────┐    ┌───────────┐   │ │
│  │  │ Splash  │───►│ Onboarding │───►│ Session Check│───►│ Dashboard │   │ │
│  │  │ (2s)    │    │ (First Run)│    │ (Auto-Connect)    │           │   │ │
│  │  └─────────┘    └────────────┘    └──────────────┘    └───────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                              UI Layer                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │ Connection  │  │ Send Text   │  │ Send Image   │  │ Templates   │  │ │
│  │  │ Status      │  │ Tab         │  │ Tab          │  │ Tab         │  │ │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘  │ │
│  │                                                                        │ │
│  │  Components: shadcn/ui (Button, Card, Input, Progress, Tabs, Dialog)  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                              State Layer                               │  │
│  │  ┌─────────────────┐  ┌───────────┴───────────┐  ┌─────────────────┐  │  │
│  │  │ Zustand Store   │  │ usePrinter Hook       │  │ IndexedDB       │  │  │
│  │  │ (Runtime State) │  │ (Printer Connection)  │  │ (Persistence)   │  │  │
│  │  └─────────────────┘  └───────────────────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│  ┌───────────────────────────────────┼───────────────────────────────────┐  │
│  │                   mxw01-thermal-printer Library                        │  │
│  │  ┌───────────────────┐  ┌────────┴────────┐  ┌─────────────────────┐  │  │
│  │  │ WebBluetoothAdapter│  │ ThermalPrinter │  │ Image Processing    │  │  │
│  │  │ - requestDevice    │  │ Client         │  │ - Dithering         │  │  │
│  │  │ - connect          │  │ - connect()    │  │ - Rotation          │  │  │
│  │  │ - reconnect        │  │ - print()      │  │ - Brightness        │  │  │
│  │  └───────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
└──────────────────────────────────────┼───────────────────────────────────────┘
                                       ▼
                              ┌────────────────┐
                              │  MXW01 Thermal │
                              │  Printer (BLE) │
                              └────────────────┘
```

---

## Module Responsibilities

| Module | Responsibility | Location |
|--------|----------------|----------|
| **UI Layer** | User interface with shadcn/ui components | Client Components |
| **Zustand Store** | Runtime state (connection, settings) | `stores/` |
| **usePrinter Hook** | React wrapper for ThermalPrinterClient | `hooks/usePrinter.ts` |
| **IndexedDB** | Persistent storage (templates, settings, history) | `lib/db.ts` |
| **mxw01-thermal-printer** | Bluetooth communication & printing | `lib/printer/` |

---

## Key Technical Constraints

### 1. Client-Side Only
All BLE and storage logic must be isolated within Client Component boundary to prevent SSR/SSG runtime errors.

### 2. Browser Compatibility
Requires Web Bluetooth API support (`navigator.bluetooth`).

### 3. Offline-First
All data stored in IndexedDB. No network requests for core functionality.

### 4. MXW01 Protocol
Uses custom protocol from mxw01-thermal-printer library (NOT ESC/POS).

---

## Data Flow: Print Image

```
┌─────────────────┐
│ User selects    │
│ image file      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load into       │
│ Canvas/ImageData│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ processImageFor │
│ Printer()       │
│ - Dithering     │
│ - Rotation      │
│ - Brightness    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ThermalPrinter  │
│ Client.print()  │
│ - prepareData   │
│ - sendChunks    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BLE Write to    │
│ MXW01 Printer   │
└─────────────────┘
```

---

## Data Flow: App Startup

```
┌─────────────────┐
│ App Launch      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Splash Screen   │
│ (2 seconds)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load settings   │
│ from IndexedDB  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
First Run   Returning
    │         │
    ▼         │
┌────────────┐│
│ Onboarding ││
│ (3 steps)  ││
└─────┬──────┘│
      │       │
      ▼       ▼
┌─────────────────┐
│ Session Check   │
│ (Auto-reconnect)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dashboard       │
│ - Send Text     │
│ - Send Image    │
│ - Templates     │
└─────────────────┘
```

---

## IndexedDB Schema

```typescript
interface AppDatabase {
  // App settings (key-value store)
  settings: {
    key: string;          // e.g., 'hasCompletedOnboarding'
    value: any;
  };
  
  // Print templates
  templates: {
    id: string;
    name: string;
    type: 'text' | 'image';
    content: any;         // Text content or image reference
    options: PrintOptions;
    createdAt: Date;
    updatedAt: Date;
  };
  
  // Print history (optional)
  printHistory: {
    id: string;
    templateId?: string;
    type: 'text' | 'image' | 'template';
    timestamp: Date;
    success: boolean;
  };
}
```

---

## Zustand Stores

### Printer Store
```typescript
interface PrinterStore {
  // State
  isConnected: boolean;
  isPrinting: boolean;
  statusMessage: string;
  printerState: PrinterState | null;
  lastDeviceId: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setPrinting: (printing: boolean) => void;
  setStatusMessage: (message: string) => void;
  setPrinterState: (state: PrinterState | null) => void;
  setLastDeviceId: (id: string | null) => void;
}
```

### Settings Store
```typescript
interface SettingsStore {
  // State
  hasCompletedOnboarding: boolean;
  preferredDitherMethod: DitherMethod;
  printIntensity: number;
  autoReconnect: boolean;
  
  // Actions
  setOnboardingComplete: (complete: boolean) => void;
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
  setAutoReconnect: (auto: boolean) => void;
}
```

---

## Essential Implementation Checklist

1. ☐ Check `navigator.bluetooth` compatibility on load
2. ☐ Load settings from IndexedDB
3. ☐ Show splash screen (2s)
4. ☐ Check onboarding status → route accordingly
5. ☐ Attempt auto-reconnect to saved printer
6. ☐ Display dashboard with print options
7. ☐ Handle text input and convert to printable image
8. ☐ Handle image upload and process for printing
9. ☐ Manage templates (save/load/delete)
10. ☐ Persist all user data to IndexedDB

---

## Security Considerations

- Web Bluetooth requires HTTPS (or localhost for development)
- Device pairing is handled by the browser/OS
- All data stored locally - no network transmission
- No authentication required (offline app)

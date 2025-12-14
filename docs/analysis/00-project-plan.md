# Cursor Istanbul Ticketing System - Project Plan

## Project Overview

An **offline-first** Next.js Progressive Web Application (PWA) for thermal printer management. The app enables users to connect to MXW01 Bluetooth thermal printers and print text, images, and custom templates. All data is stored locally using IndexedDB - **no Firebase or cloud backend required**.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js PWA (Offline-First)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────────────┐    │
│  │  Splash  │───►│  Onboarding  │───►│  Session Check              │    │
│  │  Screen  │    │  (First Run) │    │  (Printer Connection Test)  │    │
│  └──────────┘    └──────────────┘    └──────────────┬──────────────┘    │
│                                                      │                   │
│                                                      ▼                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                         Dashboard                               │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │     │
│  │  │ Send Text   │  │ Send Image  │  │ Print Templates         │ │     │
│  │  │ (ESC/POS)   │  │ (Raster)    │  │ (Custom Layouts)        │ │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                      │                                   │
├──────────────────────────────────────┼───────────────────────────────────┤
│                                      ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │              mxw01-thermal-printer Library                      │     │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │     │
│  │  │ WebBluetooth    │  │ ThermalPrinter  │  │ ImageProcessor │  │     │
│  │  │ Adapter         │  │ Client          │  │ + Dithering    │  │     │
│  │  └─────────────────┘  └─────────────────┘  └────────────────┘  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                      │                                   │
│                                      ▼                                   │
│                            ┌────────────────┐                            │
│                            │  BLE Printer   │                            │
│                            │  (MXW01)       │                            │
│                            └────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Offline-First** | All data stored locally in IndexedDB, works without internet |
| **PWA Support** | Installable on mobile/desktop, works offline |
| **Bluetooth Printing** | Direct connection to MXW01 thermal printers via Web Bluetooth |
| **Send Text** | Print formatted text with ESC/POS commands |
| **Send Image** | Print images with dithering algorithms |
| **Templates** | Create and save custom print templates |
| **shadcn/ui** | Modern, accessible UI components |

---

## User Flow

```
1. Splash Screen (2s)
       │
       ▼
2. First Run Check
       │
   ┌───┴───┐
   │       │
   ▼       ▼
New User   Returning User
   │            │
   ▼            │
3. Onboarding   │
   (3 steps)    │
   │            │
   ▼            │
4. Session Check ◄──┘
   (Printer Connection)
       │
       ▼
5. Dashboard
   ├── Send Text
   ├── Send Image
   └── Templates
```

---

## Development Phases

### Phase 1: Core Foundation
**Goal**: Working PWA with printer connection

### Phase 2: Print Features
**Goal**: Text, image, and template printing

### Phase 3: Polish & PWA
**Goal**: Offline support, installability, UX refinement

---

## Phase 1: Core Foundation

### Prerequisites Checklist

- [ ] Next.js project initialized with TypeScript
- [ ] shadcn/ui components installed and configured
- [ ] mxw01-thermal-printer library integrated
- [ ] BLE printer available for testing
- [ ] Chrome/Edge browser (Web Bluetooth support)

---

### Module 1: Project Setup & Configuration

**Priority**: Critical  
**Estimated Time**: 2-4 hours

#### Tasks

1. **Initialize Next.js Project**
   - [ ] Create Next.js 14+ app with TypeScript
   - [ ] Configure `app/` directory structure
   - [ ] Set up Tailwind CSS configuration
   - [ ] Configure path aliases (`@/`)

2. **Install Dependencies**
   ```bash
   npm install idb zustand
   npm install -D @types/node
   ```

3. **Setup shadcn/ui**
   - [ ] Initialize shadcn/ui
   - [ ] Install required components:
     - `button`, `input`, `card`, `badge`, `progress`, `dialog`, `toast`, `alert`, `tabs`, `textarea`
   - [ ] Configure theme (white hierarchy)

4. **Integrate mxw01-thermal-printer**
   - [ ] Copy library to `lib/printer/` or install as local package
   - [ ] Configure Web Bluetooth adapter
   - [ ] Test basic connection

5. **Project Structure**
   ```
   app/
   ├── layout.tsx
   ├── page.tsx (splash → router)
   ├── onboarding/
   │   └── page.tsx
   ├── dashboard/
   │   └── page.tsx
   └── globals.css
   components/
   ├── ui/ (shadcn components)
   ├── layout/
   │   └── MobileContainer.tsx
   ├── splash/
   │   └── SplashScreen.tsx
   ├── onboarding/
   │   ├── OnboardingStep.tsx
   │   └── OnboardingComplete.tsx
   ├── dashboard/
   │   ├── ConnectionStatus.tsx
   │   ├── SendText.tsx
   │   ├── SendImage.tsx
   │   └── TemplateList.tsx
   hooks/
   │   ├── usePrinter.ts
   │   └── useLocalStorage.ts
   lib/
   │   ├── printer/ (mxw01 library)
   │   ├── db.ts (IndexedDB)
   │   └── utils.ts
   stores/
   │   ├── printerStore.ts
   │   └── settingsStore.ts
   types/
   │   └── index.ts
   ```

---

### Module 2: Local Storage & State Management

**Priority**: Critical  
**Estimated Time**: 3-4 hours  
**Dependencies**: Module 1

#### Tasks

1. **IndexedDB Setup**
   - [ ] Create `lib/db.ts` using `idb` library
   - [ ] Define database schema
   - [ ] Implement CRUD operations

2. **Database Schema**
   ```typescript
   interface AppDatabase {
     settings: {
       key: string;
       value: any;
     };
     templates: {
       id: string;
       name: string;
       type: 'text' | 'image' | 'composite';
       content: any;
       createdAt: Date;
       updatedAt: Date;
     };
     printHistory: {
       id: string;
       templateId?: string;
       type: 'text' | 'image' | 'template';
       timestamp: Date;
       success: boolean;
     };
   }
   ```

3. **Zustand Store Setup**
   - [ ] Create `stores/printerStore.ts` for connection state
   - [ ] Create `stores/settingsStore.ts` for app settings
   - [ ] Persist settings to IndexedDB

4. **Settings to Track**
   - [ ] `hasCompletedOnboarding`: boolean
   - [ ] `lastConnectedDeviceId`: string | null
   - [ ] `preferredDitherMethod`: DitherMethod
   - [ ] `printIntensity`: number

**Testing Checklist**:
- [ ] Test IndexedDB initialization
- [ ] Test settings persistence
- [ ] Test template CRUD operations
- [ ] Test store hydration from IndexedDB

---

### Module 3: Printer Hook (Using mxw01-thermal-printer)

**Priority**: Critical  
**Estimated Time**: 4-6 hours  
**Dependencies**: Module 1

#### Tasks

1. **Hook Structure**
   - [ ] Create `hooks/usePrinter.ts`
   - [ ] Wrap `ThermalPrinterClient` from mxw01 library
   - [ ] Define React-friendly state interface

2. **Integration with mxw01 Library**
   ```typescript
   import { ThermalPrinterClient, WebBluetoothAdapter } from '@/lib/printer';
   
   // Client initialization
   const adapter = new WebBluetoothAdapter();
   const client = new ThermalPrinterClient(adapter);
   ```

3. **Hook API**
   - [ ] `connect()` - Request and connect to printer
   - [ ] `reconnect(deviceId?)` - Auto-reconnect to saved device
   - [ ] `disconnect()` - Clean disconnect
   - [ ] `print(imageData, options)` - Print with progress
   - [ ] State: `isConnected`, `isPrinting`, `statusMessage`, `printerState`

4. **Event Handling**
   - [ ] Subscribe to printer events (`connected`, `disconnected`, `error`, `stateChange`)
   - [ ] Update React state from events
   - [ ] Handle cleanup on unmount

5. **Persist Device ID**
   - [ ] Save last connected device ID to IndexedDB
   - [ ] Attempt auto-reconnect on app load

**Testing Checklist**:
- [ ] Test device selection flow
- [ ] Test successful connection
- [ ] Test auto-reconnect
- [ ] Test disconnect handling
- [ ] Test error scenarios
- [ ] Test cleanup on component unmount

---

### Module 4: Splash & Onboarding Screens

**Priority**: High  
**Estimated Time**: 4-6 hours  
**Dependencies**: Module 1, Module 2

#### Tasks

1. **Splash Screen**
   - [ ] Create `components/splash/SplashScreen.tsx`
   - [ ] Display app logo/branding
   - [ ] 2 second delay with animation
   - [ ] Check onboarding status

2. **Onboarding Flow**
   - [ ] Create `app/onboarding/page.tsx`
   - [ ] Step 1: Welcome & App Introduction
   - [ ] Step 2: Bluetooth Permission Request
   - [ ] Step 3: Connect First Printer (optional)
   - [ ] Mark onboarding complete in IndexedDB

3. **Navigation Logic**
   ```
   Splash (2s) → Check hasCompletedOnboarding
       │
   ┌───┴───┐
   │       │
   false   true
   │       │
   ▼       ▼
   Onboarding → Dashboard
   ```

4. **Onboarding Components**
   - [ ] `OnboardingStep` - Reusable step container
   - [ ] `OnboardingProgress` - Step indicator dots
   - [ ] `OnboardingComplete` - Success state

**Testing Checklist**:
- [ ] Test splash screen timing
- [ ] Test onboarding flow navigation
- [ ] Test skip/complete onboarding
- [ ] Test persistence of onboarding state

---

### Module 5: Session Check & Dashboard

**Priority**: Critical  
**Estimated Time**: 6-8 hours  
**Dependencies**: Module 3, Module 4

#### Tasks

1. **Session Check**
   - [ ] Attempt auto-reconnect to last printer
   - [ ] Show connection status during check
   - [ ] Allow manual connect if auto fails
   - [ ] Navigate to dashboard when ready

2. **Dashboard Layout**
   - [ ] Create `app/dashboard/page.tsx`
   - [ ] Connection status header
   - [ ] Tab navigation (Text / Image / Templates)
   - [ ] Settings access

3. **Dashboard Tabs**
   - [ ] **Send Text Tab**: Text input with formatting
   - [ ] **Send Image Tab**: Image upload and preview
   - [ ] **Templates Tab**: List of saved templates

4. **Connection Status Component**
   - [ ] Show printer name when connected
   - [ ] Battery/paper status (if available)
   - [ ] Connect/Disconnect button
   - [ ] Error states with retry

**Testing Checklist**:
- [ ] Test session check flow
- [ ] Test dashboard navigation
- [ ] Test tab switching
- [ ] Test connection status updates

---

### Module 6: Send Text Feature

**Priority**: High  
**Estimated Time**: 4-6 hours  
**Dependencies**: Module 5

#### Tasks

1. **Text Input UI**
   - [ ] Multi-line textarea for text input
   - [ ] Character count display
   - [ ] Clear button

2. **Text to Image Conversion**
   - [ ] Create canvas with text
   - [ ] Configure font size, alignment
   - [ ] Convert to ImageData for printing

3. **Print Text Flow**
   ```
   Enter Text → Render to Canvas → Convert to ImageData → Print
   ```

4. **Print Options**
   - [ ] Font size (small, medium, large)
   - [ ] Alignment (left, center, right)
   - [ ] Bold toggle

**Testing Checklist**:
- [ ] Test text rendering
- [ ] Test different font sizes
- [ ] Test long text handling
- [ ] Test actual print output

---

### Module 7: Send Image Feature

**Priority**: High  
**Estimated Time**: 6-8 hours  
**Dependencies**: Module 5

#### Tasks

1. **Image Upload UI**
   - [ ] File input (camera + gallery)
   - [ ] Drag and drop support
   - [ ] Image preview

2. **Image Processing Options**
   - [ ] Dither method selector (threshold, steinberg, bayer, atkinson)
   - [ ] Brightness adjustment slider
   - [ ] Rotation options (0, 90, 180, 270)
   - [ ] Flip options (none, h, v, both)

3. **Live Preview**
   - [ ] Show processed image preview
   - [ ] Update on option change
   - [ ] Show actual print dimensions

4. **Print Image Flow**
   ```
   Upload → Process with Options → Preview → Print
   ```

**Testing Checklist**:
- [ ] Test image upload (camera, gallery)
- [ ] Test all dither methods
- [ ] Test rotation and flip
- [ ] Test brightness adjustment
- [ ] Test actual print output

---

### Module 8: Template System

**Priority**: Medium  
**Estimated Time**: 6-8 hours  
**Dependencies**: Module 6, Module 7

#### Tasks

1. **Template Types**
   ```typescript
   type Template = {
     id: string;
     name: string;
     type: 'text' | 'image';
     content: TextTemplateContent | ImageTemplateContent;
     options: PrintOptions;
     createdAt: Date;
   };
   ```

2. **Template CRUD**
   - [ ] Save current print as template
   - [ ] List saved templates
   - [ ] Load template for editing
   - [ ] Delete template

3. **Template UI**
   - [ ] Template list with previews
   - [ ] Quick print button
   - [ ] Edit/Delete actions

4. **Template Variables (Optional)**
   - [ ] Support `{{variable}}` placeholders
   - [ ] Variable input on print

**Testing Checklist**:
- [ ] Test template save
- [ ] Test template load
- [ ] Test template delete
- [ ] Test quick print from template

---

## Phase 2: Polish & PWA

### Module 9: PWA Configuration

**Priority**: High  
**Estimated Time**: 4-6 hours  
**Dependencies**: Phase 1 complete

#### Tasks

1. **PWA Manifest**
   - [ ] Create `manifest.json`
   - [ ] App icons (all sizes)
   - [ ] Theme colors
   - [ ] Display mode (standalone)

2. **Service Worker**
   - [ ] Configure next-pwa or similar
   - [ ] Cache static assets
   - [ ] Offline page fallback

3. **Install Prompt**
   - [ ] Detect installability
   - [ ] Show install button/banner
   - [ ] Handle install event

4. **Offline Support**
   - [ ] Cache app shell
   - [ ] IndexedDB for data
   - [ ] Offline-friendly UI messaging

**Testing Checklist**:
- [ ] Test PWA installability
- [ ] Test offline functionality
- [ ] Test on mobile devices
- [ ] Test app updates

---

### Module 10: Settings & Preferences

**Priority**: Medium  
**Estimated Time**: 3-4 hours  
**Dependencies**: Module 2

#### Tasks

1. **Settings Page**
   - [ ] Create `app/settings/page.tsx`
   - [ ] Printer settings section
   - [ ] Print defaults section
   - [ ] App preferences section

2. **Settings Options**
   - [ ] Default dither method
   - [ ] Default print intensity
   - [ ] Auto-reconnect toggle
   - [ ] Clear print history
   - [ ] Reset onboarding

3. **Persist Settings**
   - [ ] Save to IndexedDB
   - [ ] Sync with Zustand store

---

## Implementation Order

### Week 1: Foundation
1. Module 1: Project Setup
2. Module 2: Local Storage & State
3. Module 3: Printer Hook

### Week 2: Core Screens
4. Module 4: Splash & Onboarding
5. Module 5: Session Check & Dashboard
6. Module 6: Send Text Feature

### Week 3: Features
7. Module 7: Send Image Feature
8. Module 8: Template System

### Week 4: Polish (Phase 2)
9. Module 9: PWA Configuration
10. Module 10: Settings & Preferences

---

## Critical Path Dependencies

```
Module 1 (Setup)
    ↓
Module 2 (Storage) ──────┐
    ↓                    │
Module 3 (Printer Hook)──┤
    ↓                    │
Module 4 (Splash/Onboard)┤
    ↓                    │
Module 5 (Dashboard) ←───┘
    ↓
┌───┴───┐
│       │
▼       ▼
Module 6   Module 7
(Text)     (Image)
│       │
└───┬───┘
    ▼
Module 8 (Templates)
    ↓
Module 9 (PWA)
    ↓
Module 10 (Settings)
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Web Bluetooth browser support | High | Clear browser requirements, compatibility check |
| MXW01 printer protocol issues | Medium | Use tested mxw01-thermal-printer library |
| IndexedDB storage limits | Low | Compress stored data, limit history |
| PWA install issues | Medium | Thorough testing on target devices |
| Image processing performance | Medium | Web Workers for heavy processing |

---

## Success Criteria

### Phase 1 (Core Features)
- [ ] User can complete onboarding flow
- [ ] User can connect to MXW01 printer
- [ ] User can print text content
- [ ] User can print images with dithering
- [ ] User can save and use templates
- [ ] All data persists locally (offline)

### Phase 2 (Production Ready)
- [ ] PWA is installable on mobile/desktop
- [ ] App works fully offline
- [ ] Settings persist across sessions
- [ ] Clean, responsive UI on all devices
- [ ] No external network dependencies

---

## mxw01-thermal-printer Library Reference

The app uses the `mxw01-thermal-printer` library from `example-resource/`. Key exports:

```typescript
// Core client
import { ThermalPrinterClient } from 'mxw01-thermal-printer';

// Bluetooth adapter for web
import { WebBluetoothAdapter } from 'mxw01-thermal-printer';

// Types
import type {
  PrinterState,
  PrinterImageData,
  PrintOptions,
  DitherMethod,
  ImageProcessorOptions,
} from 'mxw01-thermal-printer';

// Image processing
import { processImageForPrinter } from 'mxw01-thermal-printer';
```

### Bluetooth UUIDs (MXW01 Printer)
```typescript
const BLUETOOTH_UUIDS = {
  PRINTER_SERVICE: "0000ae30-0000-1000-8000-00805f9b34fb",
  PRINTER_SERVICE_ALT: "0000af30-0000-1000-8000-00805f9b34fb", // macOS
  CONTROL: "0000ae01-0000-1000-8000-00805f9b34fb",
  NOTIFY: "0000ae02-0000-1000-8000-00805f9b34fb",
  DATA: "0000ae03-0000-1000-8000-00805f9b34fb",
};
```

---

## Notes

- **No Firebase/Supabase**: This is a fully offline application
- **IndexedDB**: All data stored locally using `idb` library
- **mxw01-thermal-printer**: Use the existing library for printer communication
- **Mobile First**: Design and test on mobile devices throughout development
- **PWA**: Make installable for best mobile experience

---

## Resources

- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [IndexedDB with idb](https://github.com/jakearchibald/idb)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)


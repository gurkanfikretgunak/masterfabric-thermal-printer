# MasterFabric Printer - Thermal Printer PWA

An offline-first Next.js Progressive Web Application for thermal Bluetooth printer management.

**Repository**: [https://github.com/gurkanfikretgunak/masterfabric-thermal-printer](https://github.com/gurkanfikretgunak/masterfabric-thermal-printer)

## Features

- 🖨️ **Bluetooth Printing** - Direct connection to MXW01 thermal printers via Web Bluetooth
- 📱 **PWA Support** - Installable on mobile/desktop, works offline
- 🎨 **Modern UI** - Built with Next.js 16, React 19, shadcn/ui, and Tailwind CSS
- 💾 **Offline-First** - All data stored locally in IndexedDB
- 🏷️ **Badge Designer** - Visual badge design tool with drag-and-drop elements
- 📄 **Template System** - Save and reuse print templates
- 📸 **Image Printing** - Print images with dithering and image processing
- 🔲 **QR Code Generation** - Generate and print QR codes
- 📝 **Text Printing** - Print formatted text with ESC/POS commands

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended) 
- npm or yarn
- Chrome/Edge browser (for Web Bluetooth support)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (splash → routing)
│   ├── dashboard/         # Dashboard pages
│   ├── onboarding/        # Onboarding flow
│   ├── connect/           # Printer connection page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── splash/           # Splash screen
│   └── dashboard/        # Dashboard components
│       ├── BadgeDesigner.tsx    # Badge design tool
│       ├── ConnectionStatus.tsx # Connection status indicator
│       ├── SendText.tsx         # Text printing
│       ├── SendImage.tsx        # Image printing
│       ├── TemplateList.tsx     # Template management
│       └── ...
├── contexts/             # React contexts
│   └── PrinterContext.tsx # Printer state management
├── hooks/                # React hooks
│   └── usePrinter.ts     # Printer connection hook
├── lib/                   # Library code
│   ├── printer/          # Thermal printer library (local implementation)
│   │   ├── core/         # Core client and types
│   │   ├── adapters/     # Bluetooth adapters
│   │   ├── services/     # Printer services (protocol, image processing)
│   │   └── utils/        # Bluetooth utilities
│   └── utils/            # Utility functions
│       └── qrcode.ts     # QR code generation
└── docs/                 # Documentation
    └── analysis/         # Architecture documentation
```

## Technology Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with improved performance
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Context API** - State management for printer
- **idb** - IndexedDB wrapper
- **qrcode** - QR code generation
- **Custom Thermal Printer Library** - Local implementation in `lib/printer/`

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

Web Bluetooth API is required. Supported browsers:
- Chrome/Edge (desktop & Android)
- Opera (desktop & Android)
- Not supported: Safari, Firefox

## Thermal Printer Library

This project includes a custom implementation of the MXW01 thermal printer protocol library located in `lib/printer/`. The library provides:

### Core Components

- **ThermalPrinterClient** - Main client for printer communication
- **WebBluetoothAdapter** - Web Bluetooth API adapter
- **MXW01Printer** - Low-level printer protocol implementation
- **Image Processor** - Image dithering and processing for thermal printing

### Library Structure

```typescript
// Core client
import { ThermalPrinterClient } from '@/lib/printer';

// Bluetooth adapter
import { WebBluetoothAdapter } from '@/lib/printer';

// Types
import type {
  PrinterState,
  PrinterImageData,
  PrintOptions,
  DitherMethod,
} from '@/lib/printer';

// Image processing
import { processImageForPrinter } from '@/lib/printer';
```

### Bluetooth UUIDs (MXW01 Printer)

```typescript
const BLUETOOTH_UUIDS = {
  PRINTER_SERVICE: "0000xxxx-yyyy-zzzz-wwww-ffffffffffff",
  PRINTER_SERVICE_ALT: "0000yyyy-xxxx-zzzz-wwww-eeeeeeeeeeee", // alt/macos
  CONTROL: "0000ctrl-uuuu-cccc-tttt-rrrrrrrrrrrr",
  NOTIFY: "0000ntfy-iiii-ffff-eeee-aaaaaaabcd12",
  DATA: "0000data-aaaa-bbbb-cccc-ddddeeeeffff",
};
```


For more details about the library implementation, see the [architecture documentation](docs/analysis/).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT


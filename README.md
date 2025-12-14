# MasterFabric Printer - Thermal Printer PWA

An offline-first Next.js Progressive Web Application for thermal Bluetooth printer management.

## Features

- 🖨️ **Bluetooth Printing** - Direct connection to MXW01 thermal printers via Web Bluetooth
- 📱 **PWA Support** - Installable on mobile/desktop, works offline
- 🎨 **Modern UI** - Built with Next.js 14, shadcn/ui, and Tailwind CSS
- 💾 **Offline-First** - All data stored locally in IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ 
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
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── splash/           # Splash screen
│   └── dashboard/        # Dashboard components
├── hooks/                # React hooks
│   └── usePrinter.ts     # Printer connection hook
├── lib/                   # Library code
│   ├── printer/          # mxw01-thermal-printer library
│   └── utils.ts          # Utility functions
└── stores/               # Zustand stores (to be added)
```

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management
- **idb** - IndexedDB wrapper
- **mxw01-thermal-printer** - Printer protocol library

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

## License

MIT


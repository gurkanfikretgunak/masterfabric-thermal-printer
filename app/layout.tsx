import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrinterProvider } from "@/contexts/PrinterContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MasterFabric Printer - Thermal Printer Manager",
    template: "%s | MasterFabric Printer",
  },
  description: "Offline-first Progressive Web Application for managing thermal Bluetooth printers. Connect via Bluetooth and print text, images, and templates directly from your device without internet connection.",
  keywords: [
    "thermal printer",
    "bluetooth printer",
    "PWA",
    "offline printer",
    "thermal printer manager",
    "mobile printing",
    "thermal printer app",
    "bluetooth printing",
    "offline-first",
    "progressive web app",
  ],
  authors: [{ name: "gurkanfikretgunak", url: "https://github.com/gurkanfikretgunak" }],
  creator: "gurkanfikretgunak",
  publisher: "MasterFabric",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://github.com/gurkanfikretgunak/masterfabric-thermal-printer"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/gurkanfikretgunak/masterfabric-thermal-printer",
    title: "MasterFabric Printer - Thermal Printer Manager",
    description: "Offline-first Progressive Web Application for managing thermal Bluetooth printers",
    siteName: "MasterFabric Printer",
  },
  twitter: {
    card: "summary",
    title: "MasterFabric Printer - Thermal Printer Manager",
    description: "Offline-first Progressive Web Application for managing thermal Bluetooth printers",
    creator: "@gurkanfikretgunak",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MasterFabric Printer",
  },
  applicationName: "MasterFabric Printer",
  category: "productivity",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrinterProvider>
          {children}
        </PrinterProvider>
      </body>
    </html>
  );
}

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  ThermalPrinterClient, 
  WebBluetoothAdapter 
} from '@/lib/printer';
import type { 
  PrinterState, 
  PrinterImageData, 
  PrintOptions,
  DitherMethod 
} from '@/lib/printer';

interface PrinterContextValue {
  // State
  isConnected: boolean;
  isPrinting: boolean;
  isConnecting: boolean;
  statusMessage: string;
  printerState: PrinterState | null;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  reconnect: (deviceId?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (imageData: PrinterImageData, options?: PrintOptions) => Promise<void>;
  getStatus: () => Promise<PrinterState | null>;
  
  // Settings
  setDitherMethod: (method: DitherMethod) => void;
  setPrintIntensity: (intensity: number) => void;
}

const PrinterContext = createContext<PrinterContextValue | undefined>(undefined);

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<ThermalPrinterClient | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const [printerState, setPrinterState] = useState<PrinterState | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize client
  useEffect(() => {
    const adapter = new WebBluetoothAdapter();
    if (!adapter.isAvailable()) {
      setError('Web Bluetooth is not available');
      setStatusMessage('Web Bluetooth not supported');
      return;
    }
    
    clientRef.current = new ThermalPrinterClient(adapter);
    
    // Subscribe to events
    const unsubConnected = clientRef.current.on('connected', (event) => {
      setIsConnected(true);
      setIsConnecting(false);
      setStatusMessage('Connected');
      setError(null);
    });
    
    const unsubDisconnected = clientRef.current.on('disconnected', () => {
      setIsConnected(false);
      setStatusMessage('Disconnected');
      setPrinterState(null);
    });
    
    const unsubStateChange = clientRef.current.on('stateChange', (event) => {
      setPrinterState(event.state);
    });
    
    const unsubError = clientRef.current.on('error', (event) => {
      setError(event.error.message);
      setStatusMessage(`Error: ${event.error.message}`);
    });

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubStateChange();
      unsubError();
      clientRef.current?.dispose();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await clientRef.current.connect();
    } catch (err) {
      setIsConnecting(false);
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const reconnect = useCallback(async (deviceId?: string) => {
    if (!clientRef.current) return false;
    
    setIsConnecting(true);
    setError(null);
    setStatusMessage('Reconnecting...');
    
    try {
      const success = await clientRef.current.reconnect(deviceId);
      if (!success) {
        setIsConnecting(false);
        setStatusMessage('Reconnection failed');
      }
      return success;
    } catch (err) {
      setIsConnecting(false);
      const errorMessage = err instanceof Error ? err.message : 'Reconnection failed';
      setError(errorMessage);
      setStatusMessage('Reconnection failed');
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.disconnect();
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  const print = useCallback(async (
    imageData: PrinterImageData, 
    options?: PrintOptions
  ) => {
    if (!clientRef.current) throw new Error('Printer not initialized');
    
    setIsPrinting(true);
    setError(null);
    try {
      await clientRef.current.print(imageData, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Print failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  const getStatus = useCallback(async () => {
    if (!clientRef.current) return null;
    try {
      return await clientRef.current.getStatus();
    } catch (err) {
      console.error('Error getting status:', err);
      return null;
    }
  }, []);

  const setDitherMethod = useCallback((method: DitherMethod) => {
    clientRef.current?.setDitherMethod(method);
  }, []);

  const setPrintIntensity = useCallback((intensity: number) => {
    clientRef.current?.setPrintIntensity(intensity);
  }, []);

  const value: PrinterContextValue = {
    isConnected,
    isPrinting,
    isConnecting,
    statusMessage,
    printerState,
    error,
    connect,
    reconnect,
    disconnect,
    print,
    getStatus,
    setDitherMethod,
    setPrintIntensity,
  };

  return (
    <PrinterContext.Provider value={value}>
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}


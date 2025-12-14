'use client';

import { useEffect, useState, useRef } from 'react';
import { Printer, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog';

interface PrintingDialogProps {
  isPrinting: boolean;
  statusMessage?: string;
  error?: string | null;
}

type DialogState = 'printing' | 'success' | 'error';

export default function PrintingDialog({ isPrinting, statusMessage, error }: PrintingDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DialogState>('printing');
  const [prevPrinting, setPrevPrinting] = useState(false);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const wasPrinting = prevPrinting;
    setPrevPrinting(isPrinting);

    // Clear any existing success timer
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }

    // When printing starts
    if (isPrinting) {
      setOpen(true);
      setState('printing');
    }
    // When printing ends (transition from printing to not printing)
    else if (!isPrinting && wasPrinting) {
      // If there's an error, show error state
      if (error) {
        setState('error');
        setOpen(true);
      } 
      // Otherwise show success and close after delay
      else {
        setState('success');
        setOpen(true);
        successTimerRef.current = setTimeout(() => {
          setOpen(false);
          setState('printing');
          successTimerRef.current = null;
        }, 1500);
      }
    }
    // If not printing and no error, ensure dialog is closed
    else if (!isPrinting && !error && !wasPrinting) {
      setOpen(false);
      setState('printing');
    }

    // Cleanup timer on unmount or when printing starts again
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, [isPrinting, error, prevPrinting]);

  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      // Allow manual close only if not printing
      if (!isPrinting) {
        setOpen(isOpen);
      }
    }}>
      <AlertDialogContent className="sm:max-w-sm p-6">
        {/* Printing State */}
        {state === 'printing' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-primary/10 p-4 rounded-full">
              <Printer className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">Printing</h3>
              <p className="text-sm text-muted-foreground">
                {statusMessage || 'Sending to printer...'}
              </p>
            </div>
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-green-500/10 p-4 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">Print Complete</h3>
              <p className="text-sm text-muted-foreground">
                Your document has been sent to the printer
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-destructive/10 p-4 rounded-full">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">Print Failed</h3>
              <p className="text-sm text-muted-foreground">
                {error || 'An error occurred while printing'}
              </p>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}



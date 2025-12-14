'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrinter } from '@/hooks/usePrinter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Wifi } from 'lucide-react';
import SplashFooter from '@/components/splash/SplashFooter';

export default function ConnectPage() {
  const router = useRouter();
  const { 
    isConnected, 
    isConnecting, 
    statusMessage, 
    error,
    connect 
  } = usePrinter();

  useEffect(() => {
    // If already connected, navigate to dashboard
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      // Error is handled by the hook and displayed in the UI
      console.error('Connection error:', err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-6">
      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-md space-y-6">
        <div className="w-full text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">Connect Printer</h1>
          <p className="text-base text-muted-foreground">
            Connect to your thermal Bluetooth printer
          </p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex items-center justify-center mb-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full transition-colors ${
                isConnected
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-primary/10'
              }`}>
                {isConnected ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                ) : (
                  <Wifi className="h-12 w-12 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-xl mb-3">Printer Connection</CardTitle>
            <CardDescription className="text-base mt-3 leading-relaxed">
              Make sure your printer is powered on and Bluetooth is enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="flex items-center space-x-3">
                  {isConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : isConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Status</p>
                    <Badge 
                      variant={isConnected ? 'default' : 'secondary'} 
                      className="mt-1"
                    >
                      {statusMessage}
                    </Badge>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isConnected && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Successfully connected! You can now start printing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-foreground mb-4 text-center">Connection Tips:</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>Ensure your printer is turned on</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>Enable Bluetooth on your device</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>Keep the printer within range</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>Select your printer from the device list</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Footer Section */}
      <div className="w-full max-w-md space-y-4 pb-4">
        <Button
          onClick={handleConnect}
          disabled={isConnecting || isConnected}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : isConnected ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Connected
            </>
          ) : (
            <>
              <Wifi className="mr-2 h-4 w-4" />
              Connect Printer
            </>
          )}
        </Button>

        {isConnected && (
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
            size="lg"
          >
            Go to Dashboard
          </Button>
        )}

        {/* Footer */}
        <SplashFooter />
      </div>
    </div>
  );
}


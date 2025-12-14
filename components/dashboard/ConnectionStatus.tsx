'use client';

import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ConnectionStatus() {
  const { 
    isConnected, 
    isConnecting, 
    statusMessage, 
    error,
    connect, 
    disconnect 
  } = usePrinter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Printer Connection</CardTitle>
        <CardDescription>Connect to your thermal Bluetooth printer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        </div>
        
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={connect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Printer'
              )}
            </Button>
          ) : (
            <Button 
              onClick={disconnect}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


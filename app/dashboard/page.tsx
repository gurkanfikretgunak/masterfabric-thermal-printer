'use client';

import { usePrinter } from '@/hooks/usePrinter';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MobileContainer from '@/components/layout/MobileContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PrinterTabs from '@/components/dashboard/PrinterTabs';
import SplashFooter from '@/components/splash/SplashFooter';
import { CheckCircle2, XCircle, AlertCircle, Wifi } from 'lucide-react';
import PrintingDialog from '@/components/dashboard/PrintingDialog';

export default function DashboardPage() {
  const router = useRouter();
  const { isConnected, statusMessage, printerState, disconnect, isPrinting, error } = usePrinter();
  const [activeTab, setActiveTab] = useState('text');

  useEffect(() => {
    // If not connected, redirect to connect page
    if (!isConnected) {
      router.push('/connect');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const handleDisconnect = async () => {
    await disconnect();
    router.push('/connect');
  };

  return (
    <MobileContainer>
      <div className="flex flex-col md:flex-row md:gap-6 h-full overflow-x-hidden">
        {/* Left Sidebar - Connection Status */}
        <div className="md:w-80 lg:w-96 flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between gap-2 min-w-0 mb-4 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-foreground truncate">Dashboard</h1>
              <p className="text-sm text-muted-foreground truncate">MasterFabric Printer</p>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1 flex-shrink-0">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>

          {/* Connection Status Card */}
          <Card className="mb-4 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Printer Connection</CardTitle>
            <CardDescription className="text-xs">Current printer connection and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-foreground">Status</p>
                  <Badge variant="default" className="mt-1 text-xs">
                    {statusMessage}
                  </Badge>
                </div>
              </div>
            </div>

            {printerState && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                  <span className="text-xs text-muted-foreground">Printing:</span>
                  <Badge variant={printerState.printing ? 'default' : 'secondary'} className="text-xs">
                    {printerState.printing ? 'Yes' : 'No'}
                  </Badge>
                </div>

                {printerState.paper_jam && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Paper jam detected</AlertDescription>
                  </Alert>
                )}
                {printerState.out_of_paper && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Out of paper</AlertDescription>
                  </Alert>
                )}
                {printerState.cover_open && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Cover is open</AlertDescription>
                  </Alert>
                )}
                {printerState.battery_low && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Battery low</AlertDescription>
                  </Alert>
                )}
                {printerState.overheat && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">Printer overheating</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="w-full h-9 text-sm"
            >
              <Wifi className="mr-2 h-3 w-3" />
              Disconnect
            </Button>
          </CardContent>
          </Card>

        </div>

        {/* Right Side - Print Options - Expanded */}
        <div className="overflow-x-hidden flex-1 min-h-0 flex flex-col">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex-shrink-0">Print Options</h2>
          <div className="w-full overflow-x-hidden flex-1 min-h-0 flex flex-col">
            <PrinterTabs 
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto pt-4 pb-2 mt-auto">
        <SplashFooter />
      </div>

      {/* Printing Dialog */}
      <PrintingDialog isPrinting={isPrinting} statusMessage={statusMessage} error={error} />
    </MobileContainer>
  );
}

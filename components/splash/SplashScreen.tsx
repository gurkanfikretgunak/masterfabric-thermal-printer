'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import SplashFooter from './SplashFooter';

export default function SplashScreen() {
  const router = useRouter();

  const handleReady = () => {
    router.push('/onboarding');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-6">
      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center space-y-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">MasterFabric Printer</h1>
            <p className="text-base text-muted-foreground">Thermal Printer Manager</p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="w-full max-w-md space-y-4 pb-4">
        <Card className="bg-muted/50 border-0">
          <CardContent className="pt-6 pb-6">
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              What is MasterFabric Printer?
            </p>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              An offline-first Progressive Web Application for managing thermal Bluetooth printers. 
              Connect via Bluetooth and print text, images, and templates without internet connection. 
              All data is stored locally on your device for privacy and security.
            </p>
          </CardContent>
        </Card>

        {/* Ready Button */}
        <Button
          onClick={handleReady}
          className="w-full"
          size="lg"
        >
          Ready
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>

        {/* Footer with Repo Info */}
        <SplashFooter />
      </div>
    </div>
  );
}

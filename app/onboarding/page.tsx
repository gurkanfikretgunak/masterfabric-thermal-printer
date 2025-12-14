'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrinter } from '@/hooks/usePrinter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Bluetooth, 
  FileText,
  Wifi,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import SplashFooter from '@/components/splash/SplashFooter';

const onboardingSteps = [
  {
    icon: Printer,
    title: 'Welcome to MasterFabric Printer',
    description: 'Connect and manage your thermal Bluetooth printer with ease. Print text, images, and templates directly from your device.',
    info: [
      'Offline-first application - works without internet',
      'All data stored locally on your device',
      'Supports text, images, and custom templates',
      'Mobile-friendly interface',
    ],
  },
  {
    icon: Bluetooth,
    title: 'Bluetooth Connection',
    description: 'Make sure your printer is powered on and Bluetooth is enabled. The app will guide you through the connection process.',
    info: [
      'Requires Chrome or Edge browser',
      'Works on Android and desktop devices',
      'One-time pairing process',
      'Automatic reconnection on app restart',
    ],
  },
  {
    icon: FileText,
    title: 'Ready to Print',
    description: 'You can print text, upload images, or use saved templates. All data is stored locally on your device for privacy.',
    info: [
      'Print text with custom formatting',
      'Upload and print images (auto-resized)',
      'Save frequently used templates',
      'Print history tracking',
    ],
  },
  {
    icon: Wifi,
    title: 'Connect Your Printer',
    description: 'Connect to your thermal Bluetooth printer now. Make sure it\'s powered on and Bluetooth is enabled.',
    isConnectionStep: true,
    info: [
      'Ensure your printer is turned on',
      'Enable Bluetooth on your device',
      'Keep the printer within range',
      'Select your printer from the device list',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { 
    isConnected, 
    isConnecting, 
    statusMessage, 
    error,
    connect 
  } = usePrinter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const currentStepData = onboardingSteps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isConnectionStep = currentStepData.isConnectionStep;

  // Navigate to dashboard when connected
  useEffect(() => {
    if (isConnected && isConnectionStep) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnectionStep, router]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      // Error is handled by the hook and displayed in the UI
      console.error('Connection error:', err);
    }
  };

  const handleSkip = () => {
    if (isConnectionStep) {
      // If on connection step, skip to dashboard (without connecting)
      router.push('/dashboard');
    } else {
      // Skip to connection step
      setCurrentStep(onboardingSteps.length - 1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-6">
      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-md space-y-6">
        {/* Top Header */}
        <div className="w-full">
          <h1 className="text-lg font-semibold text-foreground text-center">MasterFabric Printer</h1>
        </div>

        {/* Progress Header */}
        <div className="w-full space-y-3">
          <h2 className="text-xl font-semibold text-foreground text-center">Getting Started</h2>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Step {currentStep + 1} of {onboardingSteps.length}
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="w-full flex-1 min-h-[400px]">
          <CardHeader className="text-center pb-10 pt-8">
            <div className="flex items-center justify-center mb-6">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full transition-colors ${
                isConnected && isConnectionStep
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-primary/10'
              }`}>
                {isConnected && isConnectionStep ? (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                ) : (
                  <Icon className={`h-12 w-12 ${
                    isConnectionStep ? 'text-primary' : 'text-primary'
                  }`} />
                )}
              </div>
            </div>
            <CardTitle className="text-xl mb-3">{currentStepData.title}</CardTitle>
            <CardDescription className="text-base mt-3 leading-relaxed">
              {currentStepData.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            {/* Connection Step Content */}
            {isConnectionStep && (
              <div className="space-y-4">
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
                      Successfully connected! Redirecting to dashboard...
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Information Section */}
            {!isConnectionStep && currentStepData.info && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-foreground mb-4">Key Features:</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {currentStepData.info.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Connection Tips for Connection Step */}
            {isConnectionStep && !isConnected && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-foreground mb-4">Connection Tips:</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {currentStepData.info?.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Step Indicators */}
            <div className="flex items-center justify-center space-x-2 pt-6">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-primary'
                      : index < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="w-full max-w-md space-y-4 pb-4">
        {isConnectionStep ? (
          // Connection step buttons
          <div className="space-y-3">
            {!isConnected && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Connect Printer
                  </>
                )}
              </Button>
            )}
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="w-full"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
        ) : (
          // Regular step buttons
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={currentStep === 0 ? 'w-full' : 'flex-1'}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        <SplashFooter />
      </div>
    </div>
  );
}

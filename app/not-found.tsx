'use client';

import { useRouter } from 'next/navigation';
import MobileContainer from '@/components/layout/MobileContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';
import SplashFooter from '@/components/splash/SplashFooter';

export default function NotFound() {
  const router = useRouter();

  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <Card className="w-full">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription className="text-base mt-3">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-4xl font-bold text-muted-foreground">404</p>
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t find the page you requested.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/')}
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="w-full max-w-md mt-8">
          <SplashFooter />
        </div>
      </div>
    </MobileContainer>
  );
}


'use client';

import { cn } from '@/lib/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div className="h-screen bg-muted/30 overflow-hidden">
      {/* Safe area padding for notched devices */}
      <div className={cn(
        "mx-auto w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl h-full px-4 pb-safe pt-safe sm:px-6 flex flex-col",
        className
      )}>
        <div className="flex flex-col h-full py-4 sm:py-6 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}


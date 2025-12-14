'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SendText from './SendText';
import SendImage from './SendImage';
import TemplateList from './TemplateList';
import SendEvent from './SendEvent';
import { BadgeElement } from './BadgeDesigner';

interface PrinterTabsProps {
  onEventPreviewUpdate?: (canvas: HTMLCanvasElement | null) => void;
  onTabChange?: (tab: string) => void;
  onEventNavigateAway?: () => Promise<boolean>;
  onDesignerElementsChange?: (elements: BadgeElement[]) => void;
  onSelectedDesignerElementChange?: (id: string | null) => void;
}

export default function PrinterTabs({ 
  onEventPreviewUpdate, 
  onTabChange, 
  onEventNavigateAway,
  onDesignerElementsChange,
  onSelectedDesignerElementChange,
}: PrinterTabsProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const handleTabChange = async (value: string) => {
    // If switching away from event tab, check for navigation warning
    if (activeTab === 'event' && value !== 'event' && onEventNavigateAway) {
      const canNavigate = await onEventNavigateAway();
      if (!canNavigate) {
        return; // Don't change tab if navigation was cancelled
      }
    }

    setActiveTab(value);
    onTabChange?.(value);
    // Clear preview when switching away from event tab
    if (value !== 'event' && onEventPreviewUpdate) {
      onEventPreviewUpdate(null);
    }
    setPendingTab(null);
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange}
      className="w-full overflow-x-hidden flex-1 min-h-0 flex flex-col h-full"
    >
      <TabsList className="grid w-full grid-cols-4 overflow-hidden flex-shrink-0 mb-4 h-10">
        <TabsTrigger value="text" className="truncate text-xs sm:text-sm">Text</TabsTrigger>
        <TabsTrigger value="image" className="truncate text-xs sm:text-sm">Image</TabsTrigger>
        <TabsTrigger value="event" className="truncate text-xs sm:text-sm">Event</TabsTrigger>
        <TabsTrigger value="templates" className="truncate text-xs sm:text-sm">Templates</TabsTrigger>
      </TabsList>
      
      <TabsContent value="text" className="overflow-x-hidden flex-1 min-h-0 overflow-y-auto mt-0">
        <SendText />
      </TabsContent>
      
      <TabsContent value="image" className="overflow-x-hidden flex-1 min-h-0 overflow-y-auto mt-0">
        <SendImage />
      </TabsContent>
      
      <TabsContent value="event" className="overflow-x-hidden flex-1 min-h-0 overflow-y-auto mt-0">
        <SendEvent 
          onPreviewUpdate={onEventPreviewUpdate}
          onDesignerElementsChange={onDesignerElementsChange}
          onSelectedDesignerElementChange={onSelectedDesignerElementChange}
        />
      </TabsContent>
      
      <TabsContent value="templates" className="overflow-x-hidden flex-1 min-h-0 overflow-y-auto mt-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <TemplateList />
      </TabsContent>
    </Tabs>
  );
}


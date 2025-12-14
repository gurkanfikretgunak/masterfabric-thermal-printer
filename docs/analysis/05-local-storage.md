# Local Storage Service (IndexedDB)

## Overview

The application uses IndexedDB for all persistent storage, making it a fully offline-capable PWA. The `idb` library provides a promise-based wrapper for easier usage.

---

## Installation

```bash
npm install idb
```

---

## Database Schema

```typescript
// lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PrinterAppDB extends DBSchema {
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: Date;
    };
  };
  templates: {
    key: string;
    value: {
      id: string;
      name: string;
      type: 'text' | 'image';
      content: TextContent | ImageContent;
      options: PrintOptions;
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-type': string; 'by-date': Date };
  };
  printHistory: {
    key: string;
    value: {
      id: string;
      templateId?: string;
      type: 'text' | 'image' | 'template';
      preview?: string; // Base64 thumbnail
      timestamp: Date;
      success: boolean;
    };
    indexes: { 'by-date': Date };
  };
}

interface TextContent {
  text: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
}

interface ImageContent {
  imageData: string;  // Base64 encoded
  originalWidth: number;
  originalHeight: number;
}

interface PrintOptions {
  dither: DitherMethod;
  brightness: number;
  rotate: 0 | 90 | 180 | 270;
  flip: 'none' | 'h' | 'v' | 'both';
  intensity: number;
}
```

---

## Database Initialization

```typescript
// lib/db.ts

const DB_NAME = 'printer-app-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PrinterAppDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PrinterAppDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PrinterAppDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Templates store
      if (!db.objectStoreNames.contains('templates')) {
        const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
        templateStore.createIndex('by-type', 'type');
        templateStore.createIndex('by-date', 'createdAt');
      }

      // Print history store
      if (!db.objectStoreNames.contains('printHistory')) {
        const historyStore = db.createObjectStore('printHistory', { keyPath: 'id' });
        historyStore.createIndex('by-date', 'timestamp');
      }
    },
  });

  return dbInstance;
}
```

---

## Settings Service

```typescript
// lib/db.ts

export const SettingsService = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    const db = await getDB();
    const result = await db.get('settings', key);
    return result ? result.value : defaultValue;
  },

  async set(key: string, value: any): Promise<void> {
    const db = await getDB();
    await db.put('settings', {
      key,
      value,
      updatedAt: new Date(),
    });
  },

  async delete(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('settings', key);
  },

  async getAll(): Promise<Record<string, any>> {
    const db = await getDB();
    const all = await db.getAll('settings');
    return Object.fromEntries(all.map(item => [item.key, item.value]));
  },
};

// Common settings keys
export const SETTINGS_KEYS = {
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  LAST_DEVICE_ID: 'lastDeviceId',
  PREFERRED_DITHER: 'preferredDitherMethod',
  PRINT_INTENSITY: 'printIntensity',
  AUTO_RECONNECT: 'autoReconnect',
} as const;
```

---

## Template Service

```typescript
// lib/db.ts

export const TemplateService = {
  async create(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await getDB();
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.add('templates', {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    });
    
    return id;
  },

  async getById(id: string): Promise<Template | undefined> {
    const db = await getDB();
    return db.get('templates', id);
  },

  async getAll(): Promise<Template[]> {
    const db = await getDB();
    return db.getAll('templates');
  },

  async getByType(type: 'text' | 'image'): Promise<Template[]> {
    const db = await getDB();
    return db.getAllFromIndex('templates', 'by-type', type);
  },

  async update(id: string, updates: Partial<Template>): Promise<void> {
    const db = await getDB();
    const existing = await db.get('templates', id);
    if (!existing) throw new Error('Template not found');
    
    await db.put('templates', {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date(),
    });
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('templates', id);
  },

  async deleteAll(): Promise<void> {
    const db = await getDB();
    await db.clear('templates');
  },
};
```

---

## Print History Service

```typescript
// lib/db.ts

export const PrintHistoryService = {
  async add(entry: Omit<PrintHistoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const db = await getDB();
    const id = crypto.randomUUID();
    
    await db.add('printHistory', {
      ...entry,
      id,
      timestamp: new Date(),
    });
    
    return id;
  },

  async getAll(limit?: number): Promise<PrintHistoryEntry[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('printHistory', 'by-date');
    const sorted = all.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('printHistory');
  },

  async getCount(): Promise<number> {
    const db = await getDB();
    return db.count('printHistory');
  },
};
```

---

## React Hook for Settings

```typescript
// hooks/useLocalSettings.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SettingsService } from '@/lib/db';

export function useLocalSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SettingsService.get(key, defaultValue)
      .then(setValue)
      .finally(() => setIsLoading(false));
  }, [key, defaultValue]);

  const updateValue = useCallback(async (newValue: T) => {
    await SettingsService.set(key, newValue);
    setValue(newValue);
  }, [key]);

  return { value, setValue: updateValue, isLoading };
}
```

---

## Zustand Store with IndexedDB Persistence

```typescript
// stores/settingsStore.ts
import { create } from 'zustand';
import { SettingsService, SETTINGS_KEYS } from '@/lib/db';

interface SettingsStore {
  // State
  hasCompletedOnboarding: boolean;
  lastDeviceId: string | null;
  preferredDitherMethod: string;
  printIntensity: number;
  autoReconnect: boolean;
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  setLastDeviceId: (id: string | null) => Promise<void>;
  setPreferredDitherMethod: (method: string) => Promise<void>;
  setPrintIntensity: (intensity: number) => Promise<void>;
  setAutoReconnect: (auto: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  // Initial state
  hasCompletedOnboarding: false,
  lastDeviceId: null,
  preferredDitherMethod: 'steinberg',
  printIntensity: 0x5d,
  autoReconnect: true,
  isHydrated: false,

  // Hydrate from IndexedDB
  hydrate: async () => {
    const [
      hasCompletedOnboarding,
      lastDeviceId,
      preferredDitherMethod,
      printIntensity,
      autoReconnect,
    ] = await Promise.all([
      SettingsService.get(SETTINGS_KEYS.HAS_COMPLETED_ONBOARDING, false),
      SettingsService.get(SETTINGS_KEYS.LAST_DEVICE_ID, null),
      SettingsService.get(SETTINGS_KEYS.PREFERRED_DITHER, 'steinberg'),
      SettingsService.get(SETTINGS_KEYS.PRINT_INTENSITY, 0x5d),
      SettingsService.get(SETTINGS_KEYS.AUTO_RECONNECT, true),
    ]);

    set({
      hasCompletedOnboarding,
      lastDeviceId,
      preferredDitherMethod,
      printIntensity,
      autoReconnect,
      isHydrated: true,
    });
  },

  setOnboardingComplete: async (complete) => {
    await SettingsService.set(SETTINGS_KEYS.HAS_COMPLETED_ONBOARDING, complete);
    set({ hasCompletedOnboarding: complete });
  },

  setLastDeviceId: async (id) => {
    await SettingsService.set(SETTINGS_KEYS.LAST_DEVICE_ID, id);
    set({ lastDeviceId: id });
  },

  setPreferredDitherMethod: async (method) => {
    await SettingsService.set(SETTINGS_KEYS.PREFERRED_DITHER, method);
    set({ preferredDitherMethod: method });
  },

  setPrintIntensity: async (intensity) => {
    await SettingsService.set(SETTINGS_KEYS.PRINT_INTENSITY, intensity);
    set({ printIntensity: intensity });
  },

  setAutoReconnect: async (auto) => {
    await SettingsService.set(SETTINGS_KEYS.AUTO_RECONNECT, auto);
    set({ autoReconnect: auto });
  },
}));
```

---

## App Initialization

```typescript
// app/providers.tsx
'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}
```

---

## Storage Limits

IndexedDB has generous storage limits:

| Browser | Storage Limit |
|---------|--------------|
| Chrome | Up to 80% of disk |
| Firefox | Up to 50% of disk |
| Safari | ~1GB |

For this app, typical usage:
- Settings: < 1 KB
- Templates (10): ~100 KB each = ~1 MB
- History (100): ~10 KB each = ~1 MB
- **Total**: < 5 MB (well within limits)

---

## Testing Checklist

- [ ] Test database initialization
- [ ] Test settings CRUD operations
- [ ] Test template CRUD operations
- [ ] Test print history operations
- [ ] Test Zustand store hydration
- [ ] Test data persistence across app restarts
- [ ] Test storage in different browsers

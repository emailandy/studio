
'use client';

import React, { createContext, useContext } from 'react';
import { useLiveAPI } from '@/hooks/use-live-api';
import type { Part } from '@google/genai/web';
import type { ItineraryData } from '@/app/page';

type LiveAPIContextType = {
    connect: (data?: ItineraryData) => Promise<void>;
    disconnect: () => void;
    send: (parts: Part | Part[]) => void;
    stream?: MediaStream | null;
};

const LiveAPIContext = createContext<LiveAPIContextType | null>(null);

export function LiveAPIProvider({ children }: { children: React.ReactNode }) {
  const api = useLiveAPI();

  return (
    <LiveAPIContext.Provider value={api}>
      {children}
    </LiveAPIContext.Provider>
  );
}

export function useLiveAPIContext() {
    const context = useContext(LiveAPIContext);
    if (!context) {
        throw new Error('useLiveAPIContext must be used within a LiveAPIProvider');
    }
    return context;
}

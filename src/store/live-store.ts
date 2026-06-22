
'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Session as LiveSession, Part } from '@google/genai/web';
import type { ItineraryData, MapData } from '@/app/page';

interface LiveState {
  // Session and connection state
  session: LiveSession | null;
  connected: boolean;
  stream: MediaStream | null;
  error: string | null;

  // UI/Interaction state
  text: string;
  isListening: boolean;
  isSpeaking: boolean;
  volume: number;
  micActive: boolean;
  cameraActive: boolean;
  
  // Tour-specific state
  itineraryData: ItineraryData | null;
  tourIndex: number;
  mapData: MapData | null;
  activeDay: number;
}

interface LiveActions {
  // Connection actions
  setSession: (session: LiveSession | null) => void;
  setConnected: (connected: boolean) => void;
  setStream: (stream: MediaStream | null) => void;
  setError: (error: string | null) => void;
  
  // UI/Interaction actions
  setText: (text: string) => void;
  appendText: (chunk: string) => void;
  setIsListening: (isListening: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  
  // Tour actions
  startTour: (itineraryData: ItineraryData) => void;
  setTourIndex: (index: number) => void;
  setMapData: (mapData: MapData | null) => void;
  setActiveDay: (day: number) => void;
  
  // Lifecycle actions
  reset: () => void;
}

const initialState: LiveState = {
  session: null,
  connected: false,
  stream: null,
  error: null,
  text: '',
  isListening: false,
  isSpeaking: false,
  volume: 0,
  micActive: true,
  cameraActive: true,
  itineraryData: null,
  tourIndex: -1,
  mapData: null,
  activeDay: 0,
};

export const useLiveStore = create<LiveState & LiveActions>()(
  immer((set) => ({
    ...initialState,
    
    setSession: (session) => set({ session }),
    setConnected: (connected) => set({ connected }),
    setStream: (stream) => set({ stream }),
    setError: (error) => set({ error }),

    setText: (text) => set({ text }),
    appendText: (chunk) => set((state) => { state.text += chunk }),
    setIsListening: (isListening) => set({ isListening }),
    setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
    setVolume: (volume) => set({ volume }),
    toggleMic: () => set((state) => { state.micActive = !state.micActive }),
    toggleCamera: () => set((state) => { state.cameraActive = !state.cameraActive }),
    
    startTour: (itineraryData) => set({ itineraryData, tourIndex: 0, text: '' }),
    setTourIndex: (index) => set({ tourIndex: index }),
    setMapData: (mapData) => set({ mapData }),
    setActiveDay: (activeDay) => set({ activeDay }),

    reset: () => {
      set((state) => {
        // Stop all tracks on the stream before resetting
        if (state.stream) {
          state.stream.getTracks().forEach(track => track.stop());
        }
        return initialState;
      });
    },
  }))
);

// Derived state and utility functions can be accessed via selectors
export const selectIsTourActive = (state: LiveState) => state.itineraryData !== null && state.connected;

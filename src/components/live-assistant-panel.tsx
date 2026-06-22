'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLiveAPIContext } from '@/context/live-api-context';
import { useLiveStore } from '@/store/live-store';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, Play, Pause, MessageSquare, Terminal } from 'lucide-react';

export default function LiveAssistantPanel({ isMobile }: { isMobile?: boolean }) {
    const { connect, disconnect, send, stream } = useLiveAPIContext();
    const store = useLiveStore();
    const [isOpen, setIsOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handleToggleConnection = async () => {
        if (store.connected) {
            disconnect();
        } else {
            // Pass active itinerary if available to start the tour
            if (store.itineraryData) {
                await connect(store.itineraryData);
            } else {
                await connect();
            }
        }
    };

    const handleToggleMic = () => {
        useLiveStore.setState({ micActive: !store.micActive });
    };

    const handleToggleCamera = () => {
        useLiveStore.setState({ cameraActive: !store.cameraActive });
    };

    const handleNextStop = () => {
        send({ text: "Next stop please" });
    };

    if (!isOpen) {
        return (
            <Button 
                onClick={() => {
                    setIsOpen(true);
                    useLiveStore.setState({ cameraActive: true, micActive: true });
                    handleToggleConnection(); // Auto-connect when opened!
                }}
                className={`fixed bottom-6 ${isMobile ? 'left-1/2 -translate-x-1/2' : 'right-6'} rounded-full w-16 h-16 shadow-2xl bg-primary hover:bg-primary-dark border-4 border-white animate-bounce`}
            >
                <Mic className="w-6 h-6 text-white" />
            </Button>
        );
    }

    return (
        <div className={`fixed bottom-6 ${isMobile ? 'left-1/2 -translate-x-1/2 h-12 max-w-[240px]' : 'right-6 h-24 max-w-[400px]'} w-auto bg-white/95 rounded-full flex items-center justify-between p-1.5 shadow-2xl backdrop-blur-md z-50 border border-slate-200`}>
            <div 
                className={`${isMobile ? 'w-9 h-9' : 'w-16 h-16'} rounded-full overflow-hidden flex-shrink-0 relative border-2 border-primary ml-1 cursor-pointer`}
                onClick={handleToggleCamera} // Clicking video pauses the camera!
            >
                <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-full"
                />
            </div>
            
            <div className="flex-grow flex items-center justify-center h-full px-6 gap-3 cursor-pointer" onClick={handleToggleMic}> {/* Clicking dots mutes the mic! */}
                <div className="flex gap-2 items-center">
                    <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${store.micActive ? 'bg-blue-500' : 'bg-slate-300'} ${store.micActive && (store.isSpeaking || store.volume > 0.05) ? 'animate-bounce' : ''}`} />
                    <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${store.micActive ? 'bg-blue-500' : 'bg-slate-300'} ${store.micActive && (store.isSpeaking || store.volume > 0.1) ? 'animate-bounce delay-150' : ''}`} />
                    <div className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${store.micActive ? 'bg-blue-500' : 'bg-slate-300'} ${store.micActive && (store.isSpeaking || store.volume > 0.15) ? 'animate-bounce delay-300' : ''}`} />
                </div>
            </div>
            
            <div className="pr-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        disconnect();
                        setIsOpen(false);
                    }}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                >
                    ✕
                </Button>
            </div>
        </div>
    );
}

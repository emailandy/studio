"use client";

import { useState, useEffect } from "react";

export default function DuringTripPage() {
  const [view, setView] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      setView(v);
    }
  }, []);

  const iframeSrc = view === 'mobile-call' 
    ? '/during-trip/mobile-call' 
    : view === 'homescreen'
      ? '/during-trip/homescreen'
      : view === 'saved-trips'
        ? '/during-trip/saved-trips'
        : '/during-trip/itinerary';
  return (
    <main className="relative min-h-screen w-full bg-[#EFEFEF] flex items-center justify-center overflow-hidden">
      
      {/* Clean Phone Mockup Container (Maximized to exactly fill screen height edge-to-edge) */}
      <div className="relative h-screen aspect-square bg-contain bg-center bg-no-repeat scale-[1.25]" 
           style={{ backgroundImage: "url('/images/clean_pixel_frame.jpg')" }}>
        
        {/* Iframe inside the phone screen area (Expanded width by 3px each side) */}
        <div className="absolute top-[14.8%] bottom-[14.8%] left-[calc(34.2%-3px)] right-[calc(34.2%-3px)] rounded-[24px] overflow-hidden bg-white shadow-inner">
          <iframe 
            src={iframeSrc} 
            className="w-full h-full border-none" 
            title="Simulator Screen"
          />
        </div>
        
      </div>

    </main>
  );
}

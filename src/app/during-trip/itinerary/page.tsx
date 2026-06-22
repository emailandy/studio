"use client";

import { useEffect, useState } from "react";
import { Compass, MapIcon, Sparkles, MessageSquare, ChevronLeft, MapPin } from "lucide-react";
import { useLiveStore } from "@/store/live-store";
import { searchPlace } from "@/utils/geocoding";
import MapDisplay from "@/components/map-display";
import PricelineMobileHeader from "@/components/priceline-mobile-header";
import LiveAssistantPanel from "@/components/live-assistant-panel";
import { Card, CardContent } from "@/components/ui/card";

export default function MobileItineraryPage() {
  const mapData = useLiveStore(state => state.mapData);
  const itineraryData = useLiveStore(state => state.itineraryData);
  const itinerary = itineraryData?.itinerary;
  const setMapData = useLiveStore(state => state.setMapData);
  const activeDay = useLiveStore(state => state.activeDay);
  const setActiveDay = useLiveStore(state => state.setActiveDay);
  const tourIndex = useLiveStore(state => state.tourIndex);

  useEffect(() => {
    const itineraryStr = localStorage.getItem('activeItinerary');
    const mapStr = localStorage.getItem('mapData');
    if (itineraryStr && mapStr) {
      const parsedItin = JSON.parse(itineraryStr);
      const parsedMap = JSON.parse(mapStr);
      setMapData(parsedMap);
      useLiveStore.setState({ itineraryData: { itinerary: parsedItin, destination: parsedMap.name } });
    }
  }, []);

  useEffect(() => {
    console.log("[MobileItineraryPage] tourIndex sync triggered. tourIndex:", tourIndex);
    if (tourIndex >= 0 && itinerary) {
       const activeDayLocations = itinerary[activeDay]?.locations || [];
       if (tourIndex < activeDayLocations.length) {
          const loc = activeDayLocations[tourIndex];
          console.log("[MobileItineraryPage] Geocoding for automatic live stop sync:", loc.name);
          
          const syncMap = async () => {
             const destinationCity = (itineraryData as any)?.detectedDestination || mapData?.location?.name || "";
             const queryTerm = loc.searchQuery || loc.name;
             let targetAddress = destinationCity ? `${queryTerm}, ${destinationCity}` : queryTerm;
             
             try {
                const placeInfo = await searchPlace(targetAddress, loc.placeId);
                setMapData({
                  location: {
                    name: loc.name,
                    lat: placeInfo.lat,
                    lng: placeInfo.lng,
                    placeId: loc.placeId || placeInfo.placeId,
                  },
                  place: { ...loc, ...placeInfo, name: loc.name } as any
                });
             } catch (e) {
                console.error("Geocoding failed for live mobile stop sync:", e);
             }
          };
          syncMap();
       }
    }
  }, [tourIndex, itinerary, activeDay]);

  const currentDayLocations = itinerary ? itinerary[activeDay]?.locations || [] : [];

  return (
    <div className="relative h-screen w-full bg-slate-100 font-sans overflow-hidden">
      
      <PricelineMobileHeader />
      
      {/* 1. Base Layer: 3D Map Display shifted down for the header */}
      <div className="absolute top-14 bottom-0 left-0 right-0 z-0">
        <MapDisplay data={mapData} itinerary={itinerary} isMobile={true} />
      </div>

      {/* 2. Overlays & Controls */}
      
      {/* Floating Day Selector Bubble - Centered, shifted down for the header */}
      <div className="absolute top-[72px] left-4 right-4 z-20 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/20">
        <div className="flex space-x-1">
          {itinerary && itinerary.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDay(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                activeDay === idx 
                  ? "bg-slate-900 text-white shadow-md scale-105" 
                  : "bg-white/50 text-slate-600 hover:bg-white/80"
              }`}
            >
              Day {idx + 1}
            </button>
          ))}
        </div>
      </div>



      <LiveAssistantPanel isMobile={true} />
    </div>
  );
}

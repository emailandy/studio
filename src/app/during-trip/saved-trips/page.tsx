'use client';

import { Plane, MapPin, Calendar, Trash2, ArrowLeft, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PricelineMobileHeader from '@/components/priceline-mobile-header';

interface SavedTrip {
  id: string;
  name: string;
  itinerary?: any;
  itineraryResponse?: any;
  mapData?: any;
  savedAt: string;
}

export default function MobileSavedTripsPage() {
  const router = useRouter();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStr = localStorage.getItem('savedTrips') || '[]';
      try {
        setSavedTrips(JSON.parse(savedStr));
      } catch (e) {
        console.error("Failed to parse saved trips", e);
      }
      setIsLoading(false);
    }
  }, []);

  const handleLoadTrip = (trip: SavedTrip) => {
    if (trip.itineraryResponse) {
      localStorage.setItem('activeItinerary', JSON.stringify(trip.itineraryResponse.itinerary));
    } else if (trip.itinerary) {
      localStorage.setItem('activeItinerary', JSON.stringify(trip.itinerary));
    }
    if (trip.mapData) {
      localStorage.setItem('mapData', JSON.stringify(trip.mapData));
    }
    // Redirect to mobile itinerary review page instead of desktop booking page
    router.push('/during-trip/itinerary'); 
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem('savedTrips', JSON.stringify(updated));
  };

  return (
    <div className="relative h-screen w-full bg-[#f4f7f9] font-sans overflow-y-auto">
      
      <PricelineMobileHeader />

      {/* Main Content (Shifted down for fixed header) */}
      <div className="pt-14 pb-12 px-4">
        
        {/* Title */}
        <div className="flex items-center gap-2 mt-4 mb-3">
          <ArrowLeft className="w-5 h-5 text-[#001D6C] cursor-pointer" onClick={() => router.push('/during-trip/homescreen')} />
          <h2 className="text-xl font-bold text-[#001D6C]">Saved Trips</h2>
        </div>

        {/* Search Bar / Filter (Simulated) */}
        <div className="relative bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search saved trips" className="w-full bg-transparent outline-none text-slate-800 text-sm" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin mb-4"><Plane className="w-8 h-8 text-[#0055D4]" /></div>
            <p className="text-sm text-slate-600">Loading trips...</p>
          </div>
        ) : savedTrips.length === 0 ? (
          <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 border border-slate-200 border-dashed">
            <div className="p-4 bg-slate-50 rounded-full text-slate-400">
              <Plane className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#001D6C]">No Saved Trips Found</h3>
              <p className="text-xs text-slate-600 max-w-[200px]">
                Generate an itinerary and click "Save" to see it here.
              </p>
            </div>
            <button 
              onClick={() => router.push('/during-trip/homescreen')}
              className="bg-[#0055D4] text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedTrips.map((trip) => (
              <div 
                key={trip.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => handleLoadTrip(trip)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-grow pr-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#0055D4] uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      <span>Itinerary</span>
                    </div>
                    <h3 className="text-base font-bold text-[#001D6C] line-clamp-2 leading-tight">
                      {trip.name}
                    </h3>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteTrip(trip.id, e)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{trip.savedAt.split(',')[0]}</span>
                  </div>
                  <span className="font-semibold text-[#0055D4] text-xs">Load Trip →</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

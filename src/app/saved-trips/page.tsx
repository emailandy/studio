"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2Icon, PlaneIcon, CalendarIcon, MapPinIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GenerateItineraryOutput } from "@/ai/schemas/itinerary-schema";
import type { MapData, ItineraryData } from "@/app/page";
import Image from "next/image";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface SavedTrip {
  id: string;
  name: string;
  itinerary?: GenerateItineraryOutput['itinerary'];
  itineraryResponse?: ItineraryData;
  mapData?: MapData;
  savedAt: string;
  bannerUrl?: string;
}

export default function SavedTripsPage() {
  const router = useRouter();
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoading(true);
        try {
          console.log("Fetching trips from Firestore for user:", user.uid);
          const trips: SavedTrip[] = [];
          const tripIds = new Set<string>();
          
          const q1 = query(collection(db, "trips"), where("userId", "==", user.uid));
          const snapshot1 = await getDocs(q1);
          
          snapshot1.forEach((doc) => {
            const trip = doc.data();
            tripIds.add(trip.id);
            trips.push({
              id: trip.id,
              name: trip.name,
              itinerary: JSON.parse(trip.itinerary),
              mapData: JSON.parse(trip.mapData),
              savedAt: trip.savedAt,
              videoId: trip.videoId,
              bannerUrl: trip.bannerUrl
            });
          });
          
          if (user.email) {
            console.log("Fetching shared trips for email:", user.email);
            const q2 = query(collection(db, "trips"), where("sharedWith", "array-contains", user.email));
            const snapshot2 = await getDocs(q2);
            
            snapshot2.forEach((doc) => {
              const trip = doc.data();
              if (!tripIds.has(trip.id)) {
                tripIds.add(trip.id);
                trips.push({
                  id: trip.id,
                  name: trip.name,
                  itinerary: JSON.parse(trip.itinerary),
                  mapData: JSON.parse(trip.mapData),
                  savedAt: trip.savedAt,
                  videoId: trip.videoId,
                  bannerUrl: trip.bannerUrl
                });
              }
            });
          }
          
          setSavedTrips(trips);
        } catch (e) {
          console.error("Failed to fetch trips from Data Connect", e);
        }
        setIsLoading(false);
      } else {
        const savedStr = localStorage.getItem('savedTrips') || '[]';
        try {
          setSavedTrips(JSON.parse(savedStr));
        } catch (e) {
          console.error("Failed to parse saved trips", e);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoadTrip = (trip: SavedTrip) => {
    router.push(`/?tripId=${trip.id}`);
  };

  const handleDeleteTrip = async (id: string) => {
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteDoc(doc(db, "trips", id));
      } catch (e) {
        console.error("Failed to delete trip from Firestore", e);
      }
    } else {
      localStorage.setItem('savedTrips', JSON.stringify(updated));
    }
  };

  const handleRenameTrip = async (id: string, currentName: string) => {
    const newName = window.prompt("Enter new name for the trip:", currentName);
    if (!newName || newName === currentName) return;
    
    const updated = savedTrips.map(t => t.id === id ? { ...t, name: newName } : t);
    setSavedTrips(updated);
    
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "trips", id), { name: newName });
      } catch (e) {
        console.error("Failed to rename trip in Firestore", e);
      }
    } else {
      localStorage.setItem('savedTrips', JSON.stringify(updated));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-900">
        <div className="animate-spin mb-4"><PlaneIcon size={48} className="text-blue-600" /></div>
        <p className="text-lg text-slate-600">Loading Saved Trips...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-slate-50/50 text-slate-900">
      <div className="w-full max-w-6xl mx-auto px-6 py-12 space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-800 px-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
            <h1 className="text-3xl font-bold font-headline text-slate-900 tracking-tight mt-2">Find My Trip</h1>
            <p className="text-sm text-slate-600">Manage and reload your saved travel itineraries here.</p>
          </div>
        </div>

        {savedTrips.length === 0 ? (
          <Card className="bg-white border-slate-200 border-dashed p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-slate-100 rounded-full text-slate-400">
              <PlaneIcon size={40} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">No Saved Trips Found</h2>
              <p className="text-slate-600 text-sm max-w-sm">
                Generate an itinerary and click "Save" inside detail view to keep it preserved list.
              </p>
            </div>
            <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              Start Exploring
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <Card key={trip.id} className="bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden" onClick={() => handleLoadTrip(trip)}>
                {trip.bannerUrl && (
                  <div className="w-full h-40 relative">
                    <img src={trip.bannerUrl} alt={trip.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold tracking-wide text-blue-600 uppercase flex items-center gap-1">
                         <MapPinIcon size={12} /> Saved Itinerary
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameTrip(trip.id, trip.name);
                          }}
                          className="text-slate-600 hover:text-blue-600 transition-colors"
                          title="Rename Trip"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTrip(trip.id);
                          }}
                          className="text-slate-400 hover:text-destructive transition-colors"
                          title="Delete Trip"
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold font-headline text-slate-900 line-clamp-2">{trip.name}</h3>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={12} />
                      <span>{trip.savedAt.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/booking?tripId=${trip.id}`);
                        }}
                        className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Preview Trip →
                      </button>
                      <div className="font-medium text-blue-600">Load Trip →</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

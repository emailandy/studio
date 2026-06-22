
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  generateGroundedResponse,
} from "@/ai/flows/generate-grounded-response";
import {
  generateMapsGroundedResponse
} from "@/ai/flows/generate-maps-grounded-response";
import { generateItinerary } from "@/ai/flows/generate-itinerary";
import { generateItineraryBanner } from "@/ai/flows/generate-itinerary-banner";
import { searchYoutubeVideos } from "@/ai/flows/search-youtube-videos";
import { VideoResultDisplay } from "@/components/video-result-display";
import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import type { GenerateGroundedResponseOutput, PointOfInterest } from "@/ai/schemas/grounded-response-schema";
import type { GenerateItineraryOutput } from "@/ai/schemas/itinerary-schema";
import type { GenerateItineraryInput } from "@/ai/schemas/itinerary-schema";
import { ResultsDisplay } from "@/components/results-display";
import { LoadingState } from "@/components/loading-state";
import { Search, Youtube, Sparkles, Loader, Plane, Map, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ItineraryDisplay } from "@/components/itinerary-display";
import MapDisplay from "@/components/map-display";
import type { Video } from "@/lib/types";
import { findHotels } from "@/ai/flows/find-hotels";
import type { FindHotelsOutput, Hotel } from "@/ai/schemas/hotel-schema";
import { HotelDisplay } from "@/components/hotel-display";
import { findTrendyEvents } from "@/ai/flows/find-trendy-events";
import type { FindTrendyEventsOutput } from "@/ai/schemas/event-schema";
import { EventsDisplay } from "@/components/events-display";
import { calculateDistancesAction } from "@/actions/maps";
import { useLiveStore } from "@/store/live-store";
import Link from "next/link";
import { auth, db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";


const groundedSearchSchema = z.object({
  query: z.string().min(2, {
    message: "Query must be at least 2 characters.",
  }),
});

const mapsGroundedSearchSchema = z.object({
  query: z.string().min(2, {
    message: "Query must be at least 2 characters.",
  }),
  location: z.string().optional(),
});


const videoSearchSchema = z.object({
  youtubeUrl: z.string().min(1, {
    message: "Please enter a valid YouTube video URL.",
  }),
});

const youtubeVideoSearchSchema = z.object({
  destination: z.string().min(1, {
    message: "Please enter a destination.",
  }),
  travelStyle: z.string().min(1, {
    message: "Please enter a travel style.",
  }),
  budget: z.string().optional(),
});

export interface ItineraryData {
  video: Video;
  itinerary: GenerateItineraryOutput['itinerary'];
  videoSummary: string;
  destination: string;
  bannerUrl?: string;
  isBannerLoading: boolean;
  bannerAiHint?: string;
}

export type MapData = {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  place: PointOfInterest | null;
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get('tripId');

  const [groundedResponse, setGroundedResponse] =
    useState<GenerateGroundedResponseOutput | null>(null);
  const [itineraryResponse, setItineraryResponse] = 
    useState<ItineraryData | null>(null);

  useEffect(() => {
    async function loadSavedTrip() {
      if (tripId) {
        setIsItineraryLoading(true);
        try {
          const docSnap = await getDoc(doc(db, "trips", tripId));
          if (docSnap.exists()) {
            const tripData = docSnap.data();
            console.log("[HomePage] Loaded from Firestore:", tripData);
            const parsedMapData = JSON.parse(tripData.mapData);
            setMapData(parsedMapData);
            setItineraryResponse({
              video: {
                id: tripData.videoId || '',
                url: '',
                title: tripData.name,
                thumbnail: tripData.thumbnail || '',
                description: '',
              },
              itinerary: JSON.parse(tripData.itinerary),
              videoSummary: '',
              destination: parsedMapData?.location?.name || tripData.name,
              bannerUrl: tripData.bannerUrl,
              isBannerLoading: false,
            });
            setActiveTab("video");
          }
        } catch (e) {
          console.error("Failed to load trip from Firestore", e);
        }
        setIsItineraryLoading(false);
      }
    }
    loadSavedTrip();
  }, [tripId]);
  const [youtubeVideoSearchResults, setYoutubeVideoSearchResults] = useState<SearchYoutubeVideosOutput | null>(null);
  const [hotelResponse, setHotelResponse] = useState<FindHotelsOutput | null>(null);
  const [eventsResponse, setEventsResponse] = useState<FindTrendyEventsOutput | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isItineraryLoading, setIsItineraryLoading] = useState(false);
  const [isHotelLoading, setIsHotelLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [selectedTravelStyle, setSelectedTravelStyle] = useState<string>("Standard");
  const [lastSearchedDestination, setLastSearchedDestination] = useState<string>("");
  const { toast } = useToast();


  const handleBookNow = () => {
    if (itineraryResponse) {
      localStorage.setItem('activeItinerary', JSON.stringify(itineraryResponse.itinerary));
      if (itineraryResponse.videoId) {
        localStorage.setItem('videoId', itineraryResponse.videoId);
      }
    }
    if (mapData) {
      localStorage.setItem('mapData', JSON.stringify(mapData));
    }
    router.push('/booking');
  };

  const handleSaveDraft = async () => {
    if (!itineraryResponse) return;
    
    const newTrip = {
      id: Date.now().toString(),
      name: lastSearchedDestination ? `Draft Trip to ${lastSearchedDestination}` : "Draft Travel Discovery",
      itinerary: itineraryResponse.itinerary,
      mapData: mapData || undefined,
      savedAt: new Date().toLocaleString(),
      videoId: itineraryResponse.videoId || ''
    };

    const user = auth.currentUser;
    if (user) {
      try {
        let finalBannerUrl = itineraryResponse.bannerUrl;
        if (itineraryResponse.bannerUrl && itineraryResponse.bannerUrl.startsWith('data:')) {
          try {
            const storageRef = ref(storage, `trips/${newTrip.id}/banner.png`);
            await uploadString(storageRef, itineraryResponse.bannerUrl, 'data_url');
            finalBannerUrl = await getDownloadURL(storageRef);
            console.log("Banner uploaded to Storage:", finalBannerUrl);
          } catch (storageErr) {
            console.error("Failed to upload banner to Storage:", storageErr);
          }
        }

        await setDoc(doc(db, "trips", newTrip.id), {
          id: newTrip.id,
          userId: user.uid,
          name: newTrip.name,
          itinerary: JSON.stringify(newTrip.itinerary),
          mapData: JSON.stringify(newTrip.mapData),
          savedAt: newTrip.savedAt,
          videoId: newTrip.videoId,
          bannerUrl: finalBannerUrl,
          thumbnail: itineraryResponse.video.thumbnail || ''
        });

        toast({
            title: "Trip Saved to Cloud",
            description: "Access via Find My Trip dashboard.",
        });
      } catch (e) {
        console.error("Failed to save trip to Data Connect", e);
        toast({
            variant: "destructive",
            title: "Cloud Save Failed",
            description: "Saved locally instead.",
        });
        const savedStr = localStorage.getItem('savedTrips') || '[]';
        const savedList = JSON.parse(savedStr);
        savedList.push(newTrip);
        localStorage.setItem('savedTrips', JSON.stringify(savedList));
      }
    } else {
      const savedStr = localStorage.getItem('savedTrips') || '[]';
      const savedList = JSON.parse(savedStr);
      savedList.push(newTrip);
      localStorage.setItem('savedTrips', JSON.stringify(savedList));
      toast({
          title: "Draft Saved Locally",
          description: "Sign in to sync with cloud.",
      });
    }
  };

  const groundedSearchForm = useForm<z.infer<typeof groundedSearchSchema>>({
    resolver: zodResolver(groundedSearchSchema),
    defaultValues: {
      query: "",
    },
  });

  const mapsGroundedSearchForm = useForm<z.infer<typeof mapsGroundedSearchSchema>>({
    resolver: zodResolver(mapsGroundedSearchSchema),
    defaultValues: {
      query: "",
      location: "",
    },
  });

  const videoSearchForm = useForm<z.infer<typeof videoSearchSchema>>({
    resolver: zodResolver(videoSearchSchema),
    defaultValues: {
      youtubeUrl: "",
    },
  });

  const youtubeVideoSearchForm = useForm<z.infer<typeof youtubeVideoSearchSchema>>({
    resolver: zodResolver(youtubeVideoSearchSchema),
    defaultValues: {
      destination: "",
      travelStyle: "Foodie",
      budget: "",
    },
  });

  // Subscribe to tour index changes to update the map
  const tourIndex = useLiveStore((state) => state.tourIndex);

  useEffect(() => {
    if (tourIndex >= 0 && itineraryResponse) {
      const allLocations = itineraryResponse.itinerary.flatMap(day => day.locations);
      if (tourIndex < allLocations.length) {
        const currentLocation = allLocations[tourIndex];
        if (currentLocation.address && currentLocation.address !== "Address not available") {
            handleMapLocationSelect(currentLocation as any);
        }
      }
    }
  }, [tourIndex, itineraryResponse]);


  async function onGroundedSearchSubmit(
    values: z.infer<typeof groundedSearchSchema>
  ) {
    setIsLoading(true);
    setGroundedResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    try {
      const result = await generateGroundedResponse({ query: values.query });
      setGroundedResponse(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from Gemini. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const geocodeAddress = (address: string): Promise<google.maps.LatLngLiteral> => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            return reject(new Error("Google Maps API not loaded."));
        }
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({ lat: location.lat(), lng: location.lng() });
            } else {
                reject(new Error(`Geocode was not successful for the following reason: ${status}`));
            }
        });
    });
  };

  async function onMapsGroundedSearchSubmit(
    values: z.infer<typeof mapsGroundedSearchSchema>
  ) {
    setIsLoading(true);
    setGroundedResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    try {
      let locationCoords: { latitude: number; longitude: number; } | undefined = undefined;
      if (values.location) {
        try {
          const geocoded = await geocodeAddress(values.location);
          locationCoords = { latitude: geocoded.lat, longitude: geocoded.lng };
        } catch (e) {
          console.warn("Could not geocode location, proceeding without it.", e);
          toast({
            variant: "default",
            title: "Location Not Found",
            description: `Could not find "${values.location}" on the map. Performing a general search instead.`,
          });
        }
      }

      const result = await generateMapsGroundedResponse({ query: values.query, location: locationCoords });
      setGroundedResponse(result);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from Gemini Maps. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }


  async function onVideoSearchSubmit(values: z.infer<typeof videoSearchSchema>) {
    if (values.youtubeUrl) {
      const match = values.youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match ? match[1] : null;
      if (!videoId) {
        toast({
          variant: "destructive",
          title: "Invalid URL",
          description: "Please enter a valid YouTube video URL.",
        });
        return;
      }
      setYoutubeVideoSearchResults(null); // Clear search results if using direct link
      handleGenerateItinerary({ id: videoId, title: "Direct Link Video", description: "", thumbnail: "", url: values.youtubeUrl });
    }
  }

  async function onYoutubeVideoSearchSubmit(values: z.infer<typeof youtubeVideoSearchSchema>) {
    if (values.travelStyle) {
      setSelectedTravelStyle(values.travelStyle);
    }
    setLastSearchedDestination(values.destination);
    setIsLoading(true);
    setYoutubeVideoSearchResults(null);
    setItineraryResponse(null);
    try {
      const result = await searchYoutubeVideos({
        destination: values.destination,
        travelType: values.travelStyle,
        budget: values.budget,
      });
      setYoutubeVideoSearchResults(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Failed to find relevant videos on YouTube. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeelingLuckySubmit() {
    const values = youtubeVideoSearchForm.getValues();
    if (!values.destination || !values.travelStyle || !values.budget) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Budget is required for Feeling Lucky! Please fill all fields.",
      });
      return;
    }
    
    setLastSearchedDestination(values.destination);
    setIsLoading(true);
    setYoutubeVideoSearchResults(null);
    setItineraryResponse(null);
    
    try {
      const result = await searchYoutubeVideos({
        destination: values.destination,
        travelType: values.travelStyle,
        budget: values.budget,
      });
      
      if (!result.videos || result.videos.length === 0) {
        throw new Error("No videos found.");
      }
      
      const randomIndex = Math.floor(Math.random() * result.videos.length);
      const randomVideo = result.videos[randomIndex];
      
      setSelectedTravelStyle(values.travelStyle);
      const genResult = await handleGenerateItinerary(randomVideo, values.budget);
      
      if (genResult && genResult.lat && genResult.lng) {
        let activeItinerary = [...genResult.itineraryData.itinerary];
        let hotelAddress: string | undefined;

        // Automatically find a hotel!
        try {
          const hotelResult = await findHotels({ latitude: genResult.lat, longitude: genResult.lng });
          if (hotelResult.hotels && hotelResult.hotels.length > 0) {
            const firstHotel = hotelResult.hotels[0];
            hotelAddress = firstHotel.address;
            if (activeItinerary.length > 0) {
              activeItinerary[0] = {
                ...activeItinerary[0],
                locations: [
                  {
                    name: `Check-in: ${firstHotel.name}`,
                    description: firstHotel.description,
                    address: firstHotel.address,
                    imageUrl: firstHotel.imageUrl,
                    type: "hotel",
                  },
                  ...activeItinerary[0].locations,
                ],
              };
            }
          }
        } catch (hotelError) {
          console.error("Feeling lucky hotel find failed:", hotelError);
        }

        // Automatically find events!
        try {
          const eventResult = await findTrendyEvents({ destination: values.destination, travelStyle: values.travelStyle });
          if (eventResult.events && eventResult.events.length > 0) {
            for (let i = 0; i < Math.min(activeItinerary.length, eventResult.events.length); i++) {
              const event = eventResult.events[i];
              activeItinerary[i] = {
                ...activeItinerary[i],
                locations: [
                  ...activeItinerary[i].locations,
                  {
                    name: `Event: ${event.name}`,
                    description: event.description,
                    address: event.location || "Local Event",
                    imageUrl: null,
                  }
                ],
              };
            }
          }
        } catch (eventError) {
          console.error("Feeling lucky event find failed:", eventError);
        }

        // Recalculate Distances!
        if (hotelAddress) {
          try {
            const destinations: Array<{ address: string }> = [];
            const mapping: Array<{ dayIndex: number, locIndex: number }> = [];

            activeItinerary.forEach((day, dayIndex) => {
              day.locations.forEach((loc, locIndex) => {
                if (dayIndex === 0 && locIndex === 0) return; // Skip hotel itself
                if (loc.address && loc.address !== "Address not available" && loc.address !== "Local Event") {
                  destinations.push({ address: loc.address });
                  mapping.push({ dayIndex, locIndex });
                }
              });
            });

            if (destinations.length > 0) {
              const matrixResult = await calculateDistancesAction(
                [{ address: hotelAddress }],
                destinations
              );

              matrixResult.forEach((item: any) => {
                const map = mapping[item.destinationIndex];
                if (map) {
                  const distanceKm = item.distanceMeters ? (item.distanceMeters / 1000).toFixed(1) : undefined;
                  const durationSecs = item.durationText ? parseInt(item.durationText.replace('s', '')) : 0;
                  const durationMins = Math.round(durationSecs / 60);
                  activeItinerary[map.dayIndex].locations[map.locIndex] = {
                    ...activeItinerary[map.dayIndex].locations[map.locIndex],
                    distanceText: distanceKm ? `${distanceKm} km` : undefined,
                    durationText: durationMins > 0 ? `${durationMins} mins` : undefined,
                    distanceMeters: item.distanceMeters,
                  };
                }
              });

              // Sort daily locations by distance to hotel
              activeItinerary.forEach((day, dayIndex) => {
                 const locations = [...day.locations];
                 if (dayIndex === 0 && locations[0] && (locations[0] as any).type === "hotel") {
                    const hotel = locations[0];
                    const rest = locations.slice(1);
                    rest.sort((a, b) => ((a as any).distanceMeters ?? Infinity) - ((b as any).distanceMeters ?? Infinity));
                    day.locations = [hotel, ...rest];
                 } else {
                    locations.sort((a, b) => ((a as any).distanceMeters ?? Infinity) - ((b as any).distanceMeters ?? Infinity));
                    day.locations = locations;
                 }
              });
            }
          } catch (matrixError) {
            console.error("Feeling lucky matrix failed:", matrixError);
          }
        }

        // Set final state!
        setItineraryResponse(prev => {
          if (!prev) return null;
          return { ...prev, itinerary: activeItinerary };
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Feeling Lucky Failed",
        description: "Failed to find relevant videos or random video selection failed.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleMapLocationSelect = async (place: PointOfInterest) => {
    let targetAddress = place.address;
    
    if (!targetAddress || targetAddress === "Address not available") {
       targetAddress = place.name;
       console.log("handleMapLocationSelect (page): Fallback Name geocoding setup:", targetAddress);
    }

    try {
        const coords = await geocodeAddress(targetAddress);
        setMapData({
            location: {
                name: place.name,
                lat: coords.lat,
                lng: coords.lng,
            },
            place: place,
        });
    } catch (e) {
        console.error(`Could not geocode address for ${place.name}: ${place.address}`, e);
        toast({
            variant: "destructive",
            title: "Could Not Find Location",
            description: `We couldn't find the coordinates for ${place.name} on the map.`,
        });
    }
  }


  const handleGenerateItinerary = async (video: Video, budget?: string) => {
    setIsItineraryLoading(true);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);

    const itineraryInput: GenerateItineraryInput = {
      videoId: video.id,
      videoTitle: video.title,
      destination: lastSearchedDestination || "the destination in the video",
      travelType: selectedTravelStyle || "Standard",
      budget: budget,
    };
    
    // Define banner input after itinerary result is available to use detectedDestination

    try {
      const itineraryResult = await generateItinerary(itineraryInput);
      
      const newItineraryData: ItineraryData = {
        video: {
          id: video.id,
          url: video.url,
          title: itineraryResult.videoTitle || video.title,
          thumbnail: itineraryResult.thumbnailUrl || video.thumbnail,
          description: itineraryResult.videoDescription || video.description,
        },
        itinerary: itineraryResult.itinerary,
        videoSummary: itineraryResult.videoSummary,
        destination: itineraryResult.detectedDestination || itineraryInput.destination,
        isBannerLoading: true,
      };
      setItineraryResponse(newItineraryData);

      // Find the first location with a valid address to show on the map.
      let mapLocationFound = false;
      for (const day of itineraryResult.itinerary) {
        if (mapLocationFound) break;
        for (const location of day.locations) {
          if (location.address && location.address !== "Address not available") {
            handleMapLocationSelect(location as any);
            mapLocationFound = true;
            break;
          }
        }
      }

      if (!mapLocationFound) {
        toast({
            variant: "default",
            title: "Map Information",
            description: "Could not find coordinates for any of the itinerary locations to display on the map.",
          });
      }
      
      setIsItineraryLoading(false);

      try {
        const bannerInput = {
            videoTitle: video.title,
            videoDescription: video.description,
            destination: itineraryResult.detectedDestination || "the destination in the video",
        };
        const bannerResult = await generateItineraryBanner(bannerInput);
        setItineraryResponse(prev => prev ? ({ ...prev, bannerUrl: bannerResult.bannerUrl, isBannerLoading: false }) : null);
      } catch (bannerError) {
        console.error("Banner generation failed:", bannerError);
        setItineraryResponse(prev => prev ? ({ ...prev, bannerUrl: 'https://storage.cloud.google.com/jfk-files/mockbanner.png?authuser=3', bannerAiHint: 'tokyo tower', isBannerLoading: false }) : null);
      }

      return { itineraryData: newItineraryData, lat: itineraryResult.latitude, lng: itineraryResult.longitude };

    } catch (error) {
      console.error(error);
      setIsItineraryLoading(false); 

      const mockItinerary = [
        { day: 1, title: 'Tsukiji Market & Ginza Sushi', locations: [
            { name: 'Tsukiji Outer Market', description: 'Explore a bustling market with the freshest seafood and local street food.', address: '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Sushi Dai', description: 'Experience one of the most famous sushi breakfasts in the world, right near the market.', address: '6 Chome-5-1 Toyosu, Koto City, Tokyo 135-0061, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Ginza Kyubey', description: 'Indulge in a high-end, traditional Edomae sushi dinner in the upscale Ginza district.', address: '8 Chome-7-6 Ginza, Chuo City, Tokyo 104-0061, Japan', imageUrl: 'https://placehold.co/600x400.png' }
        ]},
        { day: 2, title: 'Ramen, Depachika & Shinjuku Noodles', locations: [
            { name: 'Ichiran Ramen', description: 'Enjoy a classic tonkotsu ramen experience in your own private booth.', address: '1 Chome-22-7 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Isetan Depachika', description: 'Discover an underground food paradise with exquisite bentos, sweets, and delicacies.', address: '3 Chome-14-1 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Omoide Yokocho (Piss Alley)', description: 'A nostalgic alleyway packed with tiny yakitori stalls and izakayas, perfect for dinner.', address: '1 Chome-2-8 Nishishinjuku, Shinjuku City, Tokyo 160-0023, Japan', imageUrl: 'https://placehold.co/600x400.png' }
        ]},
        { day: 3, title: 'Asakusa Street Food & Tempura', locations: [
            { name: 'Nakamise-dori Street', description: 'Snack on traditional sweets and savory treats on the path to Senso-ji Temple.', address: '1 Chome Asakusa, Taito City, Tokyo 111-0032, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Asakusa Kagetsudo', description: 'Try the famous jumbo melon-pan (sweet bread) that has been sold here for decades.', address: '2 Chome-7-13 Asakusa, Taito City, Tokyo 111-0032, Japan', imageUrl: 'https://placehold.co/600x400.png' },
            { name: 'Daikokuya Tempura', description: 'A historic restaurant serving a unique style of tempura over rice.', address: '1 Chome-38-10 Asakusa, Taito City, Tokyo 111-0032, Japan', imageUrl: 'https://placehold.co/600x400.png' }
        ]}
      ];
      
      setItineraryResponse({
        video: video,
        itinerary: mockItinerary,
        videoSummary: "This is a sample itinerary for a foodie tour in Tokyo. We couldn't generate one from the selected video, but you can explore the app's features with this mock data!",
        destination: "Tokyo",
        isBannerLoading: false,
        bannerUrl: 'https://storage.cloud.google.com/jfk-files/mockbanner.png?authuser=3',
        bannerAiHint: 'tokyo tower',
      });
      
      toast({
        variant: "destructive",
        title: "Itinerary Generation Failed",
        description: "Displaying a sample itinerary. Please try a different video for a custom plan.",
      });
    }
  };

  const handleFindHotels = async (firstLocation: PointOfInterest) => {
    setIsHotelLoading(true);
    setHotelResponse(null);

    try {
        const coords = await geocodeAddress(firstLocation.address || firstLocation.name);
        const result = await findHotels({ latitude: coords.lat, longitude: coords.lng });
        setHotelResponse(result);
    } catch (error) {
      console.error("Failed to find hotels:", error);
      const mockHotels = {
        hotels: [
          { name: 'Park Hyatt Tokyo', address: '3-7-1-2 Nishi-Shinjuku, Shinjuku-Ku, Tokyo, 163-1055, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'An iconic hotel offering breathtaking panoramic views of the city and Mount Fuji from its upper floors.' },
          { name: 'Aman Tokyo', address: '1-5-6 Otemachi, Chiyoda-ku, Tokyo, 100-0004, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'A serene, luxurious escape with a stunning indoor pool and modern ryokan-inspired design.' },
          { name: 'Hoshinoya Tokyo', address: '1-9-1 Otemachi, Chiyoda-ku, Tokyo, 100-0004, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'A modern luxury ryokan experience in the heart of the city, complete with its own onsen.' },
          { name: 'The Peninsula Tokyo', address: '1-8-1 Yurakucho, Chiyoda-ku, Tokyo, 100-0006, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'Unparalleled luxury and service with a prime location overlooking the Imperial Palace gardens.' },
          { name: 'Mandarin Oriental, Tokyo', address: '2-1-1 Nihonbashi Muromachi, Chuo-ku, Tokyo, 103-8328, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'A five-star hotel known for its sophisticated style and award-winning restaurants.' },
          { name: 'Trunk (Hotel) Yoyogi Park', address: '1-15-2 Tomigaya, Shibuya-ku, Tokyo, 151-0063, Japan', imageUrl: 'https://placehold.co/600x400.png', description: 'A trendy hotel with a focus on local culture, featuring a rooftop pool with views of Yoyogi Park.' }

        ]
      };
      setHotelResponse(mockHotels);
      toast({
        variant: "destructive",
        title: "Hotel Search Failed",
        description: "We couldn't find hotels, so here is a sample list for Tokyo.",
      });
    } finally {
      setIsHotelLoading(false);
    }
  };

  const handleSelectHotel = (hotel: Hotel) => {
    if (!itineraryResponse) {
      toast({
        variant: "destructive",
        title: "No Itinerary",
        description: "Please generate an itinerary before adding a hotel.",
      });
      return;
    }

    // Create the new location object for the hotel
    const hotelLocation: PointOfInterest = {
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      imageUrl: hotel.imageUrl,
      rating: null, 
      userRatingCount: null,
    };

    // Add the hotel to the beginning of the first day's locations
    setItineraryResponse(prev => {
      if (!prev) return null;
      
      const newItinerary = [...prev.itinerary];
      if (newItinerary.length > 0) {
        newItinerary[0] = {
          ...newItinerary[0],
          locations: [hotelLocation, ...newItinerary[0].locations],
        };
      } else {
        // If there's no day 1, create it with the hotel
        newItinerary.push({
          day: 1,
          title: "Your First Day",
          locations: [hotelLocation]
        });
      }

      return {
        ...prev,
        itinerary: newItinerary,
      };
    });

    toast({
      title: "Hotel Added!",
      description: `${hotel.name} has been added as the starting point for Day 1.`,
    });
    
    // Hide the hotel search results
    setHotelResponse(null);
  };


  const handleAddLocationToItinerary = (dayIndex: number, location: any) => {
    setItineraryResponse(prev => {
      if (!prev) return null;
      const updatedItinerary = JSON.parse(JSON.stringify(prev.itinerary));
      if (updatedItinerary[dayIndex]) {
        updatedItinerary[dayIndex].locations.push(location);
      }
      return { ...prev, itinerary: updatedItinerary };
    });
    toast({
      title: "Added to Trip!",
      description: `${location.name} has been added to Day ${dayIndex + 1}.`,
    });
  };

  const handleFindEvents = async (destination: string, videoSummary: string) => {
    setIsEventsLoading(true);
    setEventsResponse(null);
    try {
      const result = await findTrendyEvents({ destination, videoSummary, travelStyle: selectedTravelStyle });
      setEventsResponse(result);
    } catch (error) {
      console.error("Failed to find events:", error);
      const mockEvents = {
        events: [
          { name: 'Tokyo Ramen Show 2025', description: 'The largest outdoor ramen event in Japan, featuring famous shops from across the country. (Oct 2025)', url: 'https://example.com/ramen-show', location: "Komazawa Olympic Park", date: "23 October - 3 November 2025", time: "10:00am - 8:30pm" },
          { name: 'Ginza Sake & Food Festival', description: 'Taste premium sake paired with gourmet bites from Ginza\'s top restaurants. (Oct 2025)', url: 'https://example.com/sake-fest', location: "Ginza Crossing", date: "15-16 November 2025", time: "11:00am - 7:00pm" },
          { name: 'Autumn Truffle Week', description: 'Experience exclusive menus featuring the rare autumn truffle at fine dining establishments. (Oct 2025)', url: 'https://example.com/truffle-week', location: "Various Restaurants in Minato", date: "1-9 November 2025", time: "Varies by restaurant" },
          { name: 'Christmas Market at Hibiya Park', description: 'Enjoy classic German-style Christmas food, hot wine, and festive decorations. (Dec 2025)', url: 'https://example.com/christmas-market', location: "Hibiya Park", date: "12-25 December 2025", time: "4:00pm - 10:00pm" },
          { name: 'World Wagyu Expo', description: 'A massive celebration of Japanese beef, with tasting booths and cooking demonstrations. (Dec 2025)', url: 'https://example.com/wagyu-expo', location: "Tokyo Big Sight", date: "5-7 December 2025", time: "10:00am - 6:00pm" },
          { name: 'Artisanal Mochi Pounding Festival', description: 'Join in the traditional new year preparations and taste freshly made mochi. (Dec 2025)', url: 'https://example.com/mochi-fest', location: "Asakusa Shrine", date: "28 December 2025", time: "11:00am - 2:00pm" },
        ],
        tours: [
            {
              title: "Tokyo: Shinjuku Food Tour (13 Dishes at 4 Local Eateries)",
              location: "Tokyo",
              tags: ["Early booking recommended"],
              description: "This small group tour led by a local guide is a great way to discover hidden local dining spots t...",
              duration: "3 hours",
              reviews: { rating: 4.9, rating_text: "Exceptional", count: 400 },
              features: { free_cancellation: true },
              pricing: { currency: "USD", from_price: 90.00 },
              availability: "Available starting Oct 1"
            },
            {
              title: "Shinjuku Hidden Bar hopping 2 hours tour– 2 Stops, 3 Drinks",
              location: "Tokyo",
              tags: ["Early booking recommended"],
              description: "Unlock the magic of Shinjuku’s nightlife in just two unforgettable hours!! Join a local guide and...",
              duration: "2 hours",
              reviews: { rating: 5.0, rating_text: "Exceptional", count: 1 },
              features: { free_cancellation: true },
              pricing: { currency: "USD", from_price: 104.00 },
              availability: "Available starting Oct 1"
            },
            {
              title: "Tokyo Tsukiji Fish Market Food and Culture Walking Tour",
              location: "Tokyo",
              tags: ["Early booking recommended"],
              description: "Let’s explore Tsukiji, the vibrant market for the locals and the professional chefs for more than...",
              duration: "3 hours",
              reviews: { rating: 4.8, rating_text: "Exceptional", count: 344 },
              features: { free_cancellation: true },
              pricing: { currency: "USD", from_price: 104.00 },
              availability: "Available starting Oct 1"
            },
            {
              title: "Tokyo: Tsukiji Fish Market Food and walking tour",
              location: "Tokyo",
              tags: ["Early booking recommended"],
              description: "Explore the sights and tastes of the Outer Tsukiji Fish Market on a walking tour. Sample a variet...",
              duration: "3 hours",
              reviews: { rating: 4.9, rating_text: "Exceptional", count: 872 },
              features: { free_cancellation: true },
              pricing: { currency: "USD", from_price: 100.00 },
              availability: "Available starting Oct 1"
            }
        ]
      };
      setEventsResponse(mockEvents);
    } finally {
      setIsEventsLoading(false);
    }
  }

  const handleTabChange = (value: string) => {
    if (value === "trip") {
      router.push("/saved-trips");
      return;
    }
    setActiveTab(value);
    setGroundedResponse(null);
    setItineraryResponse(null);
    setHotelResponse(null);
    setEventsResponse(null);
    setMapData(null);
    setIsLoading(false);
    setIsItineraryLoading(false);
    setIsHotelLoading(false);
    setIsEventsLoading(false);
    groundedSearchForm.reset();
    videoSearchForm.reset();
    youtubeVideoSearchForm.reset();
    setYoutubeVideoSearchResults(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full relative bg-cover bg-center" style={{ backgroundImage: "url('https://firebasestorage.googleapis.com/v0/b/simplisite-407n5.firebasestorage.app/o/background2.jpeg?alt=media&token=eb7d43a2-7bf9-42fc-850a-d445e179687f')" }}>
        <div className="absolute inset-0 bg-slate-900/50 z-0"></div>
        <div className="relative z-10">
          <div className="w-full max-w-6xl mx-auto space-y-8 p-4 sm:p-8 md:p-12 lg:p-24">
            <header className="text-center">
              <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-white">
                Find Your Next Travel Experience
              </h1>
              <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
                Use AI to discover destinations or find travel inspiration from YouTube.
              </p>
            </header>

            <Tabs
              defaultValue="search"
              className="w-full max-w-4xl mx-auto"
              onValueChange={handleTabChange}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="search">
                  <Search className="mr-2 h-4 w-4" />
                  Grounded Search
                </TabsTrigger>
                <TabsTrigger value="video">
                  <Youtube className="mr-2 h-4 w-4" />
                  Video & Itinerary
                </TabsTrigger>
                <TabsTrigger value="trip">
                  <Plane className="mr-2 h-4 w-4" />
                  Pre/Post Trip
                </TabsTrigger>
              </TabsList>
              <TabsContent value="search">
                <Card className="w-full shadow-lg bg-background/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground mb-4">
                      Tell us what you're looking for, and we'll suggest
                      destinations, activities, and itineraries grounded in
                      real-time information.
                    </p>
                    <Form {...groundedSearchForm}>
                      <form
                        onSubmit={groundedSearchForm.handleSubmit(
                          onGroundedSearchSubmit
                        )}
                        className="flex items-center gap-4"
                      >
                        <FormField
                          control={groundedSearchForm.control}
                          name="query"
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Input
                                  placeholder="e.g., 'family-friendly beach vacation in Southeast Asia'"
                                  {...field}
                                  className="text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isLoading} size="lg">
                          {isLoading ? (
                            <Loader className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-5 w-5" />
                          )}
                          Search
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="video">
                <Card className="w-full shadow-lg bg-background/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <Tabs defaultValue="search_yt" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="search_yt">Search on YouTube</TabsTrigger>
                        <TabsTrigger value="direct_link">Direct YouTube Link</TabsTrigger>
                      </TabsList>

                      <TabsContent value="search_yt">
                        <Form {...youtubeVideoSearchForm}>
                          <form
                            onSubmit={youtubeVideoSearchForm.handleSubmit(onYoutubeVideoSearchSubmit)}
                            className="flex flex-col sm:flex-row items-center gap-4"
                          >
                            <FormField
                              control={youtubeVideoSearchForm.control}
                              name="destination"
                              render={({ field }) => (
                                <FormItem className="flex-grow w-full">
                                  <FormControl>
                                    <Input placeholder="Destination (e.g. Tokyo)" {...field} className="text-base" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={youtubeVideoSearchForm.control}
                              name="travelStyle"
                              render={({ field }) => (
                                <FormItem className="flex-grow w-full">
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Select Travel Style" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Foodie">Foodie</SelectItem>
                                      <SelectItem value="Family Friendly">Family Friendly</SelectItem>
                                      <SelectItem value="Adventure Seeker">Adventure Seeker</SelectItem>
                                      <SelectItem value="Luxury">Luxury</SelectItem>
                                      <SelectItem value="Budget">Budget / Backpacker</SelectItem>
                                      <SelectItem value="Cultural">Cultural & Historic</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={youtubeVideoSearchForm.control}
                              name="budget"
                              render={({ field }) => (
                                <FormItem className="flex-grow w-full">
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="text-base">
                                        <SelectValue placeholder="Select Budget (Optional)" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Budget">Budget</SelectItem>
                                      <SelectItem value="Mid-range">Mid-range</SelectItem>
                                      <SelectItem value="Luxury">Luxury</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                                <Search className="mr-2 h-5 w-5" />
                                Search
                              </Button>
                              <Button type="button" onClick={handleFeelingLuckySubmit} disabled={isLoading} size="lg" variant="secondary" className="w-full sm:w-auto">
                                <Sparkles className="mr-2 h-5 w-5" />
                                Feeling Lucky
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </TabsContent>

                      <TabsContent value="direct_link">
                        <Form {...videoSearchForm}>
                          <form
                            onSubmit={videoSearchForm.handleSubmit(onVideoSearchSubmit)}
                            className="flex flex-col sm:flex-row items-center gap-4"
                          >
                            <FormField
                              control={videoSearchForm.control}
                              name="youtubeUrl"
                              render={({ field }) => (
                                <FormItem className="flex-grow w-full">
                                  <FormControl>
                                    <Input placeholder="YouTube Video URL" {...field} className="text-base" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                              <Youtube className="mr-2 h-5 w-5" />
                              Generate
                            </Button>
                          </form>
                        </Form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="trip">
                <Card className="w-full shadow-lg bg-background/90 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Access additional tools to help with your trip planning and post-trip activities.
                    </p>
                    <Link href="/saved-trips">
                      <Button size="lg">
                          <Plane className="mr-2 h-5 w-5" />
                          Launch Pre/Post Trip Tool
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl space-y-8 p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
        <div className="flex justify-end w-full items-center gap-2 -mb-6">
          <Button 
            onClick={handleSaveDraft}
            disabled={!itineraryResponse}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-6 py-6 text-lg shadow-lg transition-transform hover:scale-105 flex items-center gap-2 font-bold"
          >
            <Heart className="h-5 w-5" fill="currentColor" /> Save Draft
          </Button>
          <Button 
            onClick={handleBookNow}
            disabled={!itineraryResponse}
            className="bg-[#001C4C] hover:bg-[#002c6c] text-white font-bold rounded-full px-6 py-6 text-lg shadow-lg transition-transform hover:scale-105"
          >
            Book Now
          </Button>
        </div>
        <div className="w-full min-h-[20rem] space-y-8">
          {isLoading || isItineraryLoading ? (
            <LoadingState />
          ) : activeTab === "search" ? (
            groundedResponse ? (
              <ResultsDisplay data={groundedResponse} query={groundedSearchForm.getValues().query} />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full max-w-4xl mx-auto">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Let's plan your next adventure!
                </h2>
              </Card>
            )
          ) : activeTab === "video" ? (
            youtubeVideoSearchResults ? (
              <div className="space-y-8">
                <VideoResultDisplay data={youtubeVideoSearchResults} onGenerateItinerary={handleGenerateItinerary} />
                {itineraryResponse && (
                  <ItineraryDisplay 
                    data={itineraryResponse} 
                    onFindHotels={handleFindHotels}
                    isHotelLoading={isHotelLoading}
                    onFindEvents={handleFindEvents}
                    isEventsLoading={isEventsLoading}
                    onSelectLocation={handleMapLocationSelect}
                    onUpdateItinerary={(updated) => setItineraryResponse(prev => prev ? { ...prev, itinerary: updated } : null)}
                  />
                )}
              </div>
            ) : itineraryResponse ? (
              <ItineraryDisplay 
                data={itineraryResponse} 
                onFindHotels={handleFindHotels}
                isHotelLoading={isHotelLoading}
                onFindEvents={handleFindEvents}
                isEventsLoading={isEventsLoading}
                onSelectLocation={handleMapLocationSelect}
                onUpdateItinerary={(updated) => setItineraryResponse(prev => prev ? { ...prev, itinerary: updated } : null)}
              />
            ) : (
              <Card className="text-center p-12 border-dashed flex items-center justify-center h-full max-w-4xl mx-auto">
                <h2 className="text-xl font-medium text-muted-foreground">
                  Search for videos or enter a direct link to get started.
                </h2>
              </Card>
            )
          ) : activeTab === "trip" ? (
             <Card className="text-center p-12 border-dashed flex items-center justify-center h-full max-w-4xl mx-auto">
                <h2 className="text-xl font-medium text-muted-foreground">
                    Launch the Pre/Post Trip tool to get started.
                </h2>
              </Card>
          ) : null}
          
          {isHotelLoading ? (
            <LoadingState />
          ) : hotelResponse ? (
            <HotelDisplay data={hotelResponse} onSelectHotel={handleSelectHotel} />
          ) : null }

          {isEventsLoading ? <LoadingState /> : eventsResponse ? <EventsDisplay data={eventsResponse} onAddLocationToItinerary={handleAddLocationToItinerary} /> : null}



        </div>
      </div>
    </main>
  );
}

    










    

    

    
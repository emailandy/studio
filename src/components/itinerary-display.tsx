
"use client";

import * as React from "react";
import type { ItineraryData } from "@/app/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Utensils, FerrisWheel, Hotel, Loader, PartyPopper, Eye, Play, Pause } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import type { PointOfInterest } from "@/ai/schemas/grounded-response-schema";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

interface ItineraryDisplayProps {
  data: ItineraryData;
  onFindHotels: (firstLocation: PointOfInterest) => void;
  isHotelLoading: boolean;
  onFindEvents: (destination: string, videoSummary: string) => void;
  isEventsLoading: boolean;
  onSelectLocation: (place: PointOfInterest) => void;
  onUpdateItinerary?: (updatedItinerary: ItineraryData["itinerary"]) => void;
}

const locationIcons: { [key: string]: React.ReactNode } = {
  restaurant: <Utensils className="h-5 w-5 text-accent" />,
  hotel: <Building className="h-5 w-5 text-accent" />,
  landmark: <FerrisWheel className="h-5 w-5 text-accent" />,
  default: <MapPin className="h-5 w-5 text-accent" />,
};

function getIconForLocation(name: string): React.ReactNode {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("restaurant") || lowerName.includes("cafe") || lowerName.includes("food")) {
    return locationIcons.restaurant;
  }
  if (lowerName.includes("hotel") || lowerName.includes("inn") || lowerName.includes("lodging")) {
    return locationIcons.hotel;
  }
  if (lowerName.includes("park") || lowerName.includes("museum") || lowerName.includes("temple") || lowerName.includes("shrine") || lowerName.includes("tower") || lowerName.includes("market")) {
    return locationIcons.landmark;
  }
  return locationIcons.default;
}

function isHotel(name: string): boolean {
    const lowerName = name.toLowerCase();
    return lowerName.includes("hotel") || lowerName.includes("inn") || lowerName.includes("lodging");
}

export function ItineraryDisplay({ 
    data, 
    onFindHotels, 
    isHotelLoading, 
    onFindEvents, 
    isEventsLoading,
    onSelectLocation,
    onUpdateItinerary,
}: ItineraryDisplayProps) {
  const { video, itinerary, bannerUrl, destination, videoSummary, isBannerLoading, bannerAiHint } = data;

  const [draggedLocation, setDraggedLocation] = React.useState<{ dayIndex: number; locationIndex: number } | null>(null);

  const handleDragStart = (dayIndex: number, locationIndex: number) => {
    setDraggedLocation({ dayIndex, locationIndex });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dayIndex: number, locationIndex: number) => {
    if (!draggedLocation || !onUpdateItinerary) return;
    
    const updatedItinerary = JSON.parse(JSON.stringify(itinerary)); // Deep clone
    const sourceDay = updatedItinerary[draggedLocation.dayIndex];
    const targetDay = updatedItinerary[dayIndex];
    
    const [movedLocation] = sourceDay.locations.splice(draggedLocation.locationIndex, 1);
    targetDay.locations.splice(locationIndex, 0, movedLocation);
    
    onUpdateItinerary(updatedItinerary);
    setDraggedLocation(null);
  };

  const handleDeleteLocation = (dayIndex: number, locationIndex: number) => {
    if (!onUpdateItinerary) return;
    const updatedItinerary = JSON.parse(JSON.stringify(itinerary));
    updatedItinerary[dayIndex].locations.splice(locationIndex, 1);
    onUpdateItinerary(updatedItinerary);
  };

  const audioUrl = "https://storage.cloud.google.com/jfk-files/outbound.wav?authuser=3";
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [audioUrl]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleFindHotelsClick = () => {
    const firstLocation = itinerary[0]?.locations[0];
    if (firstLocation) {
        onFindHotels(firstLocation as any);
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="shadow-lg overflow-hidden">
        <div className="relative w-full h-[300px] bg-muted">
          {isBannerLoading && <Skeleton className="w-full h-full" />}
          {bannerUrl && !isBannerLoading && (
            <img
              src={bannerUrl}
              alt="AI-generated itinerary banner"
              className="w-full h-full object-cover"
              data-ai-hint={bannerAiHint || "travel banner"}
            />
          )}
        </div>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="font-headline text-3xl text-primary">Your 3-Day Itinerary for {destination}</CardTitle>
              <CardDescription>
                Inspired by the YouTube video:{" "}
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
                  {video.title}
                </a>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={480}
                  height={360}
                  unoptimized
                  className="rounded-lg object-cover w-full aspect-video transition-transform hover:scale-105"
                  data-ai-hint="youtube thumbnail"
                />
              </a>

            </div>
            <div className="md:col-span-2 space-y-6">
              {itinerary.map((day, dayIndex) => (
                <div key={day.day}>
                  <Badge variant="secondary" className="text-lg py-1 px-4 mb-2">
                    Day {day.day}
                  </Badge>
                  <h3 className="text-2xl font-semibold font-headline text-primary/90">
                    {day.title}
                  </h3>
                  <Separator className="my-2" />
                  <div className="space-y-4">
                    {day.locations.map((location, index) => (
                      <div 
                        key={index} 
                        className={`flex gap-4 items-start p-2 transition-all rounded-lg border border-transparent ${draggedLocation?.dayIndex === dayIndex && draggedLocation?.locationIndex === index ? 'opacity-50 border-dashed border-primary bg-muted/50' : 'hover:bg-muted/10'} cursor-move`}
                        draggable
                        onDragStart={() => handleDragStart(dayIndex, index)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(dayIndex, index)}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getIconForLocation(location.name)}
                        </div>
                        <div className="w-full">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-lg">{location.name}</p>
                            <div className="flex items-center gap-2">

                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteLocation(dayIndex, index)}>
                                    Delete
                                </Button>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{location.description}</p>
                          {location.address && (
                             <div className="text-sm text-gray-500 flex items-center flex-wrap gap-1 mt-1">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {location.address}
                                </div>
                                {(location.distanceText || location.durationText) && (
                                    <Badge variant="outline" className="text-xs py-0 px-2 h-5 bg-accent/10 text-accent border-accent/20">
                                        {location.distanceText && `${location.distanceText}`}
                                        {location.distanceText && location.durationText && " • "}
                                        {location.durationText && `${location.durationText}`}
                                    </Badge>
                                )}
                             </div>
                          )}
                          {isHotel(location.name) && (
                            <div className="mt-4 flex gap-2">
                                <Button onClick={handlePlayAudio} variant="outline" size="sm" disabled={isPlaying}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Early Check-in Agent
                                </Button>
                                <Button onClick={handlePauseAudio} variant="outline" size="sm" disabled={!isPlaying}>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause
                                </Button>
                            </div>
                          )}
                          {location.imageUrl && (
                            <div className="relative h-32 w-full mt-2 rounded-lg overflow-hidden">
                              <Image
                                src={location.imageUrl}
                                alt={location.name}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                data-ai-hint="tourist location"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-6 flex-wrap justify-center gap-8">
            <div className="w-full md:w-auto text-center mx-auto">
                <h3 className="font-headline text-xl text-primary mb-2">Ready to Book?</h3>
                <p className="text-muted-foreground mb-4">Find hotels and places near the recommended itinerary.</p>
                <Button onClick={handleFindHotelsClick} disabled={isHotelLoading}>
                    {isHotelLoading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Hotel className="mr-2 h-4 w-4" />
                    )}
                    Find Hotels Nearby
                </Button>
            </div>
            <div className="w-all md:w-auto text-center mx-auto">
                <h3 className="font-headline text-xl text-primary mb-2">What's Happening?</h3>
                <p className="text-muted-foreground mb-4">Discover trendy, upcoming events at your destination.</p>
                <Button onClick={() => onFindEvents(destination, videoSummary)} disabled={isEventsLoading}>
                    {isEventsLoading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <PartyPopper className="mr-2 h-4 w-4" />
                    )}
                    Find Trendy Events
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}

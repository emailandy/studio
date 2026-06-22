import * as React from "react";
import Image from "next/image";
import { 
  Zap, MapPin, Leaf, Sunset, Clock, Smartphone, 
  GlassWater, ChevronRight, Star, 
  Heart, Share2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { findPlaceIdByName, getPlaceDetails, getPhotoUrlV1 } from "@/services/places-v1";
import { generateHotelDescriptionFlow } from "@/ai/flows/hotel-describer";
import { RoomListClient } from "@/components/room-list-client";

interface PageProps {
  searchParams: Promise<{
    name?: string;
    address?: string;
    query?: string;
  }>;
}

export default async function HotelPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const { name, address, query } = searchParams;
  const hotelName = name || "The Plaza Hotel";
  const hotelAddress = address || "New York City";

  // 1. Find Place ID
  const placeId = await findPlaceIdByName(hotelName, hotelAddress);
  
  let details = null;
  let pageData = null;

  if (placeId) {
    // 2. Get Details (Reviews, Photos, Rating)
    details = await getPlaceDetails(placeId);
    
    if (details) {
      // 3. Generate dynamic content with Gemini
      try {
        pageData = await generateHotelDescriptionFlow({
          name: details.displayName?.text || hotelName,
          address: details.formattedAddress || hotelAddress,
          rating: details.rating,
          reviews: details.reviews?.map(r => r.text?.text).filter(Boolean) as string[] || [],
          query: query,
        });
      } catch (e) {
        console.error("Gemini generation failed, using fallback.", e);
      }
    }
  }

  // Fallback data if API or Gemini fails
  const fallbackData = {
    title: hotelName,
    description: "Experience luxury and comfort in the heart of the city.",
    lifestyleFeatures: [
      { title: "Tech-Forward", description: "Smart lighting and high-speed Wi-Fi." },
      { title: "Eco-Conscious", description: "Sustainable practices and zero plastic." }
    ],
    perks: [
      { title: "Late Checkout", description: "Stay until 2:00 PM." },
      { title: "Welcome Drink", description: "Complimentary beverage." }
    ],
    compellingReason: "Located in the most vibrant part of the city, offering unparalleled service and views.",
    reviewSummaries: [
      "Excellent service and beautiful rooms.",
      "Perfect location for exploring the city."
    ]
  };

  const data = pageData || fallbackData;

  // Resolve Photos
  const apiPhotos = details?.photos?.map(p => getPhotoUrlV1(p.name)).slice(0, 4) || [];
  const fallbackPhotos = [
    "/hotel/hotel_hero_pool.png",
    "/hotel/hotel_lounge_interior.png",
    "/hotel/hotel_pool_fireplace.png",
    "/hotel/hotel_cafe_pastry.png"
  ];
  
  // Use API photos if available, fill in with fallbacks if less than 4
  const photos = [...apiPhotos];
  for (let i = photos.length; i < 4; i++) {
    photos.push(fallbackPhotos[i]);
  }

  const mockRooms = [
    { id: "std", name: "Standard King Studio", size: "320 sqft", sleeps: "Sleeps 2", tags: ["RAIN SHOWER", "CITY VIEW"], price: 289, image: photos[1] || fallbackPhotos[1] },
    { id: "sky", name: "Skyline View Suite", size: "540 sqft", sleeps: "Sleeps 3", tags: ["PRIORITY CHECK-IN", "SPA MINIBAR"], price: 415, image: photos[0] || fallbackPhotos[0], bestValue: true }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Hero Section - Photo Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[500px]">
          <div className="md:col-span-7 relative h-full rounded-2xl overflow-hidden shadow-xl group">
            <Image
              src={photos[0]}
              alt="Hotel hero"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              unoptimized={true}
            />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {details?.rating ? `${details.rating} Rating` : "TOP RATED"}
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-md">
                <Share2 className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-md">
                <Heart className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
          <div className="md:col-span-5 grid grid-rows-2 gap-4 h-full">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-lg group">
              <video
                src="/videos/video_walk.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-lg group">
                <Image
                  src={photos[2]}
                  alt="Hotel view 3"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized={true}
                />
              </div>
              <div className="relative h-full rounded-2xl overflow-hidden shadow-lg group">
                <Image
                  src={photos[3]}
                  alt="Hotel view 4"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  unoptimized={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content & Sidebar Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content (left) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Title & Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                  VERIFIED PROPERTY
                </Badge>
                {details?.rating && details.rating > 4.5 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    GUEST FAVORITE
                  </Badge>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-headline">
                  {data.title}
                </h1>
                <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                  <MapPin className="h-4 w-4 text-slate-500" /> {details?.formattedAddress || hotelAddress}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-900 font-medium">Why we love this place:</p>
                <p className="text-sm text-blue-800 mt-1">{data.compellingReason}</p>
              </div>
            </div>

            {/* Amenities Section */}
            {data.amenities && data.amenities.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 font-headline">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {data.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Designed for your lifestyle */}
            <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100 space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 font-headline">Designed for your lifestyle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.lifestyleFeatures.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusive Perks */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 font-headline">Exclusive Perks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {data.perks.map((item, idx) => (
                  <Card key={idx} className={`rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 border-slate-200'}`}>
                    <CardContent className="p-6 space-y-4 flex flex-col h-full justify-between">
                      <Smartphone className="h-8 w-8" />
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm opacity-90">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Select your room */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 font-headline">Select your room</h2>
              <RoomListClient rooms={mockRooms} />
            </div>

            {/* Reviews */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 font-headline">What's the word?</h2>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold">{details?.rating && details.rating > 4 ? "Excellent" : "Good"}</p>
                    <p className="text-xs text-muted-foreground">RECENT REVIEWS</p>
                  </div>
                  <div className="bg-blue-600 text-white rounded-xl p-3 font-bold text-xl">
                    {details?.rating || "4.5"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.reviewSummaries.map((review, idx) => (
                  <Card key={idx} className="rounded-2xl shadow-sm border-slate-100 p-6 space-y-4 flex flex-col justify-between h-auto">
                    <p className="text-slate-700 italic">"{review}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                        {idx === 0 ? "A" : "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{idx === 0 ? "Verified Traveler" : "Recent Guest"}</span>
                          <span className="text-xs text-blue-600 font-medium">VERIFIED STAY</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{idx === 0 ? "Leisure Trip" : "Couples Stay"}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Booking Widget (right) */}
          <div className="lg:col-span-1 lg:pt-12">
            <div className="sticky top-24 bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-3xl font-bold font-headline">$289</span>
                  <span className="text-sm text-muted-foreground"> / night</span>
                </div>
                <div className="flex items-center text-sm font-semibold text-green-600 gap-1">
                  <span className="h-2 w-2 bg-green-600 rounded-full"></span> Available
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border rounded-xl p-2 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="border-r p-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Check-in</p>
                  <p className="font-medium text-sm">Oct 24, 2026</p>
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold uppercase text-slate-500">Check-out</p>
                  <p className="font-medium text-sm">Oct 26, 2026</p>
                </div>
              </div>

              <div className="border rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Travelers</p>
                  <p className="font-medium text-sm">2 Adults, 0 Children</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl text-lg shadow-md shadow-blue-100">
                Reserve Your Stay
              </Button>
              <p className="text-center text-xs text-muted-foreground">You won't be charged yet</p>

              <div className="space-y-3 pt-4 border-t text-sm">
                <div className="flex justify-between">
                  <span>4 nights × $289</span>
                  <span className="font-medium">$1,156</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Priceline Member Discount</span>
                  <span className="font-medium">-$173</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes & Fees</span>
                  <span className="font-medium">$168</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>$1,151</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl flex gap-3 text-xs text-slate-600 border border-slate-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">Best Price Guarantee</p>
                  <p>Find it cheaper elsewhere? We'll refund the difference.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

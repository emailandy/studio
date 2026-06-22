import type { PointOfInterest } from "@/ai/schemas/grounded-response-schema";
import Image from "next/image";
import { PlaceRating } from "./place-rating";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MobilePlaceCardProps {
  place: PointOfInterest;
}

export function MobilePlaceCard({ place }: MobilePlaceCardProps) {
  const { name, description, imageUrl, rating, userRatingCount } = place;

  return (
    <Card className="h-full flex flex-col bg-white/95 backdrop-blur-md border-none shadow-lg rounded-2xl overflow-hidden text-[11px]">
      {imageUrl && (
        <div className="relative h-20 w-full flex-shrink-0">
          <Image
            src={imageUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            data-ai-hint="tourist location"
            unoptimized={true}
          />
        </div>
      )}
      <CardHeader className="p-2.5 pb-1">
        <CardTitle className="font-headline text-xs font-bold font-sans tracking-tight text-slate-900">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-2.5 pt-0 space-y-1">
        <PlaceRating rating={rating} userRatingCount={userRatingCount} />
        <p className="text-slate-600 leading-snug line-clamp-2">{description}</p>
        
        {/* Operating Hours / Schedule */}
        {(place as any).operatingHours && (
           <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">Schedule:</span>
              <span>Available</span>
           </div>
        )}

         {/* View Details on Google Maps Link */}
         {(place as any).googleMapsURI && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-end">
               <a 
                  href={(place as any).googleMapsURI} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-blue-600 font-semibold hover:underline"
               >
                  View on Google Maps ↗
               </a>
            </div>
         )}
      </CardContent>
    </Card>
  );
}

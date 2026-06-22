
import type { PointOfInterest } from '@/ai/schemas/grounded-response-schema';
import Image from 'next/image';
import { PlaceRating } from './place-rating';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PlaceCardProps {
  place: PointOfInterest;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const { name, description, imageUrl, rating, userRatingCount } = place;

  return (
    <Card className="h-full flex flex-col">
      {imageUrl && (
        <div className="relative h-24 w-full">
          <Image
            src={imageUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, 33vw"
            data-ai-hint="tourist location"
            unoptimized={true}
          />
        </div>
      )}
      <CardHeader className="p-2 pb-1">
        <CardTitle className="font-headline text-xs font-bold tracking-tight">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0 flex-grow space-y-1 text-[11px]">
        <PlaceRating rating={rating} userRatingCount={userRatingCount} />
        <p className="text-muted-foreground leading-snug">{description}</p>
        
        {/* Operating Hours */}
        {(place as any).operatingHours && (
           <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <span className="font-semibold text-slate-700">Schedule:</span>
              <span>Available</span>
           </div>
        )}

        {/* Top 2 Reviews snippet */}
        {(place as any).reviews && (place as any).reviews.length > 0 && (
           <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Reviews</h4>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                 {(place as any).reviews.slice(0, 2).map((review: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-1.5 rounded-lg text-[10px]">
                       <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">{review.author_name}</span>
                          <span className="text-yellow-500 font-bold ml-1">{review.rating}⭐</span>
                       </div>
                       <p className="text-slate-600 line-clamp-2 leading-tight">"{review.text}"</p>
                    </div>
                 ))}
              </div>
           </div>
        )}
         {/* View Details on Google Maps Link */}
         {(place as any).googleMapsURI && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end">
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

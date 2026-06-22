
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceRatingProps {
  rating?: number | null;
  userRatingCount?: number | null;
}

export function PlaceRating({ rating, userRatingCount }: PlaceRatingProps) {
  if (!rating || !userRatingCount) {
    return <div className="text-sm text-muted-foreground">No rating available</div>;
  }

  const roundedRating = Math.round(rating * 10) / 10;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1">
      <span className="font-bold text-xs text-gray-800">{roundedRating}</span>
      <div className="flex items-center">
        {stars.map((star) => (
          <Star
            key={star}
            size={12}
            className={`h-4 w-4 ${
              roundedRating >= star
                ? "text-yellow-400 fill-yellow-400"
                : roundedRating >= star - 0.5
                ? "text-yellow-400 fill-yellow-400 opacity-50"
                : "text-gray-300 fill-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">({userRatingCount})</span>
    </div>
  );
}

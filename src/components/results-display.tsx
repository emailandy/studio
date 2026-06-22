import * as React from 'react';
import type { GenerateGroundedResponseOutput } from '@/ai/schemas/grounded-response-schema';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';


interface ResultsDisplayProps {
  data: GenerateGroundedResponseOutput;
  query: string;
}

export function ResultsDisplay({ data, query }: ResultsDisplayProps) {
  const { pointsOfInterest } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Section for the extracted Points of Interest */}
      {pointsOfInterest && pointsOfInterest.length > 0 && (
        <div>
          <div className="text-center mb-6">
            <h2 className="font-headline text-3xl text-primary">
              Extracted Places of Interest
            </h2>
            <p className="text-muted-foreground">
              Key locations identified in the response, enriched with details
              from Google Maps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pointsOfInterest.map((poi, index) => (
              <Link href={`/hotel?name=${encodeURIComponent(poi.name)}&address=${encodeURIComponent(poi.address)}&query=${encodeURIComponent(query)}`} key={index} className="flex h-full" target="_blank">
                <Card
                  className="shadow-lg overflow-hidden flex flex-col flex-grow hover:shadow-xl transition-shadow cursor-pointer"
                >

                <div className="relative w-full h-48">
                  {poi.imageUrl ? (
                    <Image
                      src={poi.imageUrl}
                      alt={`Photo of ${poi.name}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      data-ai-hint="tourist location"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Building className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-xl">
                    {poi.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {poi.description}
                  </p>
                  <p className="text-sm text-gray-500 flex items-start gap-2 pt-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{poi.address}</span>
                  </p>
                </CardContent>
                </Card>
              </Link>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

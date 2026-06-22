
import type { SearchYoutubeVideosOutput } from "@/ai/schemas/youtube-videos-schema";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Button } from "./ui/button";
import { Route } from "lucide-react";
import type { Video } from "@/lib/types";

interface VideoResultDisplayProps {
  data: SearchYoutubeVideosOutput;
  onGenerateItinerary: (video: Video) => void;
}

export function VideoResultDisplay({ data, onGenerateItinerary }: VideoResultDisplayProps) {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.videos.map((video) => (
          <Card key={video.id} className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors shadow-lg">
            <div>
              <CardHeader className="p-0">
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  <div className="relative aspect-video">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      unoptimized
                      className="rounded-t-lg object-cover"
                    />
                  </div>
                </a>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg leading-tight line-clamp-2">{video.title}</CardTitle>
              </CardContent>
            </div>
            <CardFooter className="p-4 pt-0">
              <Button onClick={() => onGenerateItinerary(video)} className="w-full">
                <Route className="mr-2 h-4 w-4" />
                Generate Itinerary
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

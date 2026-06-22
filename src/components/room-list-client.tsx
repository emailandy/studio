"use client";

import * as React from "react";
import Image from "next/image";
import { Ruler, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Room {
  id: string;
  name: string;
  size: string;
  sleeps: string;
  tags: string[];
  price: number;
  image: string;
  bestValue?: boolean;
}

interface RoomListClientProps {
  rooms: Room[];
}

export function RoomListClient({ rooms }: RoomListClientProps) {
  const [selectedRoom, setSelectedRoom] = React.useState<string | null>(rooms[0]?.id || null);

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Card key={room.id} className={`rounded-2xl shadow-md border overflow-hidden ${room.bestValue ? 'border-primary' : 'border-slate-100'} hover:shadow-lg transition-shadow`}>
          <div className="flex flex-col md:flex-row h-full">
            <div className="relative w-full md:w-1/3 h-48 md:h-auto">
              <Image src={room.image} alt={room.name} fill className="object-cover" />
              {room.bestValue && (
                <div className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded-md">
                  BEST VALUE
                </div>
              )}
            </div>
            <div className="flex-grow p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-headline">{room.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {room.size}</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.sleeps}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {room.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-bold font-headline">${room.price}</span>
                  <span className="text-sm text-muted-foreground"> / night</span>
                </div>
                <Button onClick={() => setSelectedRoom(room.id)} variant={selectedRoom === room.id ? "secondary" : "default"}>
                  {selectedRoom === room.id ? "Selected" : "Select"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

import { ai } from "@/ai/genkit";
import { z } from "zod";

export const computeRouteMatrixFlow = ai.defineFlow(
  {
    name: 'computeRouteMatrixFlow',
    inputSchema: z.object({
      origins: z.array(z.union([
        z.object({ lat: z.number(), lng: z.number() }),
        z.object({ address: z.string() }),
      ])).describe('Array of origin points.'),
      destinations: z.array(z.union([
        z.object({ lat: z.number(), lng: z.number() }),
        z.object({ address: z.string() }),
      ])).describe('Array of destination points.'),
    }),
    outputSchema: z.array(z.object({
      originIndex: z.number().optional(),
      destinationIndex: z.number().optional(),
      distanceMeters: z.number().optional(),
      durationText: z.string().optional(),
      status: z.string().optional(),
    })).describe('An array of elements, each element containing the distance and duration from an origin to a destination.'),
  },
  async (input) => {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
      const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';

      const payload = {
        origins: input.origins.map(origin => {
          if ('lat' in origin) {
            return {
              waypoint: {
                location: { latLng: { latitude: origin.lat, longitude: origin.lng } }
              }
            };
          } else {
            return { waypoint: { address: origin.address } };
          }
        }),
        destinations: input.destinations.map(destination => {
          if ('lat' in destination) {
            return {
              waypoint: {
                location: { latLng: { latitude: destination.lat, longitude: destination.lng } }
              }
            };
          } else {
            return { waypoint: { address: destination.address } };
          }
        }),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      };

      try {
        const fetchResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition',
          },
          body: JSON.stringify(payload),
        });

        if (!fetchResponse.ok) {
          const errText = await fetchResponse.text();
          console.error(`Routes API failure: ${fetchResponse.status} - ${errText}`);
          throw new Error(`Routes API call failed with status ${fetchResponse.status}`);
        }

        const data = await fetchResponse.json();
        
        return data.map((item: any) => ({
          originIndex: item.originIndex,
          destinationIndex: item.destinationIndex,
          distanceMeters: item.distanceMeters,
          durationText: item.duration, // duration comes as "160s" or "361s" from the API
          status: item.condition,
        }));
      } catch (error) {
        console.error("computeRouteMatrix fetch error:", error);
        throw new Error("Failed to compute route matrix.");
      }
  }
);

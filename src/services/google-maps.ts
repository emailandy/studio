
import { Client, PlaceInputType, GeocodeResponse, GeocodeRequest, TextSearchRequest, Place, PlacesNearbyRequest } from "@googlemaps/google-maps-services-js";
import { ai } from "@/ai/genkit";
import { z } from "zod";

const mapsClient = new Client({});

const findPlaceToolSchema = z.object({
  query: z.string().describe('The name or search query of the place.'),
  lat: z.number().optional().describe('Latitude for location biasing.'),
  lng: z.number().optional().describe('Longitude for location biasing.'),
  placeId: z.string().optional().describe('The direct Google Places ID of the place if you already know it.'),
});

export const findPlaceTool = ai.defineTool(
    {
      name: 'findPlace',
      description: 'Finds a place and returns its address, photo, rating, and recent reviews.',
      inputSchema: findPlaceToolSchema,
      outputSchema: z.object({
        address: z.string().optional(),
        imageUrl: z.string().nullable().optional(),
        rating: z.number().nullable().optional(),
        userRatingCount: z.number().nullable().optional(),
        reviews: z.array(z.string()).optional(),
        placeId: z.string().optional(),
      }),
    },
    async (input) => {
      const { query } = input;
  
      try {
        let candidatePlaceId = input.placeId;

        if (!candidatePlaceId) {
          const textSearchParams: any = {
            query: query,
            key: process.env.GOOGLE_MAPS_API_KEY!,
          };

          if (input.lat && input.lng) {
            textSearchParams.location = { lat: input.lat, lng: input.lng };
            textSearchParams.radius = 8046; // 5 miles in meters
          }

          const response = await mapsClient.textSearch({
            params: textSearchParams,
          });

          const candidate = response.data.results?.[0];

          if (!candidate || !candidate.place_id) {
            throw new Error(`No place found for query: "${query}"`);
          }
          candidatePlaceId = candidate.place_id;
        }

        const detailsResponse = await mapsClient.placeDetails({
            params: {
                place_id: candidatePlaceId,
                fields: ['formatted_address', 'name', 'photos', 'rating', 'user_ratings_total', 'reviews'],
                key: process.env.GOOGLE_MAPS_API_KEY!,
            }
        });

        const placeDetails = detailsResponse.data.result;

        if (!placeDetails) {
            throw new Error(`Could not retrieve details for place_id: ${candidate.place_id}`);
        }
  
        let imageUrl = null;
        if (placeDetails.photos && placeDetails.photos.length > 0) {
          const photoReference = placeDetails.photos[0].photo_reference;
          imageUrl = `/api/place-photo?photo_reference=${photoReference}`;
        }

        const reviews = placeDetails.reviews?.map(r => r.text).slice(0, 3) || []; // Get up to 3 reviews
  
        return {
          address: placeDetails.formatted_address,
          imageUrl,
          rating: placeDetails.rating ?? null,
          userRatingCount: placeDetails.user_ratings_total ?? null,
          reviews: reviews,
          placeId: candidatePlaceId,
        };
      } catch (error) {
        console.error(`Google Maps API error for query "${query}":`, error);
        throw new Error(`Failed to retrieve place details from Google Maps for: "${query}"`);
      }
    }
  );

  const geocodeToolSchema = z.object({
    address: z.string().describe("The address to geocode."),
  });
  
  export const geocodeTool = ai.defineTool(
    {
      name: 'geocode',
      description: 'Geocodes a street address into latitude and longitude.',
      inputSchema: geocodeToolSchema,
      outputSchema: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    },
    async (input) => {
      const { address } = input;
      const request: GeocodeRequest = {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      };
  
      try {
        const response: GeocodeResponse = await mapsClient.geocode(request);
        const { lat, lng } = response.data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
      } catch (error) {
        console.error(`Geocoding error for address "${address}":`, error);
        throw new Error(`Failed to geocode address: "${address}"`);
      }
    }
  );
  
  const placeResultSchema = z.object({
    name: z.string(),
    address: z.string(),
    imageUrl: z.string().nullable(),
    placeId: z.string().optional(),
  });

  export const findNearbyPlacesTool = ai.defineTool({
    name: 'findNearbyPlaces',
    description: 'Finds places of a specific type within a radius of a given location.',
    inputSchema: z.object({
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().describe('The search radius in meters.'),
        type: z.string().describe('The type of place to search for (e.g., "lodging", "restaurant").'),
    }),
    outputSchema: z.array(placeResultSchema),
  }, async (input) => {
    const request: PlacesNearbyRequest = {
        params: {
            location: { lat: input.latitude, lng: input.longitude },
            radius: input.radius,
            type: input.type,
            key: process.env.GOOGLE_MAPS_API_KEY!,
        }
    };
    console.log(`[findNearbyPlacesTool] Request params:`, JSON.stringify(request.params));
    try {
        const response = await mapsClient.placesNearby(request);
        console.log(`[findNearbyPlacesTool] Response status: ${response.data.status}, Results count: ${response.data.results?.length || 0}`);
        const places = response.data.results.slice(0, 6).map((place: Place) => {
          let imageUrl = null;
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            imageUrl = `/api/place-photo?photo_reference=${photoReference}`;
          }
          return {
            name: place.name || 'Unknown Place',
            address: place.vicinity || 'Address not available',
            imageUrl,
            placeId: place.place_id,
          };
        });
        return places;
      } catch (error) {
        console.error(`Google Maps Nearby Search error:`, error);
        throw new Error(`Failed to find nearby places.`);
      }
  });

  export const findNearbyHotelsTool = ai.defineTool({
      name: 'findNearbyHotels',
      description: 'Finds hotels near a specified location using a text search.',
      inputSchema: z.object({
        query: z.string().describe('The search query for hotels, e.g., "hotels in Tokyo".'),
      }),
      outputSchema: z.array(placeResultSchema),
    },
    async (input) => {
      const request: TextSearchRequest = {
        params: {
          query: input.query,
          type: 'lodging' as any,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      };
  
      try {
        const response = await mapsClient.textSearch(request);
        const hotels = response.data.results.slice(0, 6).map((place: Place) => {
          let imageUrl = null;
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;
            imageUrl = `/api/place-photo?photo_reference=${photoReference}`;
          }
          return {
            name: place.name || 'Unknown Hotel',
            address: place.formatted_address || 'Address not available',
            imageUrl,
            placeId: place.place_id,
          };
        });
        return hotels;
      } catch (error) {
        console.error(`Google Maps Text Search error for query "${input.query}":`, error);
        throw new Error(`Failed to find nearby hotels for: "${input.query}"`);
      }
    }
  );


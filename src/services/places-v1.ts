import { Client } from "@googlemaps/google-maps-services-js";

const mapsClient = new Client({});

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  return key;
}

interface PlaceDetailsResponse {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  reviews?: Array<{
    text: { text: string };
    rating: number;
  }>;
  rating?: number;
}

/**
 * Find a place's ID using its name and optional address.
 */
export async function findPlaceIdByName(name: string, address?: string): Promise<string | null> {
  const query = address ? `${name}, ${address}` : name;
  const key = getApiKey();
  console.log(`[findPlaceIdByName] Query: "${query}", Key prefix: "${key.substring(0, 5)}..."`);
  
  try {
    const response = await mapsClient.textSearch({
      params: {
        query: query,
        key: key,
      }
    });
    const placeId = response.data.results?.[0]?.place_id || null;
    console.log(`[findPlaceIdByName] Found Place ID: ${placeId}`);
    return placeId;
  } catch (error) {
    console.error('[findPlaceIdByName] Error:', error);
    return null;
  }
}

/**
 * Get place details using its ID.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse | null> {
  const key = getApiKey();
  console.log(`[getPlaceDetails] PlaceID: ${placeId}, Key prefix: "${key.substring(0, 5)}..."`);
  
  try {
    const response = await mapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['formatted_address', 'name', 'photos', 'rating', 'reviews'],
        key: key,
      }
    });

    const result = response.data.result;
    if (!result) {
      console.log(`[getPlaceDetails] No result found for PlaceID: ${placeId}`);
      return null;
    }

    console.log(`[getPlaceDetails] Found result for ${result.name}. Photos count: ${result.photos?.length || 0}`);

    return {
      id: result.place_id,
      displayName: { text: result.name },
      formattedAddress: result.formatted_address,
      photos: result.photos?.map((p: any) => ({
        name: p.photo_reference,
        widthPx: p.width,
        heightPx: p.height,
      })),
      reviews: result.reviews?.map((r: any) => ({
        text: { text: r.text },
        rating: r.rating,
      })),
      rating: result.rating,
    };
  } catch (error) {
    console.error('[getPlaceDetails] Error:', error);
    return null;
  }
}

export function getPhotoUrlV1(photoReference: string, maxHeightPx: number = 600, maxWidthPx: number = 800): string {
  return `/api/place-photo?photo_reference=${photoReference}&maxwidth=${maxWidthPx}&maxheight=${maxHeightPx}`;
}

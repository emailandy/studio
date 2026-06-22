
'use server';

/**
 * @fileOverview A flow that generates a travel itinerary based on a specific YouTube video.
 *
 * This flow takes a YouTube video ID, destination, and travel type,
 * and uses Gemini to create a 3-day itinerary by analyzing the video content directly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { findPlaceTool, geocodeTool } from '@/services/google-maps';
import { getVideoDetails } from '@/services/youtube';
import { GenerateItineraryInputSchema, GenerateItineraryOutputSchema, type GenerateItineraryInput, type GenerateItineraryOutput } from '@/ai/schemas/itinerary-schema';

export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async (input) => {
    const videoUrl = `https://www.youtube.com/watch?v=${input.videoId}`;
    const videoDetails = await getVideoDetails(input.videoId);
    const videoDescription = videoDetails?.description || '';
    let summaryOutput;
    let itineraryOutput;

    // Step 1: Summarize the YouTube video and extract places of interest.
    try {
        summaryOutput = (await ai.generate({
            model: 'googleai/gemini-3.1-flash-lite-preview',
            output: {
                schema: z.object({
                    summary: z.string().describe('A concise summary of the YouTube video.'),
                    placesOfInterest: z.array(z.string()).describe('A list of significant places, landmarks, or establishments mentioned or shown in the video.')
                })
            },
            prompt: [
                {text: `Please summarize the following YouTube video titled "${input.videoTitle}".
                
Description:
"${videoDescription}"

Your summary should be concise and engaging.
Crucially, identify and list all specific places of interest (e.g., landmarks, restaurants, shops, attractions) that are mentioned in the video or its description.
`},
            ],
        })).output;

        if (!summaryOutput || !summaryOutput.summary) {
            throw new Error('Summary output was empty.');
        }
    } catch (error) {
        console.error("Error generating video summary:", error);
        throw new Error('Failed to analyze the YouTube video. It might be private or unavailable.');
    }

    const { summary, placesOfInterest } = summaryOutput;

    // Step 2: Use the summary and extracted places to generate a 3-day itinerary.
    try {
        itineraryOutput = (await ai.generate({
            model: 'googleai/gemini-3.1-flash-lite-preview',
            output: {
                schema: z.object({
                    itinerary: z.array(z.object({
                        day: z.number().describe('The day number (1, 2, or 3).'),
                        title: z.string().describe('A creative title for the day\'s theme (e.g., "Cultural Immersion in Shibuya").'),
                        locations: z.array(z.object({
                          name: z.string().describe('The name of the location.'),
                          description: z.string().describe('A brief description of the location and why it is recommended.'),
                          searchQuery: z.string().optional().describe('A precise search query to find this exact place reliably (e.g. "University of Georgia Arch, Athens, GA").'),
                          placeId: z.string().optional().describe('The Google Places ID of the place if you know it natively.'),
                        })).describe('A list of locations to visit on this day.'),
                      })),
                    detectedDestination: z.string().optional().describe('The primary destination city/region shown in the video.'),
                })
            },
            prompt: [
                {text: `You are a travel expert tasked with creating a 3-day itinerary for a trip strictly to "${input.destination}".

The user's travel style is "${input.travelType}".
The user's budget level is "${input.budget || 'Mid-range'}". Bias your recommendations towards this budget level (e.g., cheaper vs luxury dining and attractions).

Here is a summary of a relevant YouTube video titled "${input.videoTitle}":
"${summary}"

Places of interest explicitly identified from the video: ${placesOfInterest.join(', ')}.

Exact Filtering Rule:
- You must include ONLY places/landmarks/activities that are physically located within "${input.destination}".
- **Rejection (Strict)**: Discard any places located in other cities or regions mentioned in the video (e.g., if the destination is "Athens Georgia", you MUST discard any locations listed in Atlanta or Helen Georgia).
- **Search Context**: For every single location, ensure the 'searchQuery' you generate always explicitly appends the target city name (e.g. "University of Georgia Arch, Athens, GA" instead of just "The Arch"). This is vital for the Maps API to pull the correct photo!

Examples of proper naming:
❌ Bad: Name: "The Arch", Query: "The Arch, Athens, GA" (Finds wedding venues)
✅ Good: Name: "University of Georgia Arch", Query: "University of Georgia Arch, Broad St, Athens, GA 30602"

❌ Bad: Name: "The Varsity", Query: "The Varsity" (Finds locations in Atlanta when you are in Athens)
✅ Good: Name: "The Varsity Athens", Query: "The Varsity, W Broad St, Athens, GA"

Based on this summary and the identified places, suggest major landmarks, restaurants, and activities.
Use ONLY the information derived from the video summary and the listed places of interest. Do NOT recommend anything that is not mentioned or clearly implied from the provided video summary.

For each location, provide only its formal, specific name (e.g., 'University of Georgia Arch' instead of just 'The Arch'). Do NOT include an address or image URL; that will be found later. Ensure each location name refers to a single, distinct place. Do not combine multiple separate places into a single entry (e.g., do not use 'New College and Moore College' if they are distinct buildings).
Present the output as a 3-day plan. Each day should have a creative title and a list of locations. 
Also, identify the primary destination city/region shown in the video and set it as the 'detectedDestination' (e.g., "Athens, Georgia").
`},
            ],
        })).output;

        if (!itineraryOutput || !itineraryOutput.itinerary) {
            throw new Error('Itinerary output was empty.');
        }
    } catch (error) {
        console.error("Error generating itinerary from summary:", error);
        throw new Error('Failed to generate an itinerary from the video content.');
    }




    // Geocode destination to bias place searches
    let destinationLat: number | undefined;
    let destinationLng: number | undefined;
    const targetDestination = itineraryOutput.detectedDestination || input.destination;
    
    try {
        const geocodeResult = await geocodeTool({ address: targetDestination });
        destinationLat = geocodeResult.latitude;
        destinationLng = geocodeResult.longitude;
    } catch (error) {
        console.warn(`Could not geocode destination "${targetDestination}", proceeding without location bias.`);
    }

    // Step 3: For each location in the generated itinerary, use the Places API to find its address and a photo.
    const itineraryWithDetails = await Promise.all(
      itineraryOutput.itinerary.map(async (day) => {
        const locationsWithDetails = await Promise.all(
          day.locations.map(async (location) => {
            try {
              const query = location.searchQuery || ((destinationLat && destinationLng) ? location.name : `${location.name}, ${targetDestination}`);

              const place = await findPlaceTool({ query: query, lat: destinationLat, lng: destinationLng, placeId: location.placeId });
              return {
                ...location,
                address: place.address,
                imageUrl: place.imageUrl,
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                placeId: place.placeId,
              };
            } catch (error) {
              console.warn(`Could not find details for "${location.name}", skipping. Error:`, error);
              // Gracefully handle the error by returning the location without extra details.
              return {
                ...location,
                address: "Address not available",
                imageUrl: null,
                rating: null,
                userRatingCount: null,
              };
            }
          })
        );
        return {
          ...day,
          locations: locationsWithDetails,
        };
      })
    );

    return {
      videoId: input.videoId,
      itinerary: itineraryWithDetails,
      videoSummary: summary,
      thumbnailUrl: videoDetails?.thumbnails?.high?.url || '',
      videoTitle: videoDetails?.title || '',
      videoDescription: videoDetails?.description || '',
      detectedDestination: targetDestination,
      latitude: destinationLat,
      longitude: destinationLng,
    };
  }
);

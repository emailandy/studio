
'use server';

/**
 * @fileOverview A flow that generates a grounded response using Google Maps data.
 *
 * This flow takes a user query and an optional location, gets a grounded response from Gemini
 * using the Google Maps tool, parses that response to identify POIs, and then enriches
 * each POI with details like address and photos from the Google Places API.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateGroundedResponseInputSchema,
  GenerateGroundedResponseOutputSchema,
  type GenerateGroundedResponseOutput,
} from '@/ai/schemas/grounded-response-schema';
import { findPlaceTool } from '@/services/google-maps';
import { z } from 'genkit';

// Input schema specific to this flow, allowing for optional location
const MapsGroundedResponseInputSchema = GenerateGroundedResponseInputSchema.extend({
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
    }).optional(),
});
type MapsGroundedResponseInput = z.infer<typeof MapsGroundedResponseInputSchema>;


export async function generateMapsGroundedResponse(
  input: MapsGroundedResponseInput
): Promise<GenerateGroundedResponseOutput> {
  return generateMapsGroundedResponseFlow(input);
}

// Define the schema for the intermediate parsing step
const PoiParsingSchema = z.object({
  pointsOfInterest: z.array(
    z.object({
      name: z.string().describe('The name of the point of interest.'),
      description: z
        .string()
        .describe(
          'A concise, one or two-sentence description of the location.'
        ),
    })
  ),
});

const generateMapsGroundedResponseFlow = ai.defineFlow(
  {
    name: 'generateMapsGroundedResponseFlow',
    inputSchema: MapsGroundedResponseInputSchema,
    outputSchema: GenerateGroundedResponseOutputSchema,
  },
  async (input) => {
    // If location is provided, append it to the query to make the search location-aware.
    let fullQuery = input.query;
    if (input.location) {
        fullQuery = `${input.query} near ${input.location.latitude}, ${input.location.longitude}`;
    }
    
    // Step 1: Get the initial grounded response from Gemini using the Google Maps tool.
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-3.1-flash-lite',
      prompt: fullQuery,
      config: {
        tools: [{ google_maps: {} }],
      },
    });

    const rawTextResponse = llmResponse.text;
    if (!rawTextResponse) {
      throw new Error('Failed to get a grounded response from the model.');
    }

    // Step 2: Use another LLM call to parse the text into structured JSON.
    const parsedResponse = await ai.generate({
      model: 'vertexai/gemini-3.1-flash-lite',
      prompt: `Parse the following text and extract all the mentioned points of interest (like businesses, landmarks, restaurants, etc.). For each point of interest, provide its name and a brief description.

        Text to parse:
        ---
        ${rawTextResponse}
        ---`,
      output: {
        schema: PoiParsingSchema,
      },
    });

    const parsedPois = parsedResponse.output?.pointsOfInterest;
    if (!parsedPois || parsedPois.length === 0) {
      // If parsing fails, return the raw text to at least show something.
      return {
        llmResponse: rawTextResponse,
        pointsOfInterest: [],
      };
    }

    // Step 3: Enrich each POI with details from the Google Places API.
    const enrichedPois = await Promise.all(
      parsedPois.map(async (poi) => {
        try {
          const placeDetails = await findPlaceTool({
            query: `${poi.name}, in the context of "${input.query}"`,
          });
          return {
            ...poi,
            address: placeDetails.address || 'Address not found',
            imageUrl: placeDetails.imageUrl || null,
          };
        } catch (error) {
          console.warn(`Could not find place details for "${poi.name}":`, error);
          return {
            ...poi,
            address: 'Address not available',
            imageUrl: null,
          };
        }
      })
    );

    return {
      llmResponse: rawTextResponse,
      pointsOfInterest: enrichedPois,
    };
  }
);

'use server';

/**
 * @fileOverview A flow that generates a grounded response and extracts structured Points of Interest (POIs).
 *
 * This flow takes a user query, gets a grounded response from Gemini,
 * parses that response to identify POIs, and then enriches each POI
 * with details like address and photos from the Google Places API.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateGroundedResponseInputSchema,
  GenerateGroundedResponseOutputSchema,
  type GenerateGroundedResponseInput,
  type GenerateGroundedResponseOutput,
} from '@/ai/schemas/grounded-response-schema';
import { findPlaceTool } from '@/services/google-maps';
import { z } from 'genkit';

export async function generateGroundedResponse(
  input: GenerateGroundedResponseInput
): Promise<GenerateGroundedResponseOutput> {
  return generateGroundedResponseFlow(input);
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

const generateGroundedResponseFlow = ai.defineFlow(
  {
    name: 'generateGroundedResponseFlow',
    inputSchema: GenerateGroundedResponseInputSchema,
    outputSchema: GenerateGroundedResponseOutputSchema,
  },
  async (input) => {
    // Step 1: Get the initial grounded response from Gemini.
    // This provides a conversational answer based on Google Search.
    const llmResponse = await ai.generate({
      model: 'vertexai/gemini-3.1-flash-lite',
      prompt: input.query,
      config: {
        thinkingConfig: {
          thinkingLevel: 'LOW',
        },
        tools: [{ google_search: {} }],
      },
    });

    const rawTextResponse = llmResponse.text;
    if (!rawTextResponse) {
      throw new Error('Failed to get a grounded response from the model.');
    }

    // Step 2: Use another LLM call to parse the text into structured JSON.
    // This is more reliable than trying to parse unstructured text manually.
    const parsedResponse = await ai.generate({
      model: 'vertexai/gemini-3.1-flash-lite',
      config: {
        thinkingConfig: {
          thinkingLevel: 'LOW',
        },
      },
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
    // This adds the address and a photo URL to our structured data.
    const enrichedPois = await Promise.all(
      parsedPois.map(async (poi) => {
        try {
          // The `findPlaceTool` is defined in `src/services/google-maps.ts`
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
          // If the lookup fails, we still return the POI without an address.
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

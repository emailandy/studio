'use server';
/**
 * @fileOverview A flow that generates a rich description for a given location,
 * grounded in Google Places API data, including user reviews.
 */

import {ai} from '@/ai/genkit';
import {
    GenerateLocationDescriptionInputSchema,
    GenerateLocationDescriptionOutputSchema,
    type GenerateLocationDescriptionInput,
    type GenerateLocationDescriptionOutput
} from '@/ai/schemas/location-description-schema';
import { findPlaceTool } from '@/services/google-maps';


function cleanLocationName(locationName: string): string {
    // Strip common prefixes
    let cleaned = locationName
      .replace(/^Check-in:\s*/i, '')
      .replace(/^Event:\s*/i, '')
      .trim();

    // Handle concatenated strings with ", Event:" or ", Check-in:"
    if (cleaned.includes(', Event:')) {
         cleaned = cleaned.split(', Event:')[0];
    } else if (cleaned.includes(', Check-in:')) {
         cleaned = cleaned.split(', Check-in:')[0];
    }
    
    return cleaned.trim();
}

export async function generateLocationDescription(
  input: GenerateLocationDescriptionInput
): Promise<GenerateLocationDescriptionOutput> {
  return generateLocationDescriptionFlow(input);
}

const generateLocationDescriptionFlow = ai.defineFlow(
  {
    name: 'generateLocationDescriptionFlow',
    inputSchema: GenerateLocationDescriptionInputSchema,
    outputSchema: GenerateLocationDescriptionOutputSchema,
  },
  async (input) => {
    const cleanedLocation = cleanLocationName(input.locationName);
    let placeDetails: any = { reviews: [] };

    // Step 1: Use the findPlaceTool to get rich details, including reviews.
    try {
      console.log(`[generateLocationDescription] Searching with full query: "${input.locationName}"`);
      placeDetails = await findPlaceTool({ query: input.locationName });
    } catch (error) {
      console.warn(`[generateLocationDescription] Search failed for full query. Retrying with cleaned name: "${cleanedLocation}"`);
      
      if (cleanedLocation !== input.locationName) {
        try {
          placeDetails = await findPlaceTool({ query: cleanedLocation });
        } catch (retryError) {
          console.warn(`[generateLocationDescription] Search failed for cleaned name as well: "${cleanedLocation}". Proceeding with empty reviews.`);
        }
      } else {
         console.warn(`[generateLocationDescription] Cleaned name is identical to full query. Proceeding with empty reviews.`);
      }
    }

    // Step 2: Construct a prompt that uses the reviews to generate a description.
    const reviewsText = placeDetails.reviews && placeDetails.reviews.length > 0
      ? `Here are some recent reviews to give you a sense of the place:\n${placeDetails.reviews.map((r: string) => `- "${r}"`).join('\n')}`
      : "No recent reviews were available.";

    const prompt = `You are a friendly and engaging tour guide.
      Based on the following information and reviews for "${cleanedLocation}", please generate a short, one-paragraph introduction for a tourist.
      Summarize the general sentiment from the reviews and highlight what makes this place special.

      ${reviewsText}

      Your introduction:`;

    // Step 3: Call the LLM to generate the final description.
    const result = await ai.generate({
      model: 'vertexai/gemini-3.1-flash-lite',
      prompt: prompt,
      output: { schema: GenerateLocationDescriptionOutputSchema },
    });

    const output = result.output;
    if (!output) {
      throw new Error('Failed to generate a location description.');
    }
    return output;
  }
);


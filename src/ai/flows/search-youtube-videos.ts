'use server';

/**
 * @fileOverview A flow that searches for travel-related YouTube videos.
 *
 * This flow takes a destination and travel type, and uses the YouTube service
 * to find relevant videos to serve as travel inspiration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchVideos } from '@/services/youtube';
import type { Video } from '@/lib/types';
import { SearchYoutubeVideosInputSchema, SearchYoutubeVideosOutputSchema, type SearchYoutubeVideosInput, type SearchYoutubeVideosOutput } from '@/ai/schemas/youtube-videos-schema';

export async function searchYoutubeVideos(
  input: SearchYoutubeVideosInput
): Promise<SearchYoutubeVideosOutput> {
  return searchYoutubeVideosFlow(input);
}

const searchYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'searchYoutubeVideosFlow',
    inputSchema: SearchYoutubeVideosInputSchema,
    outputSchema: SearchYoutubeVideosOutputSchema,
  },
  async (input) => {
    const aiResponse = await ai.generate({
      model: 'googleai/gemini-3.1-flash-lite-preview',
      prompt: `You are a YouTube search expert. Translate the user's travel request into a highly specific single search query for YouTube to find exact local travel content.
      
      Exact Matching & Exclusion Rules:
      1. Use double quotes around the city/region to prevent generic state/country collision (e.g., "Athens Georgia" or "Athens GA").
      2. Focus strictly on the Travel Style. 
         - If style is "Foodie", prioritize terms like "food tour", "best restaurants", "places to eat".
         - If style is "Adventure", prioritize terms like "hidden gems", "outdoor", "hiking".
      3. **Conflict Exclusion**: Explicitly append negative keywords using - for known collisions. 
         - If searching for a city in the US that shares a name with a foreign city (e.g., Athens Georgia), append "-Greece" to explicitly exclude the country from appearing in fuzzy weights.
      
Destination: ${input.destination}
Travel Style: ${input.travelType}
Budget: ${input.budget || 'Mid-range'}

Output ONLY the query string (e.g., "Athens Georgia" family travel vlog -Greece).`,
    });

    const query = aiResponse.text || `${input.destination} ${input.travelType} ${input.budget || ''} travel guide`;
    const videos = await searchVideos(query);
    
    if (videos.length === 0) {
      throw new Error('Could not find any relevant YouTube videos for your query. Please try a different destination or travel style.');
    }

    return {
      videos,
    };
  }
);

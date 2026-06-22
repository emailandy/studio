'use server';

/**
 * @fileOverview A flow that generates a banner image for a travel itinerary.
 *
 * This flow takes a video title and description, and uses an image generation
 * model to create a visually appealing banner related to the travel content.
 */

import { ai } from '@/ai/genkit';
import { GenerateItineraryBannerInputSchema, GenerateItineraryBannerOutputSchema, type GenerateItineraryBannerInput, type GenerateItineraryBannerOutput } from '@/ai/schemas/itinerary-banner-schema';


export async function generateItineraryBanner(
  input: GenerateItineraryBannerInput
): Promise<GenerateItineraryBannerOutput> {
  return generateItineraryBannerFlow(input);
}

const generateItineraryBannerFlow = ai.defineFlow(
  {
    name: 'generateItineraryBannerFlow',
    inputSchema: GenerateItineraryBannerInputSchema,
    outputSchema: GenerateItineraryBannerOutputSchema,
  },
  async (input) => {
    const prompt = `A cinematic, photorealistic landscape banner for a travel video about "${input.videoTitle}". The image should be a beautiful, wide-angle shot of the main landmark or scenery of ${input.destination}. 8K, hyper-detailed, no people, no text.`;

    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-3.1-flash-image-preview',
        prompt: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      if (media.url) {
        return {
          bannerUrl: media.url,
        };
      }
    } catch (error) {
      console.error('Image generation failed, using fallback banner:', error);
    }

    // Fallback to local static asset
    return {
      bannerUrl: '/images/banner.jpeg',
    };
  }
);

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const HotelDescriberInputSchema = z.object({
  name: z.string(),
  address: z.string(),
  rating: z.number().optional().nullable(),
  reviews: z.array(z.string()).optional(),
  query: z.string().optional(),
});

export const HotelDescriberOutputSchema = z.object({
  title: z.string().describe('The name of the hotel with a secondary tagline (e.g. "The Plaza Hotel - An Icon of NYC Luxury").'),
  description: z.string().describe('A rich, engaging 2-3 sentence overview of the location and vibe.'),
  lifestyleFeatures: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).describe('Derived lifestyle focus points (e.g. "Eco vibe", "Urban heart").'),
  perks: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).describe('Expected perks or visual highlights (e.g. "Late Checkout", "Rooftop view").'),
  compellingReason: z.string().describe('A short paragraph explaining exactly why the traveler should stay here.'),
  reviewSummaries: z.array(z.string()).describe('Top 2-3 summarized short quotes or sentiments from reviews.'),
  amenities: z.array(z.string()).describe('List of key amenities (e.g. "Free WiFi", "Swimming Pool", "Rooftop Bar").'),
});

export type HotelDescriberOutput = z.infer<typeof HotelDescriberOutputSchema>;

export const generateHotelDescriptionFlow = ai.defineFlow(
  {
    name: 'generateHotelDescriptionFlow',
    inputSchema: HotelDescriberInputSchema,
    outputSchema: HotelDescriberOutputSchema,
  },
  async (input) => {
    const prompt = `You are a luxury travel copywriter creating a premium landing page for a hotel or Point of Interest. Using the provided Google Places data, generate a stunning, engaging content structure.

Hotel Details:
- Name: ${input.name}
- Address: ${input.address}
- Rating: ${input.rating ?? 'N/A'}
- Sample Reviews:
${input.reviews?.map((r, i) => `Review ${i + 1}: ${r}`).join('\n') || 'No reviews available.'}

Guidelines:
- Match the premium, visually-rich vibe requested by the user.
- Summarize the sample reviews and Google search results into short 1-2 sentence digestible statements for features and perks.
- Prioritize finding REAL, SPECIFIC exclusive perks from search grounding (e.g., branded spas like Guerlain Spa, Peloton bike access, specific dining concepts, unique architectural highlights). Avoid generic perks like "Late Checkout" or "Rooftop view" unless no specific ones are found after searching.
- Generate derived, smart lifestyle features if none are explicitly listed in data (use place category/location context).
- Create a single very compelling "Reason to Stay" statement (Why we love this place).
- Extract a list of key amenities (at least 6-8) such as Free Wi-Fi, Pool, Restaurant, etc.
${input.query ? `- Personalize the response to focus on attributes matching the user's search: "${input.query}".` : ""}
`;

    let response;
    try {
      response = await ai.generate({
        model: 'vertexai/gemini-3.1-flash-lite',
        prompt: prompt,
        config: {
          tools: [{ google_search: {} }],
        },
        output: {
          schema: HotelDescriberOutputSchema,
        },
      });
    } catch (error) {
      console.warn('Failed to generate hotel description with gemini-3.1-flash-lite grounding, falling back to gemini-3.1-flash-lite with grounding', error);
      response = await ai.generate({
        model: 'vertexai/gemini-3.1-flash-lite',
        prompt: prompt,
        config: {
          tools: [{ google_search: {} }],
        },
        output: {
          schema: HotelDescriberOutputSchema,
        },
      });
    }

    if (!response.output) {
      throw new Error('Failed to generate hotel description content.');
    }

    return response.output;
  }
);

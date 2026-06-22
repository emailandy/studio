import { z } from 'genkit';

// Input schema for finding events
export const FindTrendyEventsInputSchema = z.object({
  destination: z.string().describe('The city or location to search for events.'),
  videoSummary: z.string().optional().describe('An optional summary from a travel video to provide context.'),
  travelStyle: z.string().optional().describe('The selected travel style (e.g., Foodie, Adventure).'),
});

// Schema for a single tour
const TourSchema = z.object({
    title: z.string(),
    location: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
    duration: z.string(),
    reviews: z.object({
        rating: z.number(),
        rating_text: z.string(),
        count: z.number(),
    }),
    features: z.object({
        free_cancellation: z.boolean(),
    }),
    pricing: z.object({
        currency: z.string(),
        from_price: z.number(),
    }),
    availability: z.string(),
});

// Output schema for the list of events
export const FindTrendyEventsOutputSchema = z.object({
  events: z.array(z.object({
      name: z.string().describe("The official name of the event."),
      description: z.string().describe("A concise summary of the event and its appeal to tourists."),
      location: z.string().describe("The venue or location of the event."),
      date: z.string().describe("The date or date range of the event."),
      time: z.string().describe("The time of the event."),
      url: z.string().url().describe("A direct URL to a webpage with more information."),
    }))
    .describe("A list of trendy, upcoming events."),
  tours: z.array(TourSchema).optional().describe("A list of recommended tours and attractions."),
});

// TypeScript types derived from the Zod schemas
export type FindTrendyEventsInput = z.infer<typeof FindTrendyEventsInputSchema>;
export type FindTrendyEventsOutput = z.infer<typeof FindTrendyEventsOutputSchema>;

import { z } from 'zod';

export const GenerateFunFactsInputSchema = z.object({
  locations: z.array(z.object({
    name: z.string(),
    address: z.string().optional(),
  }))
});

export const GenerateFunFactsOutputSchema = z.object({
  facts: z.array(z.object({
    locationName: z.string(),
    funFact: z.string(),
  }))
});

export type GenerateFunFactsInput = z.infer<typeof GenerateFunFactsInputSchema>;
export type GenerateFunFactsOutput = z.infer<typeof GenerateFunFactsOutputSchema>;

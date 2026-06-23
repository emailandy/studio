'use server';
import { ai } from '@/ai/genkit';
import { GenerateFunFactsInputSchema, GenerateFunFactsOutputSchema, type GenerateFunFactsInput, type GenerateFunFactsOutput } from '../schemas/fun-facts-schema';

export async function generateFunFacts(input: GenerateFunFactsInput): Promise<GenerateFunFactsOutput> {
    return generateFunFactsFlow(input);
}

const generateFunFactsFlow = ai.defineFlow(
    {
        name: 'generateFunFactsFlow',
        inputSchema: GenerateFunFactsInputSchema,
        outputSchema: GenerateFunFactsOutputSchema,
    },
    async (input) => {
        const prompt = `You are a friendly engaging travel guide.
        Provide a one-sentence "Fun Fact" for each of the following travel locations to get tourists excited.
        Make it accurate but conversational and catchy.
        
        Locations:
        ${input.locations.map(l => `- ${l.name} (${l.address ?? 'Address unknown'})`).join('\n')}
        `;
        
        const result = await ai.generate({
            model: 'vertexai/gemini-3.1-flash-lite',
            prompt: prompt,
            output: { schema: GenerateFunFactsOutputSchema },
        });
        
        const output = result.output;
        if (!output) {
            throw new Error('Failed to generate fun facts.');
        }
        return output;
    }
);

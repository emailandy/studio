'use server';
import { generateFunFacts } from "@/ai/flows/generate-fun-facts";

export async function generateFunFactsAction(locations: Array<{name: string, address?: string}>) {
    try {
        const result = await generateFunFacts({ locations });
        return result;
    } catch (error) {
        console.error("generateFunFactsAction failed:", error);
        throw error;
    }
}

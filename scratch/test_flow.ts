import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Manually add other variables if needed, or let Genkit pick them up from process.env
import { generateLocationDescription } from '../src/ai/flows/generate-location-description';

async function test() {
    const testStr = "Check-in: BetterЯ03青森橋本208号室 - One-Bedroom Apartment, Event: Tokyo Sakura Cherry Blossom River Cruise";
    console.log("Testing string:", testStr);
    try {
        const result = await generateLocationDescription({ locationName: testStr });
        console.log("Success! Result:");
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error during execution:", error);
    }
}

test();

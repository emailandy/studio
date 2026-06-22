import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

async function listModelsForVersion(apiVersion: string) {
    console.log(`\n--- Listing Models for ${apiVersion} ---`);
    try {
        const genAI = new GoogleGenAI({ apiKey, apiVersion });
        const pager = await genAI.models.list();
        
        console.log("Models:");
        for await (const model of pager) {
             console.log(` - ${model.name} (${model.displayName})`);
        }
    } catch (e) {
        console.error(`Error listing models for ${apiVersion}:`, e);
    }
}

async function run() {
    await listModelsForVersion('v1beta');
    await listModelsForVersion('v1alpha');
}

run();

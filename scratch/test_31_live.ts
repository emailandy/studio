import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

if (!apiKey) {
    console.error("API Key not found in environment.");
    process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 8) + "...");

async function testLive(apiVersion: string, model: string) {
    console.log(`\n--- Testing ${apiVersion} with ${model} ---`);
    return new Promise<boolean>((resolve) => {
        try {
            const genAI = new GoogleGenAI({ apiKey, apiVersion });

            console.log("Connecting to Live API...");
            let resolved = false;

            genAI.live.connect({
                model: model,
                config: {
                    responseModalities: ["AUDIO" as any],
                    systemInstruction: "You are a test bot. Speak short words.",
                    initial_history_in_client_content: true,
                    tools: [
                      {
                        functionDeclarations: [
                          {
                            name: 'sayHello',
                            description: 'Say hello to the user.',
                            parameters: {
                              type: 'OBJECT',
                              properties: {
                                name: { type: 'STRING', description: 'User name' }
                              },
                              required: ['name']
                            }
                          }
                        ]
                      }
                    ]
                },
                callbacks: {
                    onopen: () => {
                        console.log("✅ WebSocket Connected (onopen)!");
                    },
                    onmessage: (message) => {
                        console.log("📩 Message received");
                        if (message.serverContent?.modelTurn) {
                             console.log("🔊 Got audio/text response!");
                             resolved = true;
                             resolve(true);
                        }
                    },
                    onerror: (e: any) => {
                        console.error("❌ Error:", e.message || e);
                        resolve(false);
                    },
                    onclose: (e: any) => {
                        console.log("🔌 Closed:", e?.code, e?.reason);
                        if (!resolved) resolve(false);
                    }
                }
            }).then(session => {
                 console.log("✅ connect() resolved!");
                 // session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Hello!" }] }] });
            }).catch(e => {
                 console.error("❌ Connect promise failed:", e);
                 resolve(false);
            });

            // Timeout for this attempt
            setTimeout(() => {
                if (!resolved) {
                    console.log("Timeout waiting for response.");
                    resolve(false);
                }
            }, 8000);

        } catch (e) {
            console.error("Exception:", e);
            resolve(false);
        }
    });
}

async function runAll() {
    const configs = [
        { apiVersion: 'v1beta', model: 'gemini-3.1-flash-live-preview' },
        { apiVersion: 'v1alpha', model: 'gemini-3.1-flash-live-preview' },
        { apiVersion: 'v1', model: 'gemini-3.1-flash-live-preview' }
    ];

    for (const config of configs) {
        const success = await testLive(config.apiVersion, config.model);
        if (success) {
            console.log(`\n🎉 SUCCESS with ${config.apiVersion} / ${config.model}`);
            break; // Stop on first success to save tokens/time
        }
    }
    console.log("\nTests completed.");
    process.exit(0);
}

runAll();

import { generateGroundedResponse } from '../src/ai/flows/generate-grounded-response';

async function main() {
  try {
    const res = await generateGroundedResponse({ query: "What are the best hotels in Paris?" });
    console.log(res);
  } catch (e) {
    console.error("ERROR CAUGHT:");
    console.error(e);
  }
}
main();

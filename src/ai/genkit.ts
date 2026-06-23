
import {genkit} from 'genkit';
import {vertexAI} from '@genkit-ai/vertexai';

export const ai = genkit({
  plugins: [vertexAI({ project: 'bcomtravel', location: 'us-central1' })],
  model: 'vertexai/gemini-3.1-flash-live-preview',
});

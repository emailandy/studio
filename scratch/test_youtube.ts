import { searchVideos } from '../src/services/youtube';

async function main() {
  try {
    const query = 'Japan travel guide';
    console.log(`Searching for: ${query}`);
    const results = await searchVideos(query);
    console.log('Results count:', results.length);
    console.log('First result:', results[0]);
  } catch (e: any) {
    console.error('Stack trace error:', e.stack || e);
  }
}

main();

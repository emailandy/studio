import type { Video } from '@/lib/types';

let youtube: any = null;

export async function searchVideos(query: string): Promise<Video[]> {
  if (!youtube) {
    const { google } = await import('googleapis');
    youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  const response = await youtube.search.list({
    part: ['snippet'],
    q: query,
    type: ['video'],
    maxResults: 25,
  });

  if (!response.data.items) {
    return [];
  }

  // Extract exact phrase from query inside quotes triggers continuous setup anchored spaced.
  const exactMatchPhrase = query.match(/"([^"]+)"/)?.[1]?.toLowerCase();

  const videos: Video[] = response.data.items.map((item) => ({
    id: item.id!.videoId!,
    url: `https://www.youtube.com/watch?v=${item.id!.videoId!}`,
    title: item.snippet!.title!,
    thumbnail: item.snippet!.thumbnails!.high!.url!,
    description: item.snippet!.description!,
  }));

  // Force location strict match bounding buffers with state abbreviation and normalization support setups trigger configs spaced Pace configs spaced pacing spaced configs spacing configurations
  if (exactMatchPhrase) {
    console.log("Applying location safeguard filter for:", exactMatchPhrase);
    
    const stateAbbreviations: Record<string, string> = {
      "alabama": "al", "alaska": "ak", "arizona": "az", "arkansas": "ar", "california": "ca",
      "colorado": "co", "connecticut": "ct", "delaware": "de", "florida": "fl", "georgia": "ga",
      "hawaii": "hi", "idaho": "id", "illinois": "il", "indiana": "in", "iowa": "ia",
      "kansas": "ks", "kentucky": "ky", "louisiana": "la", "maine": "me", "maryland": "md",
      "massachusetts": "ma", "michigan": "mi", "minnesota": "mn", "mississippi": "ms", "missouri": "mo",
      "montana": "mt", "nebraska": "ne", "nevada": "nv", "new hampshire": "nh", "new jersey": "nj",
      "new mexico": "nm", "new york": "ny", "north carolina": "nc", "north dakota": "nd", "ohio": "oh",
      "oklahoma": "ok", "oregon": "or", "pennsylvania": "pa", "rhode island": "ri", "south carolina": "sc",
      "south dakota": "sd", "tennessee": "tn", "texas": "tx", "utah": "ut", "vermont": "vt",
      "virginia": "va", "washington": "wa", "west virginia": "wv", "wisconsin": "wi", "wyoming": "wy"
    };

    let aliasPhrase = exactMatchPhrase;
    for (const [fullName, abbr] of Object.entries(stateAbbreviations)) {
       if (exactMatchPhrase.includes(fullName)) {
           aliasPhrase = exactMatchPhrase.replace(fullName, abbr);
           break;
       }
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();

    const words = exactMatchPhrase.split(/\s+/).map(w => normalize(w)).filter(w => w.length > 0);
    const aliasWords = aliasPhrase.split(/\s+/).map(w => normalize(w)).filter(w => w.length > 0);

    return videos.filter((item) => {
      const normTitle = normalize(item.title);
      const normDesc = normalize(item.description);
      
      // Verify that EVERY single word from exactMatchPhrase is present inside Title OR Description setups configuration setups
      const matchPrimary = words.every(w => normTitle.includes(w) || normDesc.includes(w));
      const matchAlias = aliasWords.every(w => normTitle.includes(w) || normDesc.includes(w));
      
      return matchPrimary || matchAlias;
    });
  }

  return videos;
}

export async function getVideoDetails(videoId: string) {
  if (!youtube) {
    const { google } = await import('googleapis');
    youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  const response = await youtube.videos.list({
    part: ['snippet'],
    id: [videoId],
  });

  return response.data.items?.[0]?.snippet;
}

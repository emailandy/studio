/**
 * @fileOverview Schemas for the YouTube video search flow.
 */

import { z } from 'genkit';

export const SearchYoutubeVideosInputSchema = z.object({
  destination: z.string().describe('The travel destination (e.g., "Tokyo").'),
  travelType: z.string().describe('The style of travel (e.g., "Foodie", "Adventure Seeker").'),
  budget: z.string().optional().describe('Budget level (Budget, Mid-range, Luxury)'),
});
export type SearchYoutubeVideosInput = z.infer<typeof SearchYoutubeVideosInputSchema>;

const VideoSchema = z.object({
    id: z.string(),
    url: z.string(),
    title: z.string(),
    thumbnail: z.string(),
    description: z.string(),
});

export const SearchYoutubeVideosOutputSchema = z.object({
  videos: z.array(VideoSchema).describe('A list of relevant YouTube videos.'),
});
export type SearchYoutubeVideosOutput = z.infer<typeof SearchYoutubeVideosOutputSchema>;

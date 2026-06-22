
/**
 * @fileOverview Schemas for the travel itinerary generation flow.
 */

import { z } from 'genkit';

export const GenerateItineraryInputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to use as a source.'),
  videoTitle: z.string().describe('The title of the YouTube video.'),
  destination: z.string().describe('The travel destination (e.g., "Tokyo").'),
  travelType: z.string().describe('The style of travel (e.g., "Foodie", "Adventure Seeker").'),
  budget: z.string().optional().describe('Budget level (Budget, Mid-range, Luxury)'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

export const LocationSchema = z.object({
  name: z.string().describe('The name of the location.'),
  description: z.string().describe('A brief description of the location and why it is recommended.'),
  searchQuery: z.string().optional().describe('A precise search query to find this exact place reliably (e.g. "University of Georgia Arch, Athens, GA").'),
});

export const ItineraryDaySchema = z.object({
  day: z.number().describe('The day number (1, 2, or 3).'),
  title: z.string().describe('A creative title for the day\'s theme (e.g., "Cultural Immersion in Shibuya").'),
  locations: z.array(LocationSchema).describe('A list of locations to visit on this day.'),
});

const LocationWithDetailsSchema = LocationSchema.extend({
  address: z.string().optional().describe('The full physical address of the location, if available.'),
  placeId: z.string().optional().describe('The Google Places ID of the location.'),
  imageUrl: z.string().nullable().optional().describe("A URL to a photo of the location from the Google Places API."),
  rating: z.number().nullable().optional().describe('The rating of the place, from 1 to 5.'),
  userRatingCount: z.number().nullable().optional().describe('The total number of ratings.'),
  distanceText: z.string().optional().describe('Distance from the hotel (e.g., "2.3 km").'),
  durationText: z.string().optional().describe('Travel time from the hotel (e.g., "15 mins").'),
  distanceMeters: z.number().optional().describe('Numerical distance from the hotel in meters.'),
});

const ItineraryDayWithDetailsSchema = ItineraryDaySchema.extend({
    locations: z.array(LocationWithDetailsSchema)
});

export const GenerateItineraryOutputSchema = z.object({
  videoId: z.string().describe('The ID of the YouTube video to use as a source.'),
  itinerary: z.array(ItineraryDayWithDetailsSchema).describe('The 3-day itinerary.'),
  videoSummary: z.string().describe('A concise summary of the YouTube video used as a source.'),
  thumbnailUrl: z.string().optional().describe('The URL of the high-res thumbnail.'),
  videoTitle: z.string().optional().describe('The title of the video.'),
  videoDescription: z.string().optional().describe('The description of the video.'),
  detectedDestination: z.string().optional().describe('The primary destination city/region detected from the video content.'),
  latitude: z.number().optional().describe('The latitude of the destination city (for hotel search).'),
  longitude: z.number().optional().describe('The longitude of the destination city (for hotel search).'),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;

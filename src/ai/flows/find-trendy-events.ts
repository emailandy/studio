
'use server';

/**
 * @fileOverview A flow that finds trendy, upcoming events for a given destination.
 * This flow returns a mock list of events and does not use live search data.
 */

import { ai } from '@/ai/genkit';
import { FindTrendyEventsInputSchema, FindTrendyEventsOutputSchema, type FindTrendyEventsInput, type FindTrendyEventsOutput } from '@/ai/schemas/event-schema';

export async function findTrendyEvents(input: FindTrendyEventsInput): Promise<FindTrendyEventsOutput> {
  return findTrendyEventsFlow(input);
}

const tokyoMockData: FindTrendyEventsOutput = {
    events: [
      { 
          name: 'Tokyo Ramen Festa 2025', 
          description: `The largest outdoor ramen event in Japan, featuring famous shops from across the country.`,
          location: "Komazawa Olympic Park",
          date: "23 October - 3 November 2025",
          time: "10:00am - 8:30pm",
          url: 'https://example.com/ramen-show' 
      },
      { 
          name: 'Ginza Sake & Food Festival', 
          description: 'Taste premium sake paired with gourmet bites from Ginza\'s top restaurants.',
          location: "Ginza Crossing",
          date: "15-16 November 2025",
          time: "11:00am - 7:00pm",
          url: 'https://example.com/sake-fest'
      },
      { 
          name: 'Autumn Truffle Week', 
          description: 'Experience exclusive menus featuring the rare autumn truffle at fine dining establishments.', 
          location: "Various Restaurants in Minato",
          date: "1-9 November 2025",
          time: "Varies by restaurant",
          url: 'https://example.com/truffle-week'
      },
      { 
          name: 'Christmas Market at Hibiya Park', 
          description: 'Enjoy classic German-style Christmas food, hot wine, and festive decorations.',
          location: "Hibiya Park",
          date: "12-25 December 2025",
          time: "4:00pm - 10:00pm",
          url: 'https://example.com/christmas-market'
      },
      { 
          name: 'World Wagyu Expo', 
          description: 'A massive celebration of Japanese beef, with tasting booths and cooking demonstrations.', 
          location: "Tokyo Big Sight",
          date: "5-7 December 2025",
          time: "10:00am - 6:00pm",
          url: 'https://example.com/wagyu-expo' 
      },
      { 
          name: 'Artisanal Mochi Pounding Festival', 
          description: 'Join in the traditional new year preparations and taste freshly made mochi.',
          location: "Asakusa Shrine",
          date: "28 December 2025",
          time: "11:00am - 2:00pm",
          url: 'https://example.com/mochi-fest' 
      },
    ],
    tours: [
      {
        title: "Tokyo: Shinjuku Food Tour (13 Dishes at 4 Local Eateries)",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "This small group tour led by a local guide is a great way to discover hidden local dining spots...",
        duration: "3 hours",
        reviews: { rating: 4.9, rating_text: "Exceptional", count: 400 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 90.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Shinjuku Hidden Bar hopping 2 hours tour– 2 Stops, 3 Drinks",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Unlock the magic of Shinjuku’s nightlife in just two unforgettable hours!! Join a local guide and...",
        duration: "2 hours",
        reviews: { rating: 5.0, rating_text: "Exceptional", count: 1 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 104.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Tokyo Tsukiji Fish Market Food and Culture Walking Tour",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Let’s explore Tsukiji, the vibrant market for the locals and the professional chefs for more than...",
        duration: "3 hours",
        reviews: { rating: 4.8, rating_text: "Exceptional", count: 344 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 104.00 },
        availability: "Available starting Oct 1"
      },
      {
        title: "Tokyo: Tsukiji Fish Market Food and Walking tour",
        location: "Tokyo",
        tags: ["Early booking recommended"],
        description: "Explore the sights and tastes of the Outer Tsukiji Fish Market on a walking tour. Sample a variet...",
        duration: "3 hours",
        reviews: { rating: 4.9, rating_text: "Exceptional", count: 872 },
        features: { free_cancellation: true },
        pricing: { currency: "USD", from_price: 100.00 },
        availability: "Available starting Oct 1"
      }
    ]
};

const newYorkMockData: FindTrendyEventsOutput = {
    events: [
        {
            name: "New York Comic Con",
            description: "East Coast's biggest pop-culture convention with panels, autograph sessions, and exhibitors.",
            location: "Javits Center, Hudson Yards",
            date: "October 9-12, 2025",
            time: "10:00am - 7:00pm",
            url: "https://example.com/nycc"
        },
        {
            name: "Open House New York Weekend",
            description: "A cultural festival where hundreds of normally closed sites open to the public for free tours.",
            location: "Citywide",
            date: "October 18-19, 2025",
            time: "Varies by location",
            url: "https://example.com/ohny"
        },
        {
            name: "Diwali Motorcade",
            description: "A cultural festival with floats, fireworks, and Bollywood beats to celebrate Diwali in 'Little Guyana'.",
            location: "Liberty Avenue, Richmond Hill, Queens",
            date: "October 21, 2025",
            time: "Starts at dusk",
            url: "https://example.com/diwali-motorcade"
        },
        {
            name: "Village Halloween Parade",
            description: "An iconic parade with colorful costumes, live performances, and music.",
            location: "Sixth Avenue, Greenwich Village",
            date: "October 31, 2025",
            time: "7:00pm - 11:00pm",
            url: "https://example.com/halloween-parade"
        },
        {
            name: "Night Skating at Rockefeller Center",
            description: "Enjoy ice skating at the iconic Rockefeller Center rink, which opens for the season in October.",
            location: "Rockefeller Center",
            date: "Opens October 25, 2025",
            time: "Varies",
            url: "https://example.com/rockefeller-skating"
        },
        {
            name: "Hudson River Foliage Cruise",
            description: "A scenic boat cruise on the Hudson River to enjoy the beautiful fall foliage.",
            location: "Hudson River",
            date: "Weekends through October 27, 2025",
            time: "Varies",
            url: "https://example.com/foliage-cruise"
        }
    ],
    tours: [
        {
          title: "Empire State Building Admission",
          location: "New York",
          tags: [],
          description: "Tickets to experience one of the the most famous buildings in the world",
          duration: "45 minutes - 1 hour 30 minutes",
          reviews: { rating: 4.4, rating_text: "Excellent", count: 1623 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 50.00 },
          availability: "Available starting Oct 1"
        },
        {
          title: "Admission to The Museum of Modern Art",
          location: "New York",
          tags: [],
          description: "A ticket to explore the museum of contemporary and modern art",
          duration: "24 hours",
          reviews: { rating: 4.6, rating_text: "Excellent", count: 928 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 30.00 },
          availability: "Available starting Oct 1"
        },
        {
          title: "Top of the Rock Admission",
          location: "New York",
          tags: [],
          description: "A ticket providing admission to the observation deck of the Rockefeller Center",
          duration: "1 hour",
          reviews: { rating: 4.5, rating_text: "Excellent", count: 652 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 41.16 },
          availability: "Available starting Oct 1"
        },
        {
          title: "Starship 90 Min New York City Statue of Liberty, Bridges, Skyline",
          location: "New York",
          tags: [],
          description: "Explore NYC's iconic landmarks and soak in breathtaking views of the city in just 90 minutes!",
          duration: "1 hour 30 minutes",
          reviews: { rating: 4.7, rating_text: "Exceptional", count: 1338 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 35.00 },
          availability: "Available starting Oct 1"
        },
        {
          title: "New York CityPASS",
          location: "New York",
          tags: [],
          description: "A sightseeing pass to explore Big Apple attractions at your own pace across nine days",
          duration: "",
          reviews: { rating: 4.5, rating_text: "Excellent", count: 448 },
          features: { free_cancellation: false },
          pricing: { currency: "USD", from_price: 154.00 },
          availability: "Available starting Oct 1"
        },
        {
          title: "One World Observatory Standard Admission",
          location: "New York",
          tags: [],
          description: "A visit to the One World Observatory at New York's Freedom Tower",
          duration: "",
          reviews: { rating: 4.7, rating_text: "Exceptional", count: 846 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 42.00 },
          availability: "Available starting Oct 1"
        },
        {
          title: "Guided Borough Sightseeing Tour",
          location: "New York",
          tags: ["Early booking recommended"],
          description: "A chance to discover four boroughs in New York City, as well as a variety of landmarks and attractions",
          duration: "7 hours",
          reviews: { rating: 4.4, rating_text: "Excellent", count: 7 },
          features: { free_cancellation: true },
          pricing: { currency: "USD", from_price: 76.00 },
          availability: "Available starting Oct 1"
        }
    ]
};


const findTrendyEventsFlow = ai.defineFlow(
  {
    name: 'findTrendyEventsFlow',
    inputSchema: FindTrendyEventsInputSchema,
    outputSchema: FindTrendyEventsOutputSchema,
  },
  async (input) => {
    const today = new Date().toLocaleDateString('en-US');
    const twoWeeksOut = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US');
    const travelStyle = input.travelStyle || 'Standard';

    try {
        const llmResponse = await ai.generate({
          model: 'googleai/gemini-3.1-flash-lite-preview',
          output: {
            schema: FindTrendyEventsOutputSchema,
          },
          prompt: `You are a travel assistant. Find real, upcoming local events in ${input.destination} happening between ${today} and ${twoWeeksOut}.
            Focus on events that appeal to a "${travelStyle}" travel style.
            
            Use Google Search to find live, current information.
            
            For each event, provide its name, a concise description, its venue/location, date, time, and a real URL.
            `,
        });

        if (!llmResponse.output) {
            throw new Error('Failed to output valid event data.');
        }

        return llmResponse.output as FindTrendyEventsOutput;
    } catch (error) {
        console.error("Failed to fetch live events with search grounding:", error);
        if (input.destination.toLowerCase().includes('tokyo')) {
            return tokyoMockData;
        }
        return newYorkMockData;
    }
  }
);

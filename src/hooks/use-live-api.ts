'use client';

import { useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Session as LiveSession, Part } from '@google/genai/web';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext, base64ToArrayBuffer } from '@/lib/utils';
import type { ItineraryData } from '@/app/page';
import { useLiveStore } from '@/store/live-store';
import { generateLocationDescription } from '@/ai/flows/generate-location-description';
import { AudioRecorder } from '@/utils/audio-recorder';
import { searchPlace, searchNearbyPlaces, geocodeAddress } from '@/utils/geocoding';

export function useLiveAPI() {
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  // Get state and actions from the Zustand store
  const {
    session,
    micActive,
    cameraActive,
    isSpeaking,
    itineraryData,
    tourIndex,
    setSession,
    setConnected,
    setStream,
    stream,
    setError,
    connected,
    setText,
    appendText,
    setIsListening,
    setIsSpeaking,
    setVolume,
    startTour,
    setTourIndex,
    reset,
  } = useLiveStore();
  
  const isListening = micActive && !isSpeaking;

  const getTourPrompt = useCallback(async (index: number, data: ItineraryData): Promise<string | null> => {
    const allLocations = data.itinerary.flatMap(day => day.locations);
    
    if (index >= allLocations.length) {
      return "That's the end of the itinerary! Would you like me to find hotels or trendy events for this destination?";
    }
    
    const location = allLocations[index];
    
    const locationDescription = location.description;
    if (index === 0) {
        // Create a summary of the 3-day itinerary
        const itinerarySummary = data.itinerary.map(day => 
            `Day ${day.day}, themed "${day.title}", will take you to locations like ${day.locations.map(l => l.name).join(', ')}.`
        ).join(' ');

        return `Welcome back, Andy, and thank you for being a genius level 1 customer! We understand your travel preferences and have tailored these recommendations. I'm your expert tour guide for ${data.destination}. Here's a quick look at your 3-day plan: ${itinerarySummary} Now, let's start our tour. Our first stop is ${location.name}. ${locationDescription}. Let me know when you're ready for the next stop.`;
    }
    return `Next up is ${location.name}. ${locationDescription}. What's next on your mind?`;
  }, []);

  const processUserCommand = useCallback(async (command: string) => {
    const lowerCaseCommand = command.toLowerCase();
    if (lowerCaseCommand.includes('next') || lowerCaseCommand.includes('continue')) {
      const nextIndex = tourIndex + 1;
      if (itineraryData) {
        const prompt = await getTourPrompt(nextIndex, itineraryData);
        if (prompt && session) {
          setTourIndex(nextIndex);
          setText(''); // Clear previous response
          session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: prompt }] }] });
        }
      }
    } else if (session) {
      session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: command }] }] });
    }
  }, [tourIndex, itineraryData, getTourPrompt, session, setTourIndex, setText]);
  
  const streamFromStore = useLiveStore((state) => state.stream);

  const connect = useCallback(async (data?: ItineraryData) => {
    if (session) return;

    let lat = 0;
    let lng = 0;

    setError(null);

    setText('');

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      setError("API key is not configured.");
      return;
    }

    try {
      if (!audioStreamerRef.current) {
        const audioCtx = await audioContext({ id: "audio-out", config: { sampleRate: 24000 } });
        const streamer = new AudioStreamer(audioCtx);
        streamer.onStart = () => setIsSpeaking(true);
        streamer.onComplete = () => {
          setIsSpeaking(false);
        };
        audioStreamerRef.current = streamer;
      }
      if (audioStreamerRef.current.context.state === 'suspended') {
        await audioStreamerRef.current.resume();
      }

      const userMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      userMediaStream.getAudioTracks().forEach(track => {
        track.enabled = micActive;
      });
      userMediaStream.getVideoTracks().forEach(track => {
        track.enabled = cameraActive;
      });
      setStream(userMediaStream);
      

      let initialContent: Part[] | undefined = undefined;
      let systemPromptContent: any = undefined;
      if (data) {
        startTour(data);
        const welcomePrompt = await getTourPrompt(0, data);
        if (welcomePrompt) {
          const firstLocation = data.itinerary[0]?.locations[0];
          const firstAddress = firstLocation?.address || firstLocation?.name || data.destination;

          try {
             const coords = await geocodeAddress(firstAddress);
             lat = coords.lat;
             lng = coords.lng;
             console.log(`[use-live-api] Geocoded starting address: ${firstAddress} to Lat: ${lat}, Lng: ${lng}`);
          } catch (e) {
             console.warn(`[use-live-api] Failed to geocode starting address: ${firstAddress}. Trying destination city fallback.`, e);
             try {
                const cityCoords = await geocodeAddress(data.destination);
                lat = cityCoords.lat;
                lng = cityCoords.lng;
                console.log(`[use-live-api] Geocoded destination city fallback: ${data.destination} to Lat: ${lat}, Lng: ${lng}`);
             } catch (cityError) {
                console.warn(`[use-live-api] Failed to geocode destination city fallback: ${data.destination}`, cityError);
             }
          }

          const systemPrompt = `You are a friendly and expert tour guide for a user named Andy. Your goal is to lead him on a virtual tour of his upcoming trip to ${data.destination}. You have access to tools to control the 3D map to answer any questions about the location, weather, or current events.
          
1. If he says "next" or "continue", call "goToNextLocation".
2. Whenever you discuss a specific tourist attraction or point of interest from the itinerary (e.g., the first stop, lunch spot, museums), you MUST call "viewOnMap" passing the name of the attraction. Do this IMMEDIATELY as you start talking about it so the map syncs with your voice.
3. For each day of the itinerary, check if there is a restaurant or dining option mentioned. If a day is missing a dining stop, ASK the user if they want you to add a recommendation. DO NOT call "addPoiToItinerary" until they explicitly approve it! Use the "searchNearbyPlaces" tool to find places within 3 miles. Use your internal knowledge only if the tool returns no results, but still obey the 3-mile limit.
4. For each day of the itinerary, check the weather. If it is raining (or likely to rain) and there is an outdoor activity planned, recommend swapping that location point or activity for an indoor alternative. Explain to the user why you are making the recommendation.

Your starting location is: ${firstAddress} (at exact coordinates: Lat ${lat}, Lng ${lng}).
When recommending any places, restaurants, or attractions, they MUST be within a 3-mile radius of this location or the current itinerary stop. You MUST use the "searchNearbyPlaces" tool passing these coordinates as the center point (centerLat: ${lat}, centerLng: ${lng}) to find places within 3 miles. When you find a place and want to show it on the map, you MUST pass its name AND placeId to the "viewOnMap" tool. This ensures precision and avoids loading generic spots! Do not guess or use internal knowledge for distant locations!

Here is the full trip itinerary you should follow:
${JSON.stringify(data.itinerary, null, 2)}

Do NOT just say "Okay" or acknowledge textually. Respond naturally and drive the map! Speak the introductory message provided below. DO NOT repeat your narrative or intro greeting if you have already spoken it in this chat session. Be concise and keep moving forward.`;



          systemPromptContent = { parts: [{ text: systemPrompt }] };
          initialContent = [
            {text: welcomePrompt}
          ];
        }
      }
      
      const genAI = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

      const newSession = await genAI.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          systemInstruction: systemPromptContent,
          responseModalities: ["AUDIO" as any],
          tools: [
            {
              functionDeclarations: [
              {
                name: 'goToNextLocation',
                description: 'Exposes the next scheduled point of interest from the itinerary on the 3D map viewport. Use this when the user says "next" or "continue".',
              },
              {
                name: 'viewOnMap',
                description: 'Syncs the 3D map to a specific location you are discussing. Always call this whenever you mention a tourist attraction or location from the itinerary. For recommended places found via searchNearbyPlaces, you MUST pass the placeId if available.',
                parameters: {
                  type: 'object',
                  properties: {
                    locationName: { type: 'string', description: 'The name of the location to fly the camera to.' },
                    placeId: { type: 'string', description: 'Optional: The Google Maps Place ID. Use this for precise map loading of recommended spots.' }
                  },
                  required: ['locationName']
                }
              },

              {
                name: 'addPoiToItinerary',
                description: 'Adds are new point of interest (like are restaurant or cafe recommendation) to are specific day of the itinerary array.',
                parameters: {
                  type: 'object',
                  properties: {
                    dayNumber: { type: 'integer', description: 'The 0-based index of the day in the itinerary array (e.g., 0 for Day 1).' },
                    name: { type: 'string', description: 'The name of the restaurant or attraction.' },
                    description: { type: 'string', description: 'Short description of why it is recommended.' }
                  },
                  required: ['dayNumber', 'name', 'description']
                }
              },
              {
                name: 'searchNearbyPlaces',
                description: 'Search for places, restaurants, or attractions within a 3-mile radius of a given location.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'The search query (e.g., "restaurants", "sushi", "parks").' },
                    centerLat: { type: 'number', description: 'The latitude of the center of search.' },
                    centerLng: { type: 'number', description: 'The longitude of the center of search.' }
                  },
                  required: ['query', 'centerLat', 'centerLng']
                }
              }
            ]
          }]
        },


        callbacks: {
          onopen: () => {
            console.log('Live API Connection Opened');
            setConnected(true);
          },
          onclose: (e: any) => {
            console.log('Live API Connection Closed:', e?.code, e?.reason);
            // Involuntary close should only clear session/connected state, preserving itinerary context
            setSession(null);
            setConnected(false);
            setText('');
          },
          onerror: (e: any) => {
            console.error('Live API Error event:', e);
            setError(`API Error: ${e.message || 'Unknown error'}`);
            // Soft reset to preserve itinerary context
            setSession(null);
            setConnected(false);
            setText('');
          },
          onmessage: (message) => {
            console.log('Live API Message received:', {
              serverContent: !!message.serverContent,
              setupComplete: !!message.setupComplete,
              toolCall: !!message.toolCall,
              goAway: !!message.goAway
            });
            if (message.toolCall) {
              const call = (message.toolCall as any).functionCalls?.[0];
                if (call && call.name === 'goToNextLocation') {
                  console.log("[use-live-api] goToNextLocation tool called by model!");
                  const currentTourIndex = useLiveStore.getState().tourIndex;
                  // If uninitialized (-1), assume we are at the first stop and want to go to the second (1)
                  const nextIndex = currentTourIndex === -1 ? 1 : currentTourIndex + 1;
                  useLiveStore.setState({ tourIndex: nextIndex });
                  console.log("[use-live-api] Advanced tourIndex to:", nextIndex);
                  
                  if ((newSession as any).sendToolResponse) {
                    (newSession as any).sendToolResponse({
                      functionResponses: [{
                        name: 'goToNextLocation',
                        id: call.id,
                        response: { output: 'Successfully moved to next location.' }
                      }]
                    });
                  }
                } else if (call && call.name === 'viewOnMap') {
                  console.log("[use-live-api] viewOnMap tool called by model with locationName:", call.args?.locationName);
                  const locationName = call.args?.locationName;
                  const placeId = call.args?.placeId;
                  const itineraryData = useLiveStore.getState().itineraryData;
                  if (itineraryData && itineraryData.itinerary) {
                     let foundDay = -1;
                     let foundIndex = -1;
                     for (let day = 0; day < itineraryData.itinerary.length; day++) {
                        const locs = itineraryData.itinerary[day].locations;
                        const idx = locs.findIndex(loc => 
                          loc.name.toLowerCase().includes(locationName.toLowerCase()) || 
                          locationName.toLowerCase().includes(loc.name.toLowerCase())
                        );
                        if (idx >= 0) {
                           foundDay = day;
                           foundIndex = idx;
                           break;
                        }
                     }
                     if (foundIndex >= 0) {
                        useLiveStore.setState({ activeDay: foundDay, tourIndex: foundIndex });
                        console.log("[use-live-api] Set activeDay to:", foundDay, "and tourIndex to:", foundIndex);
                     } else {
                        // Fallback to dynamic geocoding if not in itinerary
                        console.log("[use-live-api] Location not found in itinerary. Geocoding ad-hoc:", locationName, "with placeId:", placeId);
                        searchPlace(locationName, placeId).then(coords => {

                           useLiveStore.setState({
                              mapData: {
                                 location: { name: locationName, lat: coords.lat, lng: coords.lng },
                                 place: { 
                                    name: locationName, 
                                    rating: coords.rating, 
                                    userRatingCount: coords.userRatingCount, 
                                    imageUrl: coords.imageUrl,
                                    reviews: coords.reviews,
                                    operatingHours: coords.operatingHours
                                 } as any
                              }
                           });
                        }).catch(e => console.error("Dynamic geocoding failed for live tool:", e));
                     }
                  } else {
                     // No itinerary in state, fallback to geocoding
                     console.log("[use-live-api] No itinerary in state. Geocoding ad-hoc:", locationName, "with placeId:", placeId);
                     searchPlace(locationName, placeId).then(coords => {

                        useLiveStore.setState({
                           mapData: {
                              location: { name: locationName, lat: coords.lat, lng: coords.lng },
                              place: { 
                                 name: locationName, 
                                 rating: coords.rating, 
                                 userRatingCount: coords.userRatingCount, 
                                 imageUrl: coords.imageUrl,
                                 reviews: coords.reviews,
                                 operatingHours: coords.operatingHours
                              } as any
                           }
                        });
                     }).catch(e => console.error("Dynamic geocoding failed for live tool:", e));
                  }
                  
                  if ((newSession as any).sendToolResponse) {
                    (newSession as any).sendToolResponse({
                      functionResponses: [{
                        name: 'viewOnMap',
                        id: call.id,
                        response: { output: `Successfully viewed ${locationName} on map.` }
                      }]
                    });
                  }
                } else if (call && call.name === 'addPoiToItinerary') {
                  console.log("[use-live-api] addPoiToItinerary tool called by model args:", call.args);
                  const { dayNumber, name, description } = call.args || {};
                  const itineraryData = useLiveStore.getState().itineraryData;
                  
                  if (itineraryData && itineraryData.itinerary && typeof dayNumber === 'number' && dayNumber >= 0 && dayNumber < itineraryData.itinerary.length) {
                     const newItinerary = [...itineraryData.itinerary];
                     const newDay = { ...newItinerary[dayNumber] };
                     newDay.locations = [...newDay.locations, { name, description }];
                     newItinerary[dayNumber] = newDay;
                     
                     useLiveStore.setState({ itineraryData: { ...itineraryData, itinerary: newItinerary } });
                     console.log("[use-live-api] Successfully added POI to day", dayNumber);
                  }
                  
                  if ((newSession as any).sendToolResponse) {
                    (newSession as any).sendToolResponse({
                      functionResponses: [{
                        name: 'addPoiToItinerary',
                        id: call.id,
                        response: { output: `Successfully added ${name} to Day ${dayNumber + 1}.` }
                      }]
                    });
                  }
                } else if (call && call.name === 'searchNearbyPlaces') {
                  console.log("[use-live-api] searchNearbyPlaces tool called by model args:", call.args);
                  const { query, centerLat, centerLng } = call.args || {};
                  
                  const activeLat = centerLat ?? lat;
                  const activeLng = centerLng ?? lng;
                  
                  if (query && typeof activeLat === 'number' && typeof activeLng === 'number') {
                     console.log(`[use-live-api] Running searchNearbyPlaces for: ${query} using Lat: ${activeLat}, Lng: ${activeLng}`);
                     searchNearbyPlaces(query, { lat: activeLat, lng: activeLng }).then(results => {
                         console.log("[use-live-api] searchNearbyPlaces results count:", results.length);
                         // Return a simplified list of places to the model
                         const simplifiedResults = results.map(r => ({
                            name: r.name,
                            lat: r.lat,
                            lng: r.lng,
                            placeId: r.placeId,
                            address: r.googleMapsURI || "Address not available",
                            rating: r.rating
                         }));

                         
                         if ((newSession as any).sendToolResponse) {
                            (newSession as any).sendToolResponse({
                              functionResponses: [{
                                name: 'searchNearbyPlaces',
                                id: call.id,
                                response: { output: JSON.stringify(simplifiedResults) }
                              }]
                            });
                         }
                     }).catch(e => {
                         console.error("[use-live-api] Nearby Places search failed:", e);
                         if ((newSession as any).sendToolResponse) {
                            (newSession as any).sendToolResponse({
                              functionResponses: [{
                                name: 'searchNearbyPlaces',
                                id: call.id,
                                response: { error: e.message }
                              }]
                            });
                         }
                     });
                  }
                }
            }


            if (message.serverContent) {
              if ('interrupted' in message.serverContent) {
                audioStreamerRef.current?.stop();
                setText('');
              } else if ('modelTurn' in message.serverContent) {
                const parts = message.serverContent.modelTurn?.parts || [];
                let currentText = '';
                parts.forEach(part => {
                  if ('text' in part) {
                    currentText += part.text;
                  } else if (part.inlineData?.mimeType?.startsWith("audio/") && part.inlineData.data) {
                    const audioData = base64ToArrayBuffer(part.inlineData.data);
                    audioStreamerRef.current?.addPCM16(new Uint8Array(audioData));
                  }
                });
                appendText(currentText);
              } 
            }
          },
        },
      });
      setSession(newSession);

      const recorder = new AudioRecorder();
      recorder.onData = (base64Data) => {
        if (base64Data) {
          console.log("[use-live-api] Sending audio chunk (length):", base64Data.length);
          (newSession as any).sendRealtimeInput({
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          } as any);
        }
      };
      await recorder.start();
      audioRecorderRef.current = recorder;

      // Commented out to prevent "1007 Request contains an invalid argument" error with gemini-3.1-flash-live-preview
      // if (initialContent) {
      //   newSession.sendClientContent({ turns: [{ role: 'user', parts: initialContent }] });
      // }

    } catch (e: any) {
      console.error('Failed to initialize or connect to Live API:', e);
      if (e.name === 'NotAllowedError') {
        setError('Microphone/Camera permission denied. Please check your browser Settings and macOS System Settings.');
      } else {
        setError(e.message || 'Failed to initialize the API client.');
      }
      reset();
    }
  }, [reset, micActive, cameraActive, session, appendText, getTourPrompt, setConnected, setError, setIsSpeaking, setSession, setStream, startTour, setText]);
  
  const send = useCallback((parts: Part | Part[]) => {
    if (!session) return;
    
    const commandPart = Array.isArray(parts) ? parts.find(p => 'text' in p) : ('text' in parts ? parts : undefined);
    
    if (itineraryData && commandPart && 'text' in commandPart && commandPart.text) {
        processUserCommand(commandPart.text);
        return;
    }

    session.sendClientContent({ turns: [{ role: 'user', parts: Array.isArray(parts) ? parts : [parts] }] });
  }, [session, itineraryData, processUserCommand]);

  const disconnect = useCallback(() => {
    if (session) {
      session.close();
      reset();
    }
  }, [session, reset]);

  // Effect to auto-stop recorder when session disconnects
  useEffect(() => {
    if (!session && audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
    }
  }, [session]);

  // Effect to enable/disable mic track based on `micActive` state
  useEffect(() => {
    if (streamFromStore) {
        streamFromStore.getAudioTracks().forEach(track => {
            track.enabled = micActive;
        });
    }
  }, [micActive, streamFromStore]);

    // Effect to enable/disable camera track based on `cameraActive` state
  useEffect(() => {
    if (streamFromStore) {
        streamFromStore.getVideoTracks().forEach(track => {
            track.enabled = cameraActive;
        });
    }
  }, [cameraActive, streamFromStore]);

  // Effect for volume meter
  useEffect(() => {
    if (streamFromStore && isListening) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamFromStore);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let animationFrameId: number;

      const monitor = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
        const currentVolume = average / 128;
        setVolume(currentVolume);
        
        // Sync to Zustand store for UI animations
        useLiveStore.setState({ volume: currentVolume });
        
        animationFrameId = requestAnimationFrame(monitor);
      };
      monitor();

      return () => {
        cancelAnimationFrame(animationFrameId);
        source.disconnect();
        analyser.disconnect();
        audioContext.close().catch(console.error);
      };
    } else {
      setVolume(0);
    }
  }, [streamFromStore, isListening, setVolume]);
  
  // Effect to capture video frames and send to Gemini Live (1 FPS)
  useEffect(() => {
    if (!session || !cameraActive || !streamFromStore) return;

    let intervalId: NodeJS.Timeout;

    // Create a hidden video and canvas element to draw frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = document.createElement('video');
    video.style.position = 'absolute';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.opacity = '0';
    video.style.width = '1px';
    video.style.height = '1px';
    document.body.appendChild(video); // Needs DOM presence to resolve dimensions on some browsers
    video.srcObject = streamFromStore;
    video.muted = true;

    video.onloadedmetadata = () => {
      // console.log(`[use-live-api] Video Dimensions Resolved: ${video.videoWidth}x${video.videoHeight}`);
      video.play().catch(console.error);
    };

    const captureFrame = () => {
      if (!ctx || video.videoWidth === 0 || !session || !connected) return;

      canvas.width = video.videoWidth / 2; // Resize for bandwidth
      canvas.height = video.videoHeight / 2;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = base64Image.split(',')[1]; // Strip prefix

      if (base64Data) {
         // Casting to any to allow raw format used in example
         (session as any).sendRealtimeInput({
            video: {
               mimeType: 'image/jpeg',
               data: base64Data
            }
         });
         // console.log("[use-live-api] Pushed 1 video frame utilizing example format.");
      }
    };

    intervalId = setInterval(captureFrame, 1000); // 1 FPS

    return () => {
      clearInterval(intervalId);
      video.pause();
      video.srcObject = null;
      if (document.body.contains(video)) {
         document.body.removeChild(video);
      }
    };
  }, [session, cameraActive, streamFromStore, connected]);

  // Update the global isListening state based on mic and speaking status
  useEffect(() => {
    setIsListening(isListening);
  }, [isListening, setIsListening]);

  return { connect, disconnect, send, stream };
}

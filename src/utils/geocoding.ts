export const geocodeAddress = (address: string): Promise<{ lat: number; lng: number; placeId?: string; }> => {
  return new Promise((resolve, reject) => {
    const checkMapsLoaded = () => {
      if (window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng(), placeId: results[0].place_id });
          } else {
            reject(new Error(`Geocoding failed for ${address}: ${status}`));
          }
        });
      } else {
        setTimeout(checkMapsLoaded, 500); // Poll every 500ms
      }
    };
    checkMapsLoaded();
  });
};

export const searchPlace = (query: string, placeId?: string): Promise<{ lat: number; lng: number; name: string; placeId: string; rating?: number; userRatingCount?: number; imageUrl?: string; reviews?: any[]; operatingHours?: any; googleMapsURI?: string; }> => {
  return new Promise((resolve, reject) => {
    const checkMapsLoaded = async () => {
      if (window.google && window.google.maps) {
        try {
          const { Place } = await google.maps.importLibrary('places') as any;
          
          if (placeId) {
             const place = new Place({ id: placeId });
             await place.fetchFields({
                fields: ['displayName', 'location', 'rating', 'userRatingCount', 'photos', 'reviews', 'regularOpeningHours', 'googleMapsURI']
             });

             const loc = place.location;
             const imageUrl = place.photos && place.photos[0] ? place.photos[0].getURI({ maxHeight: 400 }) : undefined;

             resolve({ 
                lat: loc.lat(), 
                lng: loc.lng(), 
                name: place.displayName || query,
                placeId: placeId || "",
                rating: place.rating,
                userRatingCount: place.userRatingCount,
                imageUrl,
                reviews: place.reviews,
                operatingHours: place.regularOpeningHours,
                googleMapsURI: place.googleMapsURI
             });
             return;
          }

          const { places } = await Place.searchByText({
            textQuery: query,
            fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount', 'photos', 'reviews', 'regularOpeningHours', 'googleMapsURI']
          });

          if (places && places.length > 0) {
            const firstPlace = places[0];
            const place = new Place({ id: firstPlace.id });

            // Sequentially fetch all fields as approved by user
            await place.fetchFields({
               fields: ['displayName', 'location', 'rating', 'userRatingCount', 'photos', 'reviews', 'regularOpeningHours', 'googleMapsURI']
            });

            const loc = place.location;
            const imageUrl = place.photos && place.photos[0] ? place.photos[0].getURI({ maxHeight: 400 }) : undefined;

            resolve({ 
               lat: loc.lat(), 
               lng: loc.lng(), 
               name: place.displayName || query,
               placeId: firstPlace.id || "",
               rating: place.rating,
               userRatingCount: place.userRatingCount,
               imageUrl,
               reviews: place.reviews,
               operatingHours: place.regularOpeningHours,
               googleMapsURI: place.googleMapsURI
            });
          } else {
            reject(new Error(`Places search failed for ${query}`));
          }
        } catch (e) {
          reject(new Error(`Places search exception for ${query}: ${e}`));
        }
      } else {
        setTimeout(checkMapsLoaded, 500); // Poll every 500ms
      }
    };
    checkMapsLoaded();
  });
};

export const searchNearbyPlaces = (query: string, center: { lat: number; lng: number }, radiusMeters: number = 4828): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const checkMapsLoaded = async () => {
      if (window.google && window.google.maps) {
        try {
          const { Place } = await google.maps.importLibrary('places') as any;
          
          // Calculate bounding box for 3 miles radius approx
          const radiusMiles = 3;
          const dLat = radiusMiles / 69;
          const dLng = radiusMiles / (69 * Math.cos(center.lat * Math.PI / 180));

          const { places } = await Place.searchByText({
            textQuery: query,
            locationRestriction: {
              south: center.lat - dLat,
              west: center.lng - dLng,
              north: center.lat + dLat,
              east: center.lng + dLng
            },
            fields: ['id', 'displayName', 'location', 'rating', 'userRatingCount', 'photos', 'reviews', 'regularOpeningHours', 'googleMapsURI']
          });


          if (places && places.length > 0) {
             const results = await Promise.all(places.slice(0, 5).map(async (p: any) => {
                const place = new Place({ id: p.id });
                await place.fetchFields({
                   fields: ['displayName', 'location', 'rating', 'userRatingCount', 'photos', 'reviews', 'regularOpeningHours', 'googleMapsURI']
                });
                const loc = place.location;
                const imageUrl = place.photos && place.photos[0] ? place.photos[0].getURI({ maxHeight: 400 }) : undefined;
                return {
                   lat: loc.lat(),
                   lng: loc.lng(),
                   name: place.displayName || query,
                   placeId: p.id,
                   rating: place.rating,
                   userRatingCount: place.userRatingCount,
                   imageUrl,
                   reviews: place.reviews,
                   operatingHours: place.regularOpeningHours,
                   googleMapsURI: place.googleMapsURI
                };
             }));
             resolve(results);
          } else {
             resolve([]);
          }
        } catch (e) {
          reject(new Error(`Nearby Places search failed for ${query}: ${e}`));
        }
      } else {
        setTimeout(checkMapsLoaded, 500); // Poll every 500ms
      }
    };
    checkMapsLoaded();
  });
};


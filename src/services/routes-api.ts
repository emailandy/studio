
/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fields = ['routes.polyline.geoJsonLinestring', 'routes.legs.duration', 'routes.legs.distanceMeters'];

export class RoutesApi {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async computeRoutes(
    from: google.maps.LatLngLiteral,
    to: google.maps.LatLngLiteral,
    waypoints?: Array<google.maps.LatLngLiteral>,
    travelMode?: 'DRIVE' | 'WALK'
  ) {
    const url = new URL(
      'https://routes.googleapis.com/directions/v2:computeRoutes'
    );

    const routeRequest: {
      origin: {location: {latLng: {longitude: number; latitude: number}}};
      destination: {location: {latLng: {longitude: number; latitude: number}}};
      polylineEncoding: string;
      travelMode?: string;
      intermediates?: Array<{
        location: {latLng: {longitude: number; latitude: number}};
      }>;
    } = {
      origin: {
        location: {latLng: {longitude: from.lng, latitude: from.lat}}
      },
      destination: {
        location: {latLng: {longitude: to.lng, latitude: to.lat}}
      },
      polylineEncoding: 'GEO_JSON_LINESTRING',
      travelMode: travelMode === 'WALK' ? 'WALK' : 'DRIVE'
    };

    if (waypoints?.length) {
      routeRequest.intermediates = waypoints.map(waypoint => ({
        location: {latLng: {longitude: waypoint.lng, latitude: waypoint.lat}}
      }));
    }

    url.searchParams.set('fields', fields.join(','));
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey
      },
      body: JSON.stringify(routeRequest)
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with status: ${response.status} - ${response.statusText}`
      );
    }

    return await response.json();
  }
}

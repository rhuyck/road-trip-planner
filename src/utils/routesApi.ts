const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

export interface ComputedRoute {
  path: { lat: number; lng: number }[];
  distanceMeters: number;
  durationSeconds: number;
  legs: RouteLeg[];
}

function decodePath(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let idx = 0, lat = 0, lng = 0;
  while (idx < encoded.length) {
    let result = 0, shift = 0, b: number;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function toWaypoint(lat: number, lng: number) {
  return { location: { latLng: { latitude: lat, longitude: lng } } };
}

export interface ComputeRouteOptions {
  /**
   * RFC 3339 timestamp (e.g. "2026-06-02T17:00:00Z") for the intended departure.
   * Must be in the future — the Routes API rejects past timestamps. Pair with a
   * `routingPreference` for traffic-aware results; seasonal road closures are
   * respected either way.
   */
  departureTime?: string;
  destinationAddress?: string;
}

export async function computeRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  viaPoints: { lat: number; lng: number }[] = [],
  opts: ComputeRouteOptions = {},
): Promise<ComputedRoute | null> {
  const destinationWaypoint = opts.destinationAddress
    ? { address: opts.destinationAddress }
    : toWaypoint(destination.lat, destination.lng);

  const body: Record<string, unknown> = {
    origin: toWaypoint(origin.lat, origin.lng),
    destination: destinationWaypoint,
    travelMode: 'DRIVE',
    computeAlternativeRoutes: false,
  };

  if (viaPoints.length > 0) {
    body.intermediates = viaPoints.map((p) => ({ via: true, ...toWaypoint(p.lat, p.lng) }));
  }

  if (opts.departureTime) {
    body.departureTime = opts.departureTime;
    // Required by the Routes API when a future departureTime is supplied for
    // driving mode; also gives us traffic-aware seasonal closure handling.
    body.routingPreference = 'TRAFFIC_AWARE';
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Routes API ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  const path = decodePath(route.polyline.encodedPolyline);
  const durationSeconds = parseInt((route.duration as string).replace('s', ''), 10);
  const legs: RouteLeg[] = (route.legs ?? []).map((l: { distanceMeters: number; duration: string }) => ({
    distanceMeters: l.distanceMeters,
    durationSeconds: parseInt(l.duration.replace('s', ''), 10),
  }));

  return { path, distanceMeters: route.distanceMeters, durationSeconds, legs };
}

export function formatMi(meters: number) {
  return `${Math.round(meters / 1609.34)} mi`;
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

'use client';
import { useEffect, useRef } from 'react';
import { useApiIsLoaded } from '@vis.gl/react-google-maps';
import { useTripStore } from '@/store/tripStore';
import { Day } from '@/types/trip';
import { computeRoute, formatMi, formatDuration } from '@/utils/routesApi';

function legFingerprint(prev: Day, curr: Day, departureTime: string): string {
  const stops = curr.stops
    .filter((s) => s.location)
    .map((s) => `${s.location!.lat},${s.location!.lng}`)
    .join(';');
  return `${prev.location.lat},${prev.location.lng}|${curr.location.lat},${curr.location.lng}|${stops}|${departureTime}|${curr.hotel.address}`;
}

/**
 * Turn a trip-day "M/D" string into an RFC 3339 UTC timestamp the Routes API
 * will accept. Picks the next future occurrence of that M/D (bumps the year
 * forward if the date is already past), and anchors at 15:00Z (roughly 9 AM
 * Mountain/8 AM Pacific local departure — a reasonable heuristic for a
 * western-US road trip).
 *
 * Rationale: the Routes API rejects past `departureTime` values, and we want
 * seasonal road closure info (e.g. high-elevation passes) relevant to the
 * actual trip, not whatever today's conditions are.
 */
function departureTimeFor(mDotD: string): string {
  const [m, d] = mDotD.split('/').map((n) => parseInt(n, 10));
  if (!m || !d) return new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const now = new Date();
  let year = now.getUTCFullYear();
  // Start one day into the future so we never hand the API "now or past".
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  let candidate = new Date(Date.UTC(year, m - 1, d, 15, 0, 0));
  while (candidate < tomorrow) {
    year += 1;
    candidate = new Date(Date.UTC(year, m - 1, d, 15, 0, 0));
  }
  return candidate.toISOString();
}

export function useRoutes(days: Day[]) {
  const apiLoaded = useApiIsLoaded();
  const setRoute = useTripStore((s) => s.setRoute);
  const fingerprintsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!apiLoaded) return;

    const dirtyIndices: number[] = [];
    const departureTimes: Record<string, string> = {};
    for (let i = 1; i < days.length; i++) {
      const dep = departureTimeFor(days[i].date);
      departureTimes[days[i].id] = dep;
      const fp = legFingerprint(days[i - 1], days[i], dep);
      if (fingerprintsRef.current[days[i].id] !== fp) {
        fingerprintsRef.current[days[i].id] = fp;
        dirtyIndices.push(i);
      }
    }

    if (dirtyIndices.length === 0) return;

    (async () => {
      for (const i of dirtyIndices) {
        const prev = days[i - 1];
        const curr = days[i];
        const viaPoints = curr.stops.filter((s) => s.location).map((s) => s.location!);

        const fp = fingerprintsRef.current[curr.id];
        try {
          const result = await computeRoute(prev.location, curr.location, viaPoints, {
            departureTime: departureTimes[curr.id],
            ...(curr.hotel.address ? { destinationAddress: curr.hotel.address } : {}),
          });
          // Discard if a newer change superseded this request in-flight
          if (fingerprintsRef.current[curr.id] !== fp) continue;
          if (!result) continue;

          setRoute(curr.id, {
            path: result.path,
            distanceText: formatMi(result.distanceMeters),
            durationText: formatDuration(result.durationSeconds),
            distanceMeters: result.distanceMeters,
            durationSeconds: result.durationSeconds,
            legs: result.legs,
          });
        } catch {
          // Allow retry on transient failure
          if (fingerprintsRef.current[curr.id] === fp) {
            delete fingerprintsRef.current[curr.id];
          }
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiLoaded, days]);
}

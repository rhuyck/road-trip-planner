'use client';
import { useEffect, useRef } from 'react';
import { useApiIsLoaded } from '@vis.gl/react-google-maps';
import { useTripStore } from '@/store/tripStore';
import { Day } from '@/types/trip';
import { computeRoute, formatMi, formatDuration } from '@/utils/routesApi';

function legFingerprint(prev: Day, curr: Day): string {
  const stops = curr.stops
    .filter((s) => s.location)
    .map((s) => `${s.location!.lat},${s.location!.lng}`)
    .join(';');
  return `${prev.location.lat},${prev.location.lng}|${curr.location.lat},${curr.location.lng}|${stops}`;
}

export function useRoutes(days: Day[]) {
  const apiLoaded = useApiIsLoaded();
  const setRoute = useTripStore((s) => s.setRoute);
  const fingerprintsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!apiLoaded) return;

    const dirtyIndices: number[] = [];
    for (let i = 1; i < days.length; i++) {
      const fp = legFingerprint(days[i - 1], days[i]);
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
          const result = await computeRoute(prev.location, curr.location, viaPoints);
          // Discard if a newer change superseded this request in-flight
          if (fingerprintsRef.current[curr.id] !== fp) continue;
          if (!result) continue;

          setRoute(curr.id, {
            path: result.path,
            distanceText: formatMi(result.distanceMeters),
            durationText: formatDuration(result.durationSeconds),
            distanceMeters: result.distanceMeters,
            durationSeconds: result.durationSeconds,
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

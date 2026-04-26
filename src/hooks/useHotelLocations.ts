'use client';
import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Day, LatLng } from '@/types/trip';

export function useHotelLocations(days: Day[]): Record<string, LatLng> {
  const geocodingLib = useMapsLibrary('geocoding');
  const [locations, setLocations] = useState<Record<string, LatLng>>({});
  const doneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!geocodingLib) return;
    const geocoder = new geocodingLib.Geocoder();

    for (const day of days) {
      const addr = day.hotel.address?.trim();
      if (!addr) continue;
      const key = `${day.id}|${addr}`;
      if (doneRef.current.has(key)) continue;
      doneRef.current.add(key);

      geocoder
        .geocode({ address: addr })
        .then(({ results }) => {
          if (!results[0]) return;
          const { lat, lng } = results[0].geometry.location;
          setLocations((prev) => ({ ...prev, [day.id]: { lat: lat(), lng: lng() } }));
        })
        .catch(() => {});
    }
  }, [geocodingLib, days]);

  return locations;
}

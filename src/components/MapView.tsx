'use client';
import { useEffect, useRef, useState } from 'react';
import { Map3D, MapMode, useMap3D, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Day, RouteInfo } from '@/types/trip';
import { getDayColor } from '@/utils/colors';
import { useRoutes } from '@/hooks/useRoutes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEl = any;

interface MapViewProps {
  days: Day[];
  selectedDayId: string | null;
  routes: Record<string, RouteInfo>;
}

// ── Route polylines ────────────────────────────────────────────────────────────

function RoutePolylines({ days, routes, selectedDayId }: MapViewProps) {
  const map3d = useMap3D();
  const maps3dLib = useMapsLibrary('maps3d') as AnyEl;
  const polylinesRef = useRef<Map<string, AnyEl>>(new Map());
  const pathFpsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!map3d || !maps3dLib?.Polyline3DElement) return;

    const rendered = new Set<string>();

    for (const [dayId, routeInfo] of Object.entries(routes)) {
      rendered.add(dayId);

      const idx = days.findIndex((d) => d.id === dayId);
      const isSelected = dayId === selectedDayId;
      const color = getDayColor(idx);

      const fp = `${routeInfo.path.length}_${routeInfo.path[0]?.lat}_${routeInfo.path.at(-1)?.lat}`;
      const pathChanged = pathFpsRef.current[dayId] !== fp;

      let polyline = polylinesRef.current.get(dayId);
      if (!polyline) {
        polyline = new maps3dLib.Polyline3DElement();
        polyline.altitudeMode = 'CLAMP_TO_GROUND';
        map3d.append(polyline);
        polylinesRef.current.set(dayId, polyline);
      }

      // Always sync style so selection changes are reflected immediately
      polyline.strokeColor = isSelected ? '#FFFFFF' : color;
      polyline.strokeWidth = isSelected ? 10 : 5;

      if (pathChanged) {
        pathFpsRef.current[dayId] = fp;
        polyline.path = routeInfo.path.map((p) => ({ lat: p.lat, lng: p.lng, altitude: 50 }));
      }
    }

    for (const [id, polyline] of polylinesRef.current.entries()) {
      if (!rendered.has(id)) {
        polyline.remove();
        polylinesRef.current.delete(id);
        delete pathFpsRef.current[id];
      }
    }
  }, [map3d, maps3dLib, routes, selectedDayId, days]);

  useEffect(() => () => {
    for (const p of polylinesRef.current.values()) p.remove();
    polylinesRef.current.clear();
    pathFpsRef.current = {};
  }, []);

  return null;
}

// ── Markers ────────────────────────────────────────────────────────────────────

function MarkersLayer({ days }: { days: Day[] }) {
  const map3d = useMap3D();
  const maps3dLib = useMapsLibrary('maps3d') as AnyEl;
  const markerLib = useMapsLibrary('marker') as AnyEl;
  const cityMarkersRef = useRef<Map<string, AnyEl>>(new Map());
  const stopMarkersRef = useRef<Map<string, AnyEl>>(new Map());

  // City / overnight markers — amber with day number
  // Guard on markerLib too: if we create markers before PinElement is available,
  // the "already exists" check would skip them on the second render when markerLib loads.
  useEffect(() => {
    if (!map3d || !maps3dLib?.Marker3DElement || !markerLib?.PinElement) return;

    const currentIds = new Set(days.map((d) => d.id));
    for (const [id, m] of cityMarkersRef.current.entries()) {
      if (!currentIds.has(id)) { m.remove(); cityMarkersRef.current.delete(id); }
    }

    days.forEach((day, i) => {
      if (cityMarkersRef.current.has(day.id)) return;
      const marker = new maps3dLib.Marker3DElement({
        position: { lat: day.location.lat, lng: day.location.lng, altitude: 0 },
        title: `Day ${i + 1}: ${day.city}, ${day.state} · ${day.dayOfWeek} ${day.date}`,
        altitudeMode: 'CLAMP_TO_GROUND',
        extruded: true,
      });
      marker.appendChild(new markerLib.PinElement({
        background: '#f59e0b', borderColor: '#d97706', glyphColor: '#1f2937', scale: 1.25, glyphText: String(i + 1),
      }));
      map3d.append(marker);
      cityMarkersRef.current.set(day.id, marker);
    });
  }, [map3d, maps3dLib, markerLib, days]);

  // Stop markers — blue, smaller, no number
  useEffect(() => {
    if (!map3d || !maps3dLib?.Marker3DElement || !markerLib?.PinElement) return;

    const currentStopIds = new Set(days.flatMap((d) => d.stops.filter((s) => s.location).map((s) => s.id)));
    for (const [id, m] of stopMarkersRef.current.entries()) {
      if (!currentStopIds.has(id)) { m.remove(); stopMarkersRef.current.delete(id); }
    }

    for (const day of days) {
      for (const stop of day.stops) {
        if (!stop.location || stopMarkersRef.current.has(stop.id)) continue;
        const marker = new maps3dLib.Marker3DElement({
          position: { lat: stop.location.lat, lng: stop.location.lng, altitude: 0 },
          title: stop.name,
          altitudeMode: 'CLAMP_TO_GROUND',
          extruded: false,
        });
        marker.appendChild(new markerLib.PinElement({
          background: '#3b82f6', borderColor: '#1d4ed8', glyphColor: '#ffffff', scale: 0.85,
        }));
        map3d.append(marker);
        stopMarkersRef.current.set(stop.id, marker);
      }
    }
  }, [map3d, maps3dLib, markerLib, days]);

  useEffect(() => () => {
    for (const m of cityMarkersRef.current.values()) m.remove();
    for (const m of stopMarkersRef.current.values()) m.remove();
    cityMarkersRef.current.clear();
    stopMarkersRef.current.clear();
  }, []);

  return null;
}

// ── Camera controller ──────────────────────────────────────────────────────────

function CameraController({ days, selectedDayId, requestReset }: {
  days: Day[];
  selectedDayId: string | null;
  requestReset: number;
}) {
  const map3d = useMap3D();
  const initializedRef = useRef(false);
  const prevSelectedRef = useRef<string | null>(null);

  const flyOverview = (instant = false) => {
    map3d?.flyCameraTo({
      endCamera: { center: { lat: 41.5, lng: -108.5, altitude: 0 }, range: 4_800_000, tilt: 0, heading: 0 },
      durationMillis: instant ? 0 : 1800,
    });
  };

  useEffect(() => {
    if (!map3d || initializedRef.current) return;
    initializedRef.current = true;
    flyOverview(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map3d]);

  useEffect(() => {
    if (!map3d || requestReset === 0) return;
    flyOverview(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map3d, requestReset]);

  useEffect(() => {
    if (!map3d || !selectedDayId) return;
    if (prevSelectedRef.current === selectedDayId) return;
    prevSelectedRef.current = selectedDayId;

    const idx = days.findIndex((d) => d.id === selectedDayId);
    if (idx < 0) return;

    const curr = days[idx];
    const prev = idx > 0 ? days[idx - 1] : null;

    const centerLat = prev ? (prev.location.lat + curr.location.lat) / 2 : curr.location.lat;
    const centerLng = prev ? (prev.location.lng + curr.location.lng) / 2 : curr.location.lng;
    const latSpan = Math.abs(curr.location.lat - (prev?.location.lat ?? curr.location.lat));
    const lngSpan = Math.abs(curr.location.lng - (prev?.location.lng ?? curr.location.lng));
    const range = Math.max(80_000, Math.max(latSpan, lngSpan, 0.5) * 130_000);

    map3d.flyCameraTo({
      endCamera: { center: { lat: centerLat, lng: centerLng, altitude: 0 }, tilt: 45, heading: 0, range },
      durationMillis: 2000,
    });
  }, [map3d, selectedDayId, days]);

  return null;
}

// ── Map controls toolbar ───────────────────────────────────────────────────────

function CtrlBtn({ onClick, active, title, children }: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

// ── Inner (needs Map3D context) ────────────────────────────────────────────────

function MapInner({ days, selectedDayId, routes, requestReset }: MapViewProps & { requestReset: number }) {
  useRoutes(days);
  return (
    <>
      <RoutePolylines days={days} routes={routes} selectedDayId={selectedDayId} />
      <MarkersLayer days={days} />
      <CameraController days={days} selectedDayId={selectedDayId} requestReset={requestReset} />
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function MapView({ days, selectedDayId, routes }: MapViewProps) {
  const [mapMode, setMapMode] = useState<MapMode>(MapMode.SATELLITE);
  const [resetSeq, setResetSeq] = useState(0);

  const labelsOn = mapMode === MapMode.HYBRID;

  return (
    <div className="flex-1 h-full relative">
      <Map3D
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        mode={mapMode}
      >
        <MapInner days={days} selectedDayId={selectedDayId} routes={routes} requestReset={resetSeq} />
      </Map3D>

      {/* Floating controls */}
      <div className="absolute top-3 right-3 z-10 bg-gray-900/85 backdrop-blur border border-gray-700 rounded-xl p-1.5 flex flex-col gap-0.5 shadow-xl">
        <CtrlBtn
          onClick={() => setMapMode(labelsOn ? MapMode.SATELLITE : MapMode.HYBRID)}
          active={labelsOn}
          title={labelsOn ? 'Hide labels' : 'Show labels & roads'}
        >
          🏷
        </CtrlBtn>
        <div className="h-px bg-gray-700 mx-1" />
        <CtrlBtn onClick={() => setResetSeq((n) => n + 1)} title="Overview of full trip">
          🌍
        </CtrlBtn>
      </div>
    </div>
  );
}

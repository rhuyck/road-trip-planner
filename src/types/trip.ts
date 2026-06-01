import type { CompletenessLevel } from '@/utils/completeness';

export type { CompletenessLevel };

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Hotel {
  name: string;
  address: string;
  url: string;
  cost: string;
  notes: string;
  booked: boolean;
}

export interface Stop {
  id: string;
  name: string;
  address: string;
  location: LatLng | null;
  notes: string;
  url: string;
  timeEstimate: number;
  cost: string;
  bookingRequired: boolean;
  bookingDone: boolean;
}

export interface DayDebrief {
  drive: number;       // 0 = not rated, 0.5–5
  sightseeing: number; // 0 = not rated, 0.5–5
  food: number;        // 0 = not rated, 0.5–5
  vibes: number;       // 0 = not rated, 0.5–5
  lodging: number;     // 0 = not rated, 0.5–5
  tiredness: number | null; // null = not rated, 0–10
  notes: string;
}

export function isFullyDebriefed(day: Day): boolean {
  if (!day.debrief) return false;
  const { drive, sightseeing, food, vibes, lodging, tiredness } = day.debrief;
  return drive >= 0.5 && sightseeing >= 0.5 && food >= 0.5 && vibes >= 0.5 && lodging >= 0.5 && tiredness !== null;
}

export function debriefAverage(debrief: DayDebrief): number {
  const fields = [debrief.drive, debrief.sightseeing, debrief.food, debrief.vibes, debrief.lodging];
  const rated = fields.filter((v) => v > 0);
  if (rated.length === 0) return 0;
  const sum = rated.reduce((a, b) => a + b, 0);
  return Math.round((sum / rated.length) * 2) / 2;
}

export interface Day {
  id: string;
  date: string;
  dayOfWeek: string;
  city: string;
  state: string;
  location: LatLng;
  hotel: Hotel;
  stops: Stop[];
  completeness?: CompletenessLevel;
  debrief?: DayDebrief;
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

export interface ListItem {
  id: string;
  text: string;
  checked: boolean;
  order: number;
}

export interface TripList {
  id: string;
  name: string;
  items: ListItem[];
}

export interface RouteInfo {
  path: Array<{ lat: number; lng: number }>;
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  legs?: RouteLeg[];
}

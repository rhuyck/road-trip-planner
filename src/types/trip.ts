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

export interface Day {
  id: string;
  date: string;
  dayOfWeek: string;
  city: string;
  state: string;
  location: LatLng;
  hotel: Hotel;
  stops: Stop[];
}

export interface RouteLeg {
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteInfo {
  path: Array<{ lat: number; lng: number }>;
  distanceText: string;
  durationText: string;
  distanceMeters: number;
  durationSeconds: number;
  legs?: RouteLeg[];
}

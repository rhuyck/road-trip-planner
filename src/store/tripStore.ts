'use client';
import { create } from 'zustand';
import { Day, Hotel, RouteInfo, Stop } from '@/types/trip';

interface TripStore {
  days: Day[];
  selectedDayId: string | null;
  routes: Record<string, RouteInfo>;
  loaded: boolean;

  setDays: (days: Day[]) => void;
  setLoaded: (v: boolean) => void;

  setSelectedDay: (id: string | null) => void;
  addStop: (dayId: string, stop: Omit<Stop, 'id'>) => void;
  updateStop: (dayId: string, stopId: string, patch: Partial<Stop>) => void;
  removeStop: (dayId: string, stopId: string) => void;
  reorderStop: (dayId: string, fromIndex: number, toIndex: number) => void;
  updateHotel: (dayId: string, hotel: Hotel) => void;
  setRoute: (dayId: string, info: RouteInfo) => void;
}

export const useTripStore = create<TripStore>()((set) => ({
  days: [],
  selectedDayId: null,
  routes: {},
  loaded: false,

  setDays: (days) => set({ days }),
  setLoaded: (loaded) => set({ loaded }),

  setSelectedDay: (id) => set({ selectedDayId: id }),

  addStop: (dayId, stopData) =>
    set((state) => ({
      days: state.days.map((d) =>
        d.id === dayId
          ? { ...d, stops: [...d.stops, { ...stopData, id: crypto.randomUUID() }] }
          : d
      ),
    })),

  updateStop: (dayId, stopId, patch) =>
    set((state) => ({
      days: state.days.map((d) =>
        d.id === dayId
          ? { ...d, stops: d.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)) }
          : d
      ),
    })),

  removeStop: (dayId, stopId) =>
    set((state) => ({
      days: state.days.map((d) =>
        d.id === dayId ? { ...d, stops: d.stops.filter((s) => s.id !== stopId) } : d
      ),
    })),

  reorderStop: (dayId, fromIndex, toIndex) =>
    set((state) => ({
      days: state.days.map((d) => {
        if (d.id !== dayId) return d;
        if (fromIndex === toIndex) return d;
        if (fromIndex < 0 || fromIndex >= d.stops.length) return d;
        if (toIndex < 0 || toIndex >= d.stops.length) return d;
        const stops = d.stops.slice();
        const [moved] = stops.splice(fromIndex, 1);
        stops.splice(toIndex, 0, moved);
        return { ...d, stops };
      }),
    })),

  updateHotel: (dayId, hotel) =>
    set((state) => ({
      days: state.days.map((d) => (d.id === dayId ? { ...d, hotel } : d)),
    })),

  setRoute: (dayId, info) =>
    set((state) => ({
      routes: { ...state.routes, [dayId]: info },
    })),
}));

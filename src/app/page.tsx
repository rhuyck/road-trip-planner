'use client';
import { useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { useTripStore } from '@/store/tripStore';
import { Stop } from '@/types/trip';
import { Sidebar } from '@/components/Sidebar';
import { MapView } from '@/components/MapView';
import { AddStopModal } from '@/components/AddStopModal';
import { HotelModal } from '@/components/HotelModal';
import { PinGate } from '@/components/PinGate';
import { loadTripFromServer, startTripSync } from '@/lib/tripSync';

type StopModal = { dayId: string; editing: Stop | null };
type HotelModalState = { dayId: string };

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const TRIP_YEAR = 2026;

function toIsoDate(mDotD: string, year: number): string {
  const [m, d] = mDotD.split('/').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(year, (m || 1) - 1, d || 1));
  return dt.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export default function Page() {
  return (
    <PinGate>
      {(isGuest) => <TripApp isGuest={isGuest} />}
    </PinGate>
  );
}

function TripApp({ isGuest }: { isGuest: boolean }) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stopModal, setStopModal] = useState<StopModal | null>(null);
  const [hotelModal, setHotelModal] = useState<HotelModalState | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const days = useTripStore((s) => s.days);
  const selectedDayId = useTripStore((s) => s.selectedDayId);
  const routes = useTripStore((s) => s.routes);
  const loaded = useTripStore((s) => s.loaded);
  const addStop = useTripStore((s) => s.addStop);
  const updateStop = useTripStore((s) => s.updateStop);
  const updateHotel = useTripStore((s) => s.updateHotel);

  useEffect(() => {
    startTripSync();
    loadTripFromServer().catch((err) => {
      setLoadError(err instanceof Error ? err.message : String(err));
    });
  }, []);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50 dark:bg-gray-900 p-6">
        <div className="max-w-lg text-center">
          <div className="text-rose-400 font-semibold mb-2">Could not load trip from Google Sheets</div>
          <pre className="text-xs text-stone-500 dark:text-gray-400 whitespace-pre-wrap break-words bg-stone-100 dark:bg-gray-800 rounded p-3">{loadError}</pre>
          <p className="text-xs text-stone-400 dark:text-gray-500 mt-3">Check <code>SETUP.md</code> and your <code>.env.local</code>.</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50 dark:bg-gray-900">
        <div className="text-stone-500 dark:text-gray-400 text-sm animate-pulse">Loading trip from Google Sheets…</div>
      </div>
    );
  }

  const activeDay = stopModal ? days.find((d) => d.id === stopModal.dayId) : null;
  const activeDayIdx = activeDay ? days.indexOf(activeDay) : -1;
  const activeHotelDay = hotelModal ? days.find((d) => d.id === hotelModal.dayId) : null;
  const activeHotelDayIdx = activeHotelDay ? days.indexOf(activeHotelDay) : -1;
  const hotelCheckIn = activeHotelDay ? toIsoDate(activeHotelDay.date, TRIP_YEAR) : '';
  const hotelCheckOut = activeHotelDay
    ? (activeHotelDayIdx < days.length - 1
        ? toIsoDate(days[activeHotelDayIdx + 1].date, TRIP_YEAR)
        : addDaysIso(hotelCheckIn, 1))
    : '';

  return (
    <APIProvider apiKey={API_KEY} libraries={['maps3d', 'geocoding', 'marker']}>
      <div className="flex h-full overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onAddStop={isGuest ? () => {} : (dayId) => setStopModal({ dayId, editing: null })}
          onEditStop={isGuest ? () => {} : (dayId, stop) => setStopModal({ dayId, editing: stop })}
          onEditHotel={isGuest ? () => {} : (dayId) => setHotelModal({ dayId })}
          isGuest={isGuest}
        />

        <MapView days={days} selectedDayId={selectedDayId} routes={routes} />
      </div>

      {stopModal && activeDay && (
        <AddStopModal
          dayLabel={`Day ${activeDayIdx + 1}: ${activeDay.dayOfWeek}, ${activeDay.date} → ${activeDay.city}`}
          editingStop={stopModal.editing}
          dayOriginCity={activeDayIdx > 0 ? `${days[activeDayIdx - 1].city}` : activeDay.city}
          dayDestCity={activeDay.city}
          dayOriginLocation={activeDayIdx > 0 ? days[activeDayIdx - 1].location : null}
          dayDestLocation={activeDay.location}
          onSave={(stop) => {
            if (stopModal.editing) {
              updateStop(stopModal.dayId, stopModal.editing.id, stop);
            } else {
              addStop(stopModal.dayId, stop);
            }
          }}
          onClose={() => setStopModal(null)}
        />
      )}

      {hotelModal && activeHotelDay && (
        <HotelModal
          dayLabel={`${activeHotelDay.dayOfWeek}, ${activeHotelDay.date} · ${activeHotelDay.city}, ${activeHotelDay.state}`}
          hotel={activeHotelDay.hotel}
          city={activeHotelDay.city}
          state={activeHotelDay.state}
          checkIn={hotelCheckIn}
          checkOut={hotelCheckOut}
          onSave={(hotel) => updateHotel(hotelModal.dayId, hotel)}
          onClose={() => setHotelModal(null)}
        />
      )}
    </APIProvider>
  );
}

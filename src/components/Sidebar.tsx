'use client';
import { useMemo } from 'react';
import { useTripStore } from '@/store/tripStore';
import { Day, RouteInfo, Stop } from '@/types/trip';
import { DayCard } from './DayCard';

interface Props {
  onAddStop: (dayId: string) => void;
  onEditStop: (dayId: string, stop: Stop) => void;
  onEditHotel: (dayId: string) => void;
}

export function Sidebar({ onAddStop, onEditStop, onEditHotel }: Props) {
  const days = useTripStore((s) => s.days);
  const selectedDayId = useTripStore((s) => s.selectedDayId);
  const routes = useTripStore((s) => s.routes);
  const setSelectedDay = useTripStore((s) => s.setSelectedDay);
  const removeStop = useTripStore((s) => s.removeStop);
  const reorderStop = useTripStore((s) => s.reorderStop);

  const stats = useMemo(() => {
    const totalStops = days.reduce((sum, d) => sum + d.stops.length, 0);
    const totalMi = Object.values(routes).reduce((sum, r) => sum + r.distanceMeters / 1609.34, 0);
    const totalSec = Object.values(routes).reduce((sum, r) => sum + r.durationSeconds, 0);
    const totalHours = Math.floor(totalSec / 3600);
    const totalDays = Math.floor(totalHours / 8);
    const remHours = totalHours % 8;

    let costTotal = 0;
    for (const d of days) {
      const hc = parseFloat(d.hotel.cost.replace(/[^0-9.]/g, ''));
      if (!isNaN(hc)) costTotal += hc;
      for (const s of d.stops) {
        const sc = parseFloat(s.cost.replace(/[^0-9.]/g, ''));
        if (!isNaN(sc)) costTotal += sc;
      }
    }

    return { totalStops, totalMi: Math.round(totalMi), totalDays, remHours, costTotal };
  }, [days, routes]);

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700 w-96 flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white tracking-tight">🗺 Road Trip 2025</h1>
        <p className="text-xs text-gray-400 mt-0.5">May 28 – June 15 &middot; 19 days</p>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat label="Miles" value={stats.totalMi > 0 ? `~${stats.totalMi.toLocaleString()}` : '—'} />
          <Stat label="Drive Days" value={stats.totalMi > 0 ? `${stats.totalDays}d ${stats.remHours}h` : '—'} sub="@ 8 hrs/day" />
          <Stat label="Est. Cost" value={stats.costTotal > 0 ? `$${stats.costTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {days.map((day, i) => (
          <DayCard
            key={day.id}
            day={day}
            index={i}
            originCity={i > 0 ? days[i - 1].city : null}
            isSelected={selectedDayId === day.id}
            route={routes[day.id]}
            onSelect={() => setSelectedDay(day.id === selectedDayId ? null : day.id)}
            onAddStop={() => onAddStop(day.id)}
            onEditStop={(stop) => onEditStop(day.id, stop)}
            onRemoveStop={(stopId) => removeStop(day.id, stopId)}
            onReorderStop={(from, to) => reorderStop(day.id, from, to)}
            onEditHotel={() => onEditHotel(day.id)}
          />
        ))}
      </div>

      <div className="p-3 border-t border-gray-700 text-xs text-gray-500 text-center">
        {stats.totalStops} stop{stats.totalStops !== 1 ? 's' : ''} planned &middot; {days.filter((d) => d.hotel.name).length} hotels added
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-2 text-center">
      <div className="text-sm font-semibold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-600">{sub}</div>}
    </div>
  );
}

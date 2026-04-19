'use client';
import { useState, useEffect, useMemo } from 'react';
import { Map, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTripStore } from '@/store/tripStore';
import { Day, RouteInfo, Stop } from '@/types/trip';
import { DayCard } from './DayCard';

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAddStop: (dayId: string) => void;
  onEditStop: (dayId: string, stop: Stop) => void;
  onEditHotel: (dayId: string) => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, onAddStop, onEditStop, onEditHotel }: Props) {
  const days = useTripStore((s) => s.days);
  const selectedDayId = useTripStore((s) => s.selectedDayId);
  const routes = useTripStore((s) => s.routes);
  const setSelectedDay = useTripStore((s) => s.setSelectedDay);
  const removeStop = useTripStore((s) => s.removeStop);
  const reorderStop = useTripStore((s) => s.reorderStop);

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

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

    // Gas estimate: $5.50/gal in CA, $3.50/gal elsewhere, at 25 mpg
    let gasTotal = 0;
    for (const d of days) {
      const r = routes[d.id];
      if (!r) continue;
      const miles = r.distanceMeters / 1609.34;
      const price = d.state === 'CA' ? 5.50 : 3.50;
      gasTotal += (miles / 25) * price;
    }

    return { totalStops, totalMi: Math.round(totalMi), totalDays, remHours, costTotal, gasTotal };
  }, [days, routes]);

  if (collapsed) {
    return (
      <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900 border-r border-stone-200 dark:border-gray-700 w-10 flex-shrink-0">
        <button
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="flex items-center justify-center h-10 text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-gray-800 transition-colors border-b border-stone-200 dark:border-gray-700"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-xs text-stone-400 dark:text-gray-500 tracking-widest"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            🗺  Road Trip 2025  ·  {stats.totalStops} stops
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-gray-900 border-r border-stone-200 dark:border-gray-700 w-96 flex-shrink-0">
      <div className="p-4 border-b border-stone-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Map size={18} /> Road Trip 2025
            </h1>
            <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">May 28 – June 15 &middot; 19 days</p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="flex-shrink-0 -mr-1 -mt-1 w-7 h-7 flex items-center justify-center text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Stat label="Miles" value={stats.totalMi > 0 ? `~${stats.totalMi.toLocaleString()}` : '—'} />
          <Stat label="Drive Days" value={stats.totalMi > 0 ? `${stats.totalDays}d ${stats.remHours}h` : '—'} sub="@ 8 hrs/day" />
          <Stat label="Est. Cost" value={stats.costTotal > 0 ? `$${stats.costTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'} />
          <Stat label="Gas Est." value={stats.gasTotal > 0 ? `~$${Math.round(stats.gasTotal).toLocaleString()}` : '—'} sub="$3.50–$5.50/gal · 25mpg" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {days.map((day, i) => (
          <DayCard
            key={day.id}
            day={day}
            index={i}
            originCity={i > 0 ? days[i - 1].city : null}
            originLocation={i > 0 ? days[i - 1].location : null}
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

      <div className="p-3 border-t border-stone-200 dark:border-gray-700 text-xs text-stone-400 dark:text-gray-500 text-center">
        {stats.totalStops} stop{stats.totalStops !== 1 ? 's' : ''} planned &middot; {days.filter((d) => d.hotel.name).length} hotels added
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center">
      <div className="text-sm font-semibold text-stone-900 dark:text-white">{value}</div>
      <div className="text-xs text-stone-500 dark:text-gray-400">{label}</div>
      {sub && <div className="text-xs text-stone-400 dark:text-gray-600">{sub}</div>}
    </div>
  );
}

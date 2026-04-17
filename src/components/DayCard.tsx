'use client';
import { Fragment, useState } from 'react';
import { Day, RouteInfo, Stop } from '@/types/trip';
import { getDayColor } from '@/utils/colors';
import { formatDuration } from '@/utils/routesApi';

interface Props {
  day: Day;
  index: number;
  originCity: string | null;
  isSelected: boolean;
  route?: RouteInfo;
  onSelect: () => void;
  onAddStop: () => void;
  onEditStop: (stop: Stop) => void;
  onRemoveStop: (stopId: string) => void;
  onReorderStop: (fromIndex: number, toIndex: number) => void;
  onEditHotel: () => void;
}

const GAS_PRICE_CA = 5.50;
const GAS_PRICE_DEFAULT = 3.50;
const MPG = 25;

export function DayCard({
  day, index, originCity, isSelected, route,
  onSelect, onAddStop, onEditStop, onRemoveStop, onReorderStop, onEditHotel,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = getDayColor(index);
  const hasHotel = !!day.hotel.name;
  const hotelBooked = hasHotel && day.hotel.booked;

  const totalStopCost = day.stops.reduce((sum, s) => {
    const n = parseFloat(s.cost.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const hotelCost = parseFloat(day.hotel.cost.replace(/[^0-9.]/g, ''));
  const totalCost = totalStopCost + (isNaN(hotelCost) ? 0 : hotelCost);

  const gasPrice = day.state === 'CA' ? GAS_PRICE_CA : GAS_PRICE_DEFAULT;
  const gasCost = route ? (route.distanceMeters / 1609.34 / MPG) * gasPrice : 0;

  // Map each located stop's id to its leg index so we can show between-stop drive times
  const stopLegIndex = new Map<string, number>();
  let li = 0;
  for (const stop of day.stops) {
    if (stop.location) stopLegIndex.set(stop.id, li++);
  }
  const hasLegs = !!(route?.legs && route.legs.length === li + 1 && li >= 2);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'border-opacity-80 shadow-lg'
          : 'border-gray-700 hover:border-gray-500'
      }`}
      style={isSelected ? { borderColor: color, boxShadow: `0 0 0 1px ${color}40` } : {}}
    >
      <div className="p-3 flex items-start gap-3 cursor-pointer select-none" onClick={() => { onSelect(); setExpanded(true); }}>
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-900"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white text-sm truncate">
              {originCity ? (
                <>
                  <span className="text-gray-400 font-normal">{originCity}</span>
                  <span className="text-gray-500 font-normal mx-1">→</span>
                  {day.city}, {day.state}
                </>
              ) : (
                <>{day.city}, {day.state} <span className="text-gray-500 font-normal">(start)</span></>
              )}
            </span>
            {hasHotel && (
              <span
                className="text-xs"
                title={`${day.hotel.name}${hotelBooked ? ' · Booked' : ' · Not booked'}`}
              >
                🛏{hotelBooked && <span className="text-emerald-400 ml-0.5">✓</span>}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{day.dayOfWeek} &middot; {day.date}</div>
          {route && (
            <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
              <span>🚗 {route.durationText}</span>
              <span>{route.distanceText}</span>
              {gasCost > 0 && (
                <span className="text-amber-500" title={`@ $${gasPrice.toFixed(2)}/gal · ${MPG} mpg`}>
                  ⛽ ~${gasCost.toFixed(0)}
                </span>
              )}
            </div>
          )}
          {totalCost > 0 && (
            <div className="text-xs text-emerald-400 mt-0.5">${totalCost.toFixed(2)} est.</div>
          )}
        </div>
        <button
          className="flex-shrink-0 text-gray-500 hover:text-gray-200 text-lg leading-none px-1"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-700 pt-2">
          {day.stops.length === 0 && (
            <p className="text-xs text-gray-500 italic">No stops yet.</p>
          )}
          {day.stops.map((stop, stopIdx) => {
            const myLegIdx = stopLegIndex.get(stop.id);
            const nextStop = day.stops[stopIdx + 1];
            const nextLegIdx = nextStop ? stopLegIndex.get(nextStop.id) : undefined;
            const showDriveConnector =
              hasLegs &&
              myLegIdx !== undefined &&
              nextLegIdx !== undefined &&
              nextLegIdx === myLegIdx + 1;

            return (
              <Fragment key={stop.id}>
                <div className="flex items-start gap-2 bg-gray-700/50 rounded-lg p-2">
                  <div className="flex flex-col flex-shrink-0 -my-0.5">
                    <button
                      onClick={() => onReorderStop(stopIdx, stopIdx - 1)}
                      disabled={stopIdx === 0}
                      aria-label="Move stop up"
                      className="text-gray-400 hover:text-white text-[10px] leading-none px-1 py-0.5 rounded hover:bg-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => onReorderStop(stopIdx, stopIdx + 1)}
                      disabled={stopIdx === day.stops.length - 1}
                      aria-label="Move stop down"
                      className="text-gray-400 hover:text-white text-[10px] leading-none px-1 py-0.5 rounded hover:bg-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{stop.name}</span>
                      {stop.url && (
                        <a
                          href={stop.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ↗
                        </a>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      {stop.timeEstimate && <span>⏱ {stop.timeEstimate}</span>}
                      {stop.cost && <span>💵 ${stop.cost}</span>}
                    </div>
                    {stop.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{stop.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditStop(stop)}
                      className="text-gray-400 hover:text-white text-xs px-1.5 py-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onRemoveStop(stop.id)}
                      className="text-gray-400 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {showDriveConnector && (
                  <div className="flex items-center gap-2 px-1 text-xs text-gray-500">
                    <span className="flex-1 h-px bg-gray-700" />
                    <span>🚗 {formatDuration(route!.legs![myLegIdx + 1].durationSeconds)}</span>
                    <span className="flex-1 h-px bg-gray-700" />
                  </div>
                )}
              </Fragment>
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onAddStop}
              className="flex-1 py-1.5 text-xs font-medium bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-600/30 rounded-lg transition-colors"
            >
              + Add Stop
            </button>
            <button
              onClick={onEditHotel}
              className={`flex-1 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                hasHotel
                  ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border-amber-600/30'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-400 border-gray-600'
              }`}
            >
              {hasHotel ? (hotelBooked ? '🛏 Edit Hotel ✓' : '🛏 Edit Hotel') : '🛏 Add Hotel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

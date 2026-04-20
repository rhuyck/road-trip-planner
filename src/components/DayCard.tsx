'use client';
import { Fragment, useState } from 'react';
import { BedDouble, Car, Fuel, Clock, Banknote, Pencil, Trash2, MapPin, Route, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Day, RouteInfo, Stop } from '@/types/trip';
import { getDayColor } from '@/utils/colors';
import { formatDuration } from '@/utils/routesApi';

interface Props {
  day: Day;
  index: number;
  originCity: string | null;
  originLocation: { lat: number; lng: number } | null;
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

function formatHours(totalHours: number): string {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function buildDayMapsUrl(
  originLocation: { lat: number; lng: number } | null,
  day: Day,
): string {
  const dest = `${day.location.lat},${day.location.lng}`;
  const locatedStops = day.stops.filter((s) => s.location);
  const waypoints = locatedStops.map((s) => `${s.location!.lat},${s.location!.lng}`).join('|');
  const params = new URLSearchParams({ api: '1', destination: dest, travelmode: 'driving' });
  if (originLocation) params.set('origin', `${originLocation.lat},${originLocation.lng}`);
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function DayCard({
  day, index, originCity, originLocation, isSelected, route,
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

  const stopCount = day.stops.length;
  const driveHours = route ? route.durationSeconds / 3600 : 0;
  const stopHours = day.stops.reduce((sum, s) => sum + s.timeEstimate, 0);
  const accountedHours = driveHours + stopHours;

  // Map each located stop's id to its leg index so we can show between-stop drive times
  const stopLegIndex = new Map<string, number>();
  let li = 0;
  for (const stop of day.stops) {
    if (stop.location) stopLegIndex.set(stop.id, li++);
  }
  const hasLegs = !!(route?.legs && route.legs.length === li + 1 && li >= 1);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${
        isSelected
          ? 'border-opacity-80 shadow-lg'
          : 'border-stone-200 dark:border-gray-700 hover:border-stone-400 dark:hover:border-gray-500'
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
            <span className="font-semibold text-stone-900 dark:text-white text-sm truncate">
              {originCity ? (
                <>
                  <span className="text-stone-500 dark:text-gray-400 font-normal">{originCity}</span>
                  <span className="text-stone-400 dark:text-gray-500 font-normal mx-1">→</span>
                  {day.city}, {day.state}
                </>
              ) : (
                <>{day.city}, {day.state} <span className="text-stone-400 dark:text-gray-500 font-normal">(start)</span></>
              )}
            </span>
            {hasHotel && (
              <span
                className="text-xs"
                title={`${day.hotel.name}${hotelBooked ? ' · Booked' : ' · Not booked'}`}
              >
                <BedDouble size={12} />{hotelBooked && <span className="text-emerald-400 ml-0.5">✓</span>}
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500 dark:text-gray-400">{day.dayOfWeek} &middot; {day.date}</div>
          {route && (
            <div className="flex gap-3 mt-0.5 text-xs text-stone-500 dark:text-gray-400">
              <span><Car size={12} className="inline-block" /> {route.durationText}</span>
              <span>{route.distanceText}</span>
              {gasCost > 0 && (
                <span className="text-amber-500" title={`@ $${gasPrice.toFixed(2)}/gal · ${MPG} mpg`}>
                  <Fuel size={12} className="inline-block" /> ~${gasCost.toFixed(0)}
                </span>
              )}
            </div>
          )}
          {totalCost > 0 && (
            <div className="text-xs text-emerald-400 mt-0.5">${totalCost.toFixed(2)} est.</div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          {stopCount > 0 && (
            <span
              className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold flex items-center justify-center"
              title={`${stopCount} stop${stopCount !== 1 ? 's' : ''}`}
            >
              {stopCount}
            </span>
          )}
          {accountedHours > 0 && (
            <span
              className="min-w-[1.5rem] h-6 px-1 rounded-full bg-purple-100 dark:bg-purple-600/25 text-purple-700 dark:text-purple-300 text-[10px] font-semibold flex items-center justify-center whitespace-nowrap"
              title={`${formatHours(driveHours)} driving + ${formatHours(stopHours)} at stops`}
            >
              {formatHours(accountedHours)}
            </span>
          )}
          <a
            href={buildDayMapsUrl(originLocation, day)}
            target="_blank"
            rel="noreferrer"
            title="View day route in Google Maps"
            onClick={(e) => e.stopPropagation()}
            className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] flex items-center justify-center hover:bg-emerald-600/40 transition-colors"
          >
            <Route size={12} />
          </a>
        </div>
        <button
          className="flex-shrink-0 text-stone-400 dark:text-gray-500 hover:text-stone-900 dark:hover:text-gray-200 text-lg leading-none px-1"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-stone-200 dark:border-gray-700 pt-2">
          {day.stops.length === 0 && (
            <p className="text-xs text-stone-400 dark:text-gray-500 italic">No stops yet.</p>
          )}
          {day.stops.length > 0 && !hasLegs && (
            <p className="text-xs text-stone-400 dark:text-gray-500 italic">Set an address and click Locate on each stop to see drive times between stops.</p>
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
                {hasLegs && myLegIdx === 0 && (
                  <div className="flex items-center gap-2 px-1 text-xs text-stone-400 dark:text-gray-500">
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
                    <span>{originCity ? `From ${originCity}` : 'Start'}: {formatDuration(route!.legs![0].durationSeconds)}</span>
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
                  </div>
                )}
                <div className="flex items-start gap-2 bg-stone-100/70 dark:bg-gray-700/50 rounded-lg p-2">
                  <div className="flex flex-col flex-shrink-0 -my-0.5">
                    <button
                      onClick={() => onReorderStop(stopIdx, stopIdx - 1)}
                      disabled={stopIdx === 0}
                      aria-label="Move stop up"
                      className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white text-[10px] leading-none px-1 py-0.5 rounded hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={10} />
                    </button>
                    <button
                      onClick={() => onReorderStop(stopIdx, stopIdx + 1)}
                      disabled={stopIdx === day.stops.length - 1}
                      aria-label="Move stop down"
                      className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white text-[10px] leading-none px-1 py-0.5 rounded hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={10} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-medium text-stone-900 dark:text-white truncate">{stop.name}</span>
                      {stop.url && (
                        <a
                          href={stop.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                      {stop.timeEstimate > 0 && <span><Clock size={12} className="inline-block" /> {formatHours(stop.timeEstimate)}</span>}
                      {stop.cost && <span><Banknote size={12} className="inline-block" /> ${stop.cost}</span>}
                    </div>
                    {stop.notes && <p className="text-xs text-stone-400 dark:text-gray-500 mt-0.5 truncate">{stop.notes}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {(stop.location || stop.address) && (
                      <a
                        href={
                          stop.location
                            ? `https://www.google.com/maps/search/?api=1&query=${stop.location.lat},${stop.location.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        title="View in Google Maps"
                        onClick={(e) => e.stopPropagation()}
                        className="text-stone-500 dark:text-gray-400 hover:text-emerald-400 text-xs px-1.5 py-1 rounded hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <MapPin size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => onEditStop(stop)}
                      className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white text-xs px-1.5 py-1 rounded hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => onRemoveStop(stop.id)}
                      className="text-stone-500 dark:text-gray-400 hover:text-red-400 text-xs px-1.5 py-1 rounded hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {showDriveConnector && (
                  <div className="flex items-center gap-2 px-1 text-xs text-stone-400 dark:text-gray-500">
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
                    <span><Car size={12} className="inline-block" /> {formatDuration(route!.legs![myLegIdx + 1].durationSeconds)}</span>
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
                  </div>
                )}
                {hasLegs && myLegIdx !== undefined && myLegIdx === li - 1 && !showDriveConnector && (
                  <div className="flex items-center gap-2 px-1 text-xs text-stone-400 dark:text-gray-500">
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
                    <span>To {day.city}: {formatDuration(route!.legs![myLegIdx + 1].durationSeconds)}</span>
                    <span className="flex-1 h-px bg-stone-300 dark:bg-gray-700" />
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
                  : 'bg-stone-100 dark:bg-gray-700 hover:bg-stone-200 dark:hover:bg-gray-600 text-stone-500 dark:text-gray-400 border-stone-300 dark:border-gray-600'
              }`}
            >
              {hasHotel ? (
                hotelBooked
                  ? <><BedDouble size={12} className="inline-block mr-1" />Edit Hotel ✓</>
                  : <><BedDouble size={12} className="inline-block mr-1" />Edit Hotel</>
              ) : (
                <><BedDouble size={12} className="inline-block mr-1" />Add Hotel</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

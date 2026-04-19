'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { LatLng, Stop } from '@/types/trip';
import { computeRoute, formatMi, formatDuration } from '@/utils/routesApi';

interface LegInfo {
  distanceMeters: number;
  durationSeconds: number;
}

interface Props {
  dayLabel: string;
  editingStop?: Stop | null;
  dayOriginCity: string;
  dayDestCity: string;
  dayOriginLocation: LatLng | null;
  dayDestLocation: LatLng;
  onSave: (stop: Omit<Stop, 'id'>) => void;
  onClose: () => void;
}

const EMPTY: Omit<Stop, 'id'> = {
  name: '', address: '', location: null, notes: '', url: '', timeEstimate: 0, cost: '',
  bookingRequired: false, bookingDone: false,
};

export function AddStopModal({
  dayLabel, editingStop,
  dayOriginCity, dayDestCity, dayOriginLocation, dayDestLocation,
  onSave, onClose,
}: Props) {
  const [form, setForm] = useState<Omit<Stop, 'id'>>(editingStop ? { ...editingStop } : EMPTY);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [legToStop, setLegToStop] = useState<LegInfo | null>(null);
  const [legFromStop, setLegFromStop] = useState<LegInfo | null>(null);
  const [computingLegs, setComputingLegs] = useState(false);

  const geocodingLib = useMapsLibrary('geocoding');

  useEffect(() => {
    if (editingStop) setForm({ ...editingStop });
    else setForm(EMPTY);
    setLegToStop(null);
    setLegFromStop(null);
  }, [editingStop]);

  const geocodeAddress = useCallback(async () => {
    if (!geocodingLib || !form.address.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    setLegToStop(null);
    setLegFromStop(null);
    try {
      const geocoder = new geocodingLib.Geocoder();
      const result = await geocoder.geocode({ address: form.address });
      if (result.results[0]) {
        const loc = result.results[0].geometry.location;
        setForm((f) => ({ ...f, location: { lat: loc.lat(), lng: loc.lng() } }));
      } else {
        setGeocodeError('Address not found');
      }
    } catch {
      setGeocodeError('Geocoding failed');
    } finally {
      setGeocoding(false);
    }
  }, [geocodingLib, form.address]);

  // Compute drive distances once a location is resolved
  useEffect(() => {
    if (!form.location) return;
    const stopLoc = form.location;

    setComputingLegs(true);
    setLegToStop(null);
    setLegFromStop(null);

    const requests: Promise<void>[] = [];

    if (dayOriginLocation) {
      requests.push(
        computeRoute(dayOriginLocation, stopLoc)
          .then((r) => { if (r) setLegToStop({ distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds }); })
          .catch(() => {}),
      );
    }

    requests.push(
      computeRoute(stopLoc, dayDestLocation)
        .then((r) => { if (r) setLegFromStop({ distanceMeters: r.distanceMeters, durationSeconds: r.durationSeconds }); })
        .catch(() => {}),
    );

    Promise.all(requests).finally(() => setComputingLegs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location]);

  const field = (key: keyof typeof form, label: string, placeholder = '', opts?: { optional?: boolean; textarea?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">
        {label}
        {opts?.optional && <span className="ml-1 text-stone-400 dark:text-gray-500 font-normal">(optional)</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800 resize-none"
          rows={3} placeholder={placeholder}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          type="text"
          className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
          placeholder={placeholder}
          value={form[key] as string}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  const showLegs = legToStop || legFromStop || computingLegs;

  const totalMeters = (legToStop?.distanceMeters ?? 0) + (legFromStop?.distanceMeters ?? 0);
  const totalSecs = (legToStop?.durationSeconds ?? 0) + (legFromStop?.durationSeconds ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 border border-stone-200 dark:border-gray-600 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">{editingStop ? 'Edit Stop' : 'Add Stop'}</h2>
            <p className="text-sm text-stone-500 dark:text-gray-400">{dayLabel}</p>
          </div>
          <button onClick={onClose} className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white text-2xl leading-none"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {field('name', 'Stop Name', 'e.g. Arches National Park')}

          <div>
            <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
                placeholder="Search address or landmark"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, location: null }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
              />
              <button
                type="button" onClick={geocodeAddress}
                disabled={geocoding || !form.address.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                {geocoding ? '…' : 'Locate'}
              </button>
            </div>
            {geocodeError && <p className="text-xs text-red-400 mt-1">{geocodeError}</p>}
          </div>

          {/* Drive distance callout */}
          {showLegs && (
            <div className="bg-stone-100/80 dark:bg-gray-700/60 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-stone-500 dark:text-gray-400 uppercase tracking-wide">Drive distances</p>
              {computingLegs && !legToStop && !legFromStop && (
                <p className="text-xs text-stone-400 dark:text-gray-500 animate-pulse">Computing…</p>
              )}
              {legToStop && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 dark:text-gray-400 truncate mr-2">From {dayOriginCity}</span>
                  <span className="text-stone-900 dark:text-white font-medium whitespace-nowrap">
                    {formatMi(legToStop.distanceMeters)} · {formatDuration(legToStop.durationSeconds)}
                  </span>
                </div>
              )}
              {legFromStop && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 dark:text-gray-400 truncate mr-2">To {dayDestCity}</span>
                  <span className="text-stone-900 dark:text-white font-medium whitespace-nowrap">
                    {formatMi(legFromStop.distanceMeters)} · {formatDuration(legFromStop.durationSeconds)}
                  </span>
                </div>
              )}
              {legToStop && legFromStop && (
                <div className="flex items-center justify-between text-sm border-t border-stone-200 dark:border-gray-600 pt-2">
                  <span className="text-stone-500 dark:text-gray-400">Total leg</span>
                  <span className="text-emerald-400 font-semibold whitespace-nowrap">
                    {formatMi(totalMeters)} · {formatDuration(totalSecs)}
                  </span>
                </div>
              )}
              {form.timeEstimate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500 dark:text-gray-400">Time at stop</span>
                  <span className="text-stone-900 dark:text-white font-medium whitespace-nowrap">{form.timeEstimate}h</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">Time at Stop (hours)</label>
              <input
                type="number"
                min="0"
                step="0.25"
                className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
                placeholder="Hours, e.g. 1.5"
                value={form.timeEstimate || ''}
                onChange={(e) => setForm((f) => ({ ...f, timeEstimate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-gray-400 text-sm">$</span>
                <input
                  type="text"
                  className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg pl-7 pr-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-blue-400"
                  placeholder="0.00" value={form.cost}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 dark:border-gray-500 bg-stone-50 dark:bg-gray-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800"
              checked={form.bookingRequired}
              onChange={(e) => setForm((f) => ({ ...f, bookingRequired: e.target.checked }))}
            />
            <span className="text-sm font-medium text-stone-700 dark:text-gray-200">Booking required</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 dark:border-gray-500 bg-stone-50 dark:bg-gray-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800"
              checked={form.bookingDone}
              onChange={(e) => setForm((f) => ({ ...f, bookingDone: e.target.checked }))}
            />
            <span className="text-sm font-medium text-stone-700 dark:text-gray-200">Booking done</span>
            {form.bookingDone && <span className="text-xs text-emerald-400">✓ confirmed</span>}
          </label>

          {field('url', 'Website', 'https://…', { optional: true })}
          {field('notes', 'Notes', 'Any notes…', { textarea: true, optional: true })}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-stone-100 dark:bg-gray-700 hover:bg-stone-200 dark:hover:bg-gray-600 text-stone-900 dark:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!form.name.trim()} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium rounded-lg transition-colors">
              {editingStop ? 'Save Changes' : 'Add Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

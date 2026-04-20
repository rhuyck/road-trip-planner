'use client';
import { useState, useEffect } from 'react';
import { BedDouble, Search, MapPin, X } from 'lucide-react';
import { Hotel } from '@/types/trip';

interface Props {
  dayLabel: string;
  hotel: Hotel;
  city: string;
  state: string;
  checkIn: string;  // ISO YYYY-MM-DD
  checkOut: string; // ISO YYYY-MM-DD
  onSave: (hotel: Hotel) => void;
  onClose: () => void;
}

function buildHotelsUrl(city: string, state: string, checkIn: string, checkOut: string): string {
  const params = new URLSearchParams({
    destination: `${city}, ${state}`,
    startDate: checkIn,
    endDate: checkOut,
    adults: '2',
    rooms: '1',
    sort: 'PRICE_LOW_TO_HIGH',
  });
  return `https://www.hotels.com/Hotel-Search?${params.toString()}`;
}

function buildGoogleMapsHotelsUrl(city: string, state: string): string {
  return `https://www.google.com/maps/search/Hotels+in+${encodeURIComponent(city + ',+' + state)}/`;
}

export function HotelModal({ dayLabel, hotel, city, state, checkIn, checkOut, onSave, onClose }: Props) {
  const [form, setForm] = useState<Hotel>(hotel);

  useEffect(() => {
    setForm(hotel);
  }, [hotel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  type StringKey = { [K in keyof Hotel]: Hotel[K] extends string ? K : never }[keyof Hotel];
  const field = (key: StringKey, label: string, placeholder = '', opts?: { optional?: boolean; textarea?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">
        {label}
        {opts?.optional && <span className="ml-1 text-stone-400 dark:text-gray-500 font-normal">(optional)</span>}
      </label>
      {opts?.textarea ? (
        <textarea
          className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
          rows={3}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          type="text"
          className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg px-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 border border-amber-300/60 dark:border-amber-700/40 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <BedDouble size={20} className="text-stone-900 dark:text-white" />
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">Hotel Info</h2>
            </div>
            <p className="text-sm text-stone-500 dark:text-gray-400">{dayLabel}</p>
          </div>
          <button onClick={onClose} className="text-stone-500 dark:text-gray-400 hover:text-stone-900 dark:hover:text-white text-2xl leading-none"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <a
            href={buildHotelsUrl(city, state, checkIn, checkOut)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-600/40 text-rose-200 text-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search size={14} />
              <span>Search hotels.com · 2 adults, 1 room</span>
            </span>
            <span className="text-xs text-rose-300/80">{checkIn} → {checkOut} ↗</span>
          </a>

          <a
            href={buildGoogleMapsHotelsUrl(city, state)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-600/40 text-blue-200 text-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <MapPin size={14} />
              <span>Hotels in {city} · map view</span>
            </span>
            <span className="text-xs text-blue-300/80">{checkIn} ↗</span>
          </a>

          {field('name', 'Hotel Name', 'e.g. Motel 6 Kansas City')}

          {field('url', 'Booking URL', 'https://…', { optional: true })}

          <div>
            <label className="block text-sm font-medium text-stone-600 dark:text-gray-300 mb-1">Cost per Night</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 dark:text-gray-400 text-sm">$</span>
              <input
                type="text"
                className="w-full bg-stone-50 dark:bg-gray-700 border border-stone-300 dark:border-gray-600 rounded-lg pl-7 pr-3 py-2 text-stone-900 dark:text-white text-sm focus:outline-none focus:border-amber-400"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
          </div>

          {field('notes', 'Notes', 'Confirmation #, amenities, etc.', { textarea: true, optional: true })}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-300 dark:border-gray-500 bg-stone-50 dark:bg-gray-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-stone-50 dark:focus:ring-offset-gray-800"
              checked={form.booked}
              onChange={(e) => setForm((f) => ({ ...f, booked: e.target.checked }))}
            />
            <span className="text-sm font-medium text-stone-700 dark:text-gray-200">Booked</span>
            {form.booked && <span className="text-xs text-emerald-400">✓ confirmed</span>}
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-stone-100 dark:bg-gray-700 hover:bg-stone-200 dark:hover:bg-gray-600 text-stone-900 dark:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

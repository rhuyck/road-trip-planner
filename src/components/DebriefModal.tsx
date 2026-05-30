'use client';
import { useState } from 'react';
import { X, Star } from 'lucide-react';
import type { DayDebrief } from '@/types/trip';

interface Props {
  dayLabel: string;
  initialDebrief?: DayDebrief;
  isGuest?: boolean;
  onSave: (debrief: DayDebrief) => void;
  onClose: () => void;
}

const EMPTY_DEBRIEF: DayDebrief = { drive: 0, sightseeing: 0, food: 0, vibes: 0, tiredness: null, notes: '' };

const STAR_FIELDS: { key: keyof Pick<DayDebrief, 'drive' | 'sightseeing' | 'food' | 'vibes'>; label: string }[] = [
  { key: 'drive', label: 'Drive' },
  { key: 'sightseeing', label: 'Sightseeing' },
  { key: 'food', label: 'Food' },
  { key: 'vibes', label: 'Vibes' },
];

function StarRating({
  value,
  label,
  readOnly,
  onChange,
}: {
  value: number;
  label: string;
  readOnly?: boolean;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-stone-300 w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(i)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange(value === i ? 0 : i)}
            className={`p-0.5 transition-colors ${readOnly ? 'cursor-default' : 'hover:scale-110'}`}
            aria-label={readOnly ? undefined : `Rate ${i}`}
          >
            <Star
              size={22}
              fill={active >= i ? '#f59e0b' : 'none'}
              stroke={active >= i ? '#f59e0b' : '#6b7280'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-xs text-stone-500 w-8">{value}/5</span>
      )}
    </div>
  );
}

export function DebriefModal({ dayLabel, initialDebrief, isGuest, onSave, onClose }: Props) {
  const [form, setForm] = useState<DayDebrief>(initialDebrief ?? EMPTY_DEBRIEF);
  const [tirednessActive, setTirednessActive] = useState(initialDebrief?.tiredness != null);
  const [tirednessVal, setTirednessVal] = useState(initialDebrief?.tiredness ?? 5);

  const handleSave = () => {
    onSave({ ...form, tiredness: tirednessActive ? tirednessVal : null });
    onClose();
  };

  const setRating = (field: keyof Pick<DayDebrief, 'drive' | 'sightseeing' | 'food' | 'vibes'>, value: number) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const isComplete =
    form.drive >= 1 && form.sightseeing >= 1 && form.food >= 1 && form.vibes >= 1 && tirednessActive;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-white mb-0.5">Day Debrief</h2>
        <p className="text-sm text-gray-400 mb-5">{dayLabel}</p>

        <div className="space-y-3 mb-5">
          {STAR_FIELDS.map(({ key, label }) => (
            <StarRating
              key={key}
              label={label}
              value={form[key]}
              readOnly={isGuest}
              onChange={(v) => setRating(key, v)}
            />
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-stone-300 mb-2">
            Tiredness <span className="text-gray-500 font-normal">(0–10)</span>
          </label>
          {tirednessActive ? (
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={tirednessVal}
                onChange={(e) => setTirednessVal(parseInt(e.target.value, 10))}
                disabled={isGuest}
                className="flex-1 accent-indigo-400"
              />
              <span className="text-lg font-semibold text-white w-5 text-center">{tirednessVal}</span>
              <span className="text-xs text-gray-500">/10</span>
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => setTirednessActive(false)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !isGuest && setTirednessActive(true)}
              disabled={isGuest}
              className={`text-sm text-gray-500 border border-dashed border-gray-600 rounded px-3 py-1.5 w-full text-left transition-colors ${
                isGuest ? 'cursor-default opacity-50' : 'hover:text-indigo-400 hover:border-indigo-500'
              }`}
            >
              {isGuest ? 'Not rated' : '+ Rate tiredness…'}
            </button>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-300 mb-1">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            disabled={isGuest}
            placeholder="How was the day overall?"
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 resize-none disabled:opacity-60"
          />
        </div>

        {!isGuest && (
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isComplete
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isComplete ? 'Save Debrief ✓' : 'Save (partial)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

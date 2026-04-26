'use client';
import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Lock } from 'lucide-react';

interface Props {
  children: (isGuest: boolean) => React.ReactNode;
}

export function PinGate({ children }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState<{ ok: true; isGuest: boolean } | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  if (authed) {
    return <>{children(authed.isGuest)}</>;
  }

  const focusAt = (i: number) => {
    inputRefs.current[i]?.focus();
  };

  const handleChange = (i: number, val: string) => {
    const ch = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    setError(null);
    if (ch && i < 5) focusAt(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      focusAt(i - 1);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight' && i < 5) {
      focusAt(i + 1);
    } else if (e.key === 'Enter') {
      void submit([...digits]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError(null);
    focusAt(Math.min(pasted.length, 5));
  };

  const submit = async (d: string[]) => {
    const pin = d.join('');
    if (pin.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { ok: boolean; role?: string };
      if (data.ok) {
        setAuthed({ ok: true, isGuest: data.role === 'guest' });
      } else {
        setError('Incorrect PIN. Please try again.');
        setDigits(Array(6).fill(''));
        focusAt(0);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-stone-50 dark:bg-gray-900">
      <div className="w-full max-w-sm mx-auto px-6 py-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-stone-200 dark:border-gray-700 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Lock size={22} className="text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white tracking-tight">Road Trip 2026</h1>
          <p className="text-sm text-stone-500 dark:text-gray-400 text-center">Enter your 6-digit PIN to continue.</p>
        </div>

        <div className="flex gap-2" role="group" aria-label="PIN entry">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`PIN digit ${i + 1}`}
              className={`w-11 h-14 text-center text-xl font-bold rounded-lg border-2 bg-stone-50 dark:bg-gray-700 text-stone-900 dark:text-white outline-none transition-all
                ${error
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-stone-300 dark:border-gray-600 focus:border-amber-400 dark:focus:border-amber-400'
                }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center -mt-2">{error}</p>
        )}

        <button
          onClick={() => submit(digits)}
          disabled={loading || digits.some((d) => d === '')}
          className="w-full py-2.5 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 transition-colors"
        >
          {loading ? 'Verifying…' : 'Unlock'}
        </button>
      </div>
    </div>
  );
}

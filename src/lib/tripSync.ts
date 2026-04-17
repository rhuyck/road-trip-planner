'use client';
import { useTripStore } from '@/store/tripStore';
import type { Day } from '@/types/trip';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let subscribed = false;
let inFlight: Promise<void> | null = null;
let pendingDays: Day[] | null = null;

const DEBOUNCE_MS = 800;

async function putDays(days: Day[]): Promise<void> {
  const res = await fetch('/api/trip', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PUT /api/trip failed: ${res.status} ${body}`);
  }
}

async function flush(days: Day[]): Promise<void> {
  // Serialize writes. If one is in flight, queue the newest snapshot and
  // run it after the current one resolves.
  if (inFlight) {
    pendingDays = days;
    return;
  }
  inFlight = (async () => {
    try {
      await putDays(days);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[tripSync] save failed', err);
    } finally {
      inFlight = null;
      if (pendingDays) {
        const next = pendingDays;
        pendingDays = null;
        void flush(next);
      }
    }
  })();
  await inFlight;
}

export async function loadTripFromServer(): Promise<void> {
  const res = await fetch('/api/trip', { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET /api/trip failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { days: Day[] };
  useTripStore.getState().setDays(data.days);
  useTripStore.getState().setLoaded(true);
}

/** Subscribe once: whenever `days` changes after load, debounce-PUT to server. */
export function startTripSync(): void {
  if (subscribed) return;
  subscribed = true;

  useTripStore.subscribe((state, prev) => {
    if (!state.loaded) return;
    if (state.days === prev.days) return;
    const snapshot = state.days;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void flush(snapshot);
    }, DEBOUNCE_MS);
  });
}

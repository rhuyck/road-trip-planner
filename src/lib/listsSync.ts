'use client';
import { useListsStore } from '@/store/listsStore';
import type { TripList } from '@/types/trip';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let subscribed = false;
let inFlight: Promise<void> | null = null;
let pendingLists: TripList[] | null = null;

const DEBOUNCE_MS = 800;

async function putLists(lists: TripList[]): Promise<void> {
  const res = await fetch('/api/lists', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lists }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PUT /api/lists failed: ${res.status} ${body}`);
  }
}

async function flush(lists: TripList[]): Promise<void> {
  if (inFlight) {
    pendingLists = lists;
    return;
  }
  inFlight = (async () => {
    try {
      await putLists(lists);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[listsSync] save failed', err);
    } finally {
      inFlight = null;
      if (pendingLists) {
        const next = pendingLists;
        pendingLists = null;
        void flush(next);
      }
    }
  })();
  await inFlight;
}

export async function loadListsFromServer(): Promise<void> {
  const res = await fetch('/api/lists', { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET /api/lists failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { lists: TripList[] };
  useListsStore.getState().setLists(data.lists);
  useListsStore.getState().setLoaded(true);
}

export function startListsSync(): void {
  if (subscribed) return;
  subscribed = true;

  useListsStore.subscribe((state, prev) => {
    if (!state.loaded) return;
    if (state.lists === prev.lists) return;
    const snapshot = state.lists;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void flush(snapshot);
    }, DEBOUNCE_MS);
  });
}

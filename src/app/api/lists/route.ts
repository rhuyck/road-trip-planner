import { NextResponse } from 'next/server';
import { ensureInitialized, readLists, writeLists } from '@/lib/sheets';
import { INITIAL_DAYS } from '@/data/initialTrip';
import type { TripList } from '@/types/trip';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await ensureInitialized(INITIAL_DAYS);
    const lists = await readLists();
    return NextResponse.json({ lists });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { lists?: TripList[] };
    if (!body || !Array.isArray(body.lists)) {
      return NextResponse.json({ error: 'Expected body: { lists: TripList[] }' }, { status: 400 });
    }
    await writeLists(body.lists);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

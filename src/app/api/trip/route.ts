import { NextResponse } from 'next/server';
import { ensureInitialized, readTrip, writeTrip } from '@/lib/sheets';
import { INITIAL_DAYS } from '@/data/initialTrip';
import type { Day } from '@/types/trip';

// Never cache — this is mutable data backed by a remote sheet.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await ensureInitialized(INITIAL_DAYS);
    const days = await readTrip();
    return NextResponse.json({ days });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { days?: Day[] };
    if (!body || !Array.isArray(body.days)) {
      return NextResponse.json({ error: 'Expected body: { days: Day[] }' }, { status: 400 });
    }
    await writeTrip(body.days);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

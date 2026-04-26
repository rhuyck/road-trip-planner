import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.pin !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { pin } = body;
  const pin1 = process.env.ENV_PINCODE_1;
  const pin2 = process.env.ENV_PINCODE_2;
  const pin3 = process.env.ENV_PINCODE_3;

  if (pin3 && pin === pin3) {
    return NextResponse.json({ ok: true, role: 'guest' });
  }
  if ((pin1 && pin === pin1) || (pin2 && pin === pin2)) {
    return NextResponse.json({ ok: true, role: 'user' });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}

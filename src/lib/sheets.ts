import { google, sheets_v4 } from 'googleapis';
import type { Day, Hotel, Stop } from '@/types/trip';

/**
 * Schema
 *
 * "Days" tab (header row expected):
 *   A id | B date | C dayOfWeek | D city | E state | F lat | G lng
 *   H hotelName | I hotelUrl | J hotelCost | K hotelNotes
 *
 * "Stops" tab (header row expected):
 *   A id | B dayId | C orderIndex | D name | E address | F lat | G lng
 *   H notes | I url | J timeEstimate | K cost
 *
 * The server rewrites both tabs in full on every save. Safer than diffing,
 * and the data is small (~20 days, ~100 stops worst case).
 */

const DAYS_TAB = 'Days';
const STOPS_TAB = 'Stops';

const DAYS_HEADER = [
  'id', 'date', 'dayOfWeek', 'city', 'state', 'lat', 'lng',
  'hotelName', 'hotelUrl', 'hotelCost', 'hotelNotes', 'hotelBooked',
];

const STOPS_HEADER = [
  'id', 'dayId', 'orderIndex', 'name', 'address', 'lat', 'lng',
  'notes', 'url', 'timeEstimate', 'cost', 'bookingRequired', 'bookingDone',
];

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  // Private key is stored with literal \n in .env; convert to real newlines.
  const privateKey = getEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  cachedClient = google.sheets({ version: 'v4', auth });
  return cachedClient;
}

function sheetId(): string {
  return getEnv('GOOGLE_SHEETS_ID');
}

// ── helpers ──────────────────────────────────────────────────────────────────

function asString(v: unknown): string {
  return v == null ? '' : String(v);
}

function asNumberOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asBool(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1' || s === 'y';
  }
  return false;
}

function dayFromRow(row: string[]): Day | null {
  const [id, date, dayOfWeek, city, state, lat, lng, hotelName, hotelUrl, hotelCost, hotelNotes, hotelBooked] = row;
  if (!id) return null;
  const latN = asNumberOrNull(lat);
  const lngN = asNumberOrNull(lng);
  if (latN == null || lngN == null) return null;
  const hotel: Hotel = {
    name: asString(hotelName),
    url: asString(hotelUrl),
    cost: asString(hotelCost),
    notes: asString(hotelNotes),
    booked: asBool(hotelBooked),
  };
  return {
    id: asString(id),
    date: asString(date),
    dayOfWeek: asString(dayOfWeek),
    city: asString(city),
    state: asString(state),
    location: { lat: latN, lng: lngN },
    hotel,
    stops: [],
  };
}

function dayToRow(d: Day): (string | number)[] {
  return [
    d.id, d.date, d.dayOfWeek, d.city, d.state,
    d.location.lat, d.location.lng,
    d.hotel.name, d.hotel.url, d.hotel.cost, d.hotel.notes,
    d.hotel.booked ? 'TRUE' : 'FALSE',
  ];
}

interface StopRow { dayId: string; orderIndex: number; stop: Stop; }

function stopFromRow(row: string[]): StopRow | null {
  const [id, dayId, orderIndex, name, address, lat, lng, notes, url, timeEstimate, cost, bookingRequired, bookingDone] = row;
  if (!id || !dayId) return null;
  const latN = asNumberOrNull(lat);
  const lngN = asNumberOrNull(lng);
  const stop: Stop = {
    id: asString(id),
    name: asString(name),
    address: asString(address),
    location: latN != null && lngN != null ? { lat: latN, lng: lngN } : null,
    notes: asString(notes),
    url: asString(url),
    timeEstimate: parseFloat(asString(timeEstimate)) || 0,
    cost: asString(cost),
    bookingRequired: asBool(bookingRequired),
    bookingDone: asBool(bookingDone),
  };
  const idxN = asNumberOrNull(orderIndex);
  return { dayId: asString(dayId), orderIndex: idxN ?? 0, stop };
}

function stopToRow(dayId: string, orderIndex: number, s: Stop): (string | number)[] {
  return [
    s.id, dayId, orderIndex, s.name, s.address,
    s.location?.lat ?? '', s.location?.lng ?? '',
    s.notes, s.url, s.timeEstimate, s.cost,
    s.bookingRequired ? 'TRUE' : 'FALSE',
    s.bookingDone ? 'TRUE' : 'FALSE',
  ];
}

// ── public API ───────────────────────────────────────────────────────────────

export async function readTrip(): Promise<Day[]> {
  const sheets = getClient();
  const spreadsheetId = sheetId();

  const resp = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [`${DAYS_TAB}!A2:K`, `${STOPS_TAB}!A2:M`],
  });

  const [daysRange, stopsRange] = resp.data.valueRanges ?? [];
  const dayRows = (daysRange?.values ?? []) as string[][];
  const stopRows = (stopsRange?.values ?? []) as string[][];

  const days: Day[] = [];
  for (const row of dayRows) {
    const d = dayFromRow(row);
    if (d) days.push(d);
  }

  // Attach stops to their day, preserving orderIndex.
  const stopsByDay: Record<string, StopRow[]> = {};
  for (const row of stopRows) {
    const sr = stopFromRow(row);
    if (!sr) continue;
    (stopsByDay[sr.dayId] ||= []).push(sr);
  }
  for (const d of days) {
    const srs = stopsByDay[d.id] ?? [];
    srs.sort((a, b) => a.orderIndex - b.orderIndex);
    d.stops = srs.map((sr) => sr.stop);
  }

  return days;
}

/** Rewrite both tabs in full. Headers are preserved. */
export async function writeTrip(days: Day[]): Promise<void> {
  const sheets = getClient();
  const spreadsheetId = sheetId();

  const dayValues: (string | number)[][] = [DAYS_HEADER, ...days.map(dayToRow)];

  const stopValues: (string | number)[][] = [STOPS_HEADER];
  for (const d of days) {
    d.stops.forEach((s, i) => stopValues.push(stopToRow(d.id, i, s)));
  }

  // Clear then write, so deleted rows actually disappear.
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId,
    requestBody: { ranges: [`${DAYS_TAB}!A2:Z`, `${STOPS_TAB}!A2:Z`] },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `${DAYS_TAB}!A1`, values: dayValues },
        { range: `${STOPS_TAB}!A1`, values: stopValues },
      ],
    },
  });
}

/** Create tabs + headers if missing; seed with initial days if Days is empty. */
export async function ensureInitialized(initialDays: Day[]): Promise<void> {
  const sheets = getClient();
  const spreadsheetId = sheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title));

  const addRequests: sheets_v4.Schema$Request[] = [];
  if (!titles.has(DAYS_TAB)) addRequests.push({ addSheet: { properties: { title: DAYS_TAB } } });
  if (!titles.has(STOPS_TAB)) addRequests.push({ addSheet: { properties: { title: STOPS_TAB } } });
  if (addRequests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: addRequests },
    });
  }

  // Check whether Days is empty (no header or no data). If so, seed.
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${DAYS_TAB}!A1:K`,
  });
  const rows = (resp.data.values ?? []) as string[][];
  const hasHeader = rows[0]?.[0] === 'id';
  const hasData = rows.length > 1;

  if (!hasHeader || !hasData) {
    await writeTrip(initialDays);
  } else {
    // Ensure Stops header row exists even if Days is already populated.
    const stopHeaderResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${STOPS_TAB}!A1:M1`,
    });
    if (!((stopHeaderResp.data.values?.[0]?.[0]) === 'id')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${STOPS_TAB}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [STOPS_HEADER] },
      });
    }
  }
}

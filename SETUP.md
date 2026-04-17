# Setup

The trip data (days, hotels, stops) is stored in a Google Sheet. The app reads on load and writes on every edit (debounced). This replaces `localStorage`, which was losing data.

## 1. Create the Google Sheet

1. Create a new spreadsheet at <https://sheets.new>.
2. Rename it to something you'll recognize (e.g. **Road Trip 2025**).
3. Copy the spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit`
4. The app will create two tabs (**Days**, **Stops**) and seed headers + initial data on first load — you don't need to set these up manually.

## 2. Create a Google Cloud service account

The app authenticates as a service account so you don't have to deal with OAuth refresh tokens.

1. Go to <https://console.cloud.google.com/>.
2. Create a new project (or reuse an existing one).
3. Enable the **Google Sheets API**: APIs & Services → Library → search "Google Sheets API" → Enable.
4. Create a service account: APIs & Services → Credentials → **Create Credentials** → **Service Account**.
   - Name: e.g. `road-trip-planner`
   - No roles needed.
5. Open the new service account → **Keys** tab → **Add Key** → **Create new key** → **JSON**.
6. A JSON file downloads. You only need two fields from it:
   - `client_email` (looks like `road-trip-planner@your-project.iam.gserviceaccount.com`)
   - `private_key` (a long `-----BEGIN PRIVATE KEY-----...` string with `\n` escapes)

## 3. Share the sheet with the service account

1. Open your Google Sheet.
2. Click **Share**.
3. Paste the service account's `client_email` and give it **Editor** access.
4. Uncheck "Notify people" and share.

## 4. Configure `.env.local`

Create (or edit) `.env.local` in the project root:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-existing-maps-key

GOOGLE_SHEETS_ID=the-spreadsheet-id-from-step-1
GOOGLE_SERVICE_ACCOUNT_EMAIL=road-trip-planner@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Notes on `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`:
- Keep the surrounding **double quotes**.
- Keep the `\n` sequences literal — the server converts them to real newlines at runtime.
- If you paste from the JSON file directly (with real newlines), it will also work, but the single-line form with `\n` is easier to manage in env files.

## 5. Run the app

```powershell
npm run dev
```

Open <http://localhost:3000>. First load will:
1. Create `Days` and `Stops` tabs on your sheet if missing.
2. Seed them with the 19-day trip skeleton from `src/data/initialTrip.ts`.
3. Load into the app.

Subsequent edits (add/edit/remove/reorder stop, edit hotel) auto-save back to the sheet after ~800ms of inactivity. Errors surface to the browser console (`[tripSync] save failed ...`).

## Troubleshooting

**"Missing required env var: GOOGLE_SHEETS_ID"** — `.env.local` didn't load. Restart `npm run dev` after creating/editing it.

**"The caller does not have permission"** — the service account email isn't shared on the sheet, or doesn't have Editor access.

**"Google Sheets API has not been used in project ..."** — API wasn't enabled in step 2.3.

**"invalid_grant" / "invalid signature"** — the `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` is malformed. Re-paste it, making sure the `\n` escapes survived and the surrounding quotes are present.

## Schema

**Days** tab (columns A–K, header row in row 1):

| id | date | dayOfWeek | city | state | lat | lng | hotelName | hotelUrl | hotelCost | hotelNotes |

**Stops** tab (columns A–K, header row in row 1):

| id | dayId | orderIndex | name | address | lat | lng | notes | url | timeEstimate | cost |

You can edit the sheet directly — reload the page to pull the new data. The app rewrites both tabs in full on every save, preserving header row and `orderIndex` for stops.

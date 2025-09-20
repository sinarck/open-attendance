# BPA Attendance System

## Chromebook geolocation bypass (v1)

When managed Chromebooks block `navigator.geolocation`, the app exposes a Chromebook Bypass flow:

- Client detects Chrome OS and shows a "Use Chromebook Bypass" button when geolocation fails.
- Server endpoint `checkin.verifyAndRecordChromebook` verifies the QR token, enforces single-use nonce and device fingerprint uniqueness, and records attendance with `method: "override"` and no coordinates.
- Bypass is protected by an environment flag.

Environment variable:

```
ALLOW_CHROMEBOOK_BYPASS=true
```

Notes and risks:

- Only permitted on ChromeOS (checked via User-Agent).
- Still relies on QR token TTL and nonce uniqueness; it skips geofence checks, so enable only when necessary for deployments with managed ChromeOS.
- All bypass entries are auditable via `method = "override"` and `notes = "Chromebook bypass"`.

Fast, secure QR-based attendance for ~500 attendees in ~20 minutes. Single Next.js app with short-lived QR tokens, geofenced check-ins, and anti-fraud controls.

## Highlights

- QR codes rotate on a short cadence with short-lived JWTs
- Single-use tokens via nonce consumption
- Geofenced check-ins (Haversine + accuracy thresholds + buffer)
- Directory validation by 6-digit user ID
- Device fingerprint gate (one device per meeting)
- Clear user-facing messages; internal codes not exposed

## Tech Stack

- Runtime/Tooling: Bun, Biome, Tailwind CSS 4
- App: Next.js 15 (App Router), React 19, shadcn/ui
- Data: Drizzle ORM (libSQL/Turso driver)
- API: tRPC v11 (Next.js route handler at `/api/trpc`), SuperJSON
- Auth: better-auth (Next.js handler at `src/app/api/auth/[...all]/route.ts`)
- QR: qrcode.react

## Project Layout

- `src/app/check-in/page.tsx` – check-in flow (geolocation + user ID + fingerprint)
- `src/routers/meeting.ts` – QR token generator (protected)
- `src/routers/checkin.ts` – verify token, geofence, directory, device-limit, insert
- `src/trpc` – tRPC context, client, and router wiring
- `src/db/schema` – Drizzle schema (auth + attendance)
- `src/config/meeting.ts` – token TTL, refresh cadence, thresholds
- `src/config/geo.ts` – geolocation options used by the hook
- `src/hooks` – `use-geolocation`, `use-fingerprint`, etc.

## Data Model (Drizzle / SQLite)

- `meetings(id, name, description, slug, start_at, end_at, center_lat, center_lng, radius_m, active, strict, created_at, updated_at)`
- `members(id, name, club_id UNIQUE, auth_user_id, created_at, updated_at)`
- `used_token_nonce(nonce PRIMARY KEY, meeting_id, kiosk_id, consumed_at)`
- `used_device_fingerprint(fingerprint, meeting_id, member_id, first_used_at)`
  - Unique per meeting: `(meeting_id, fingerprint)`
- `attendance(id, meeting_id, member_id, check_in_at, check_in_lat, check_in_lng, distance_m, method, status, notes, created_at, updated_at)`
  - Unique: `(member_id, meeting_id)`

## How It Works

1. Staff calls `meeting.generateToken` every `meetingConfig.refreshIntervalMs` (~15s).
2. QR value is a URL `/check-in?token=JWT`. JWT payload includes `{ meetingId, kioskId, nonce, issuedAt }` and is HS256-signed; TTL is `meetingConfig.qrTokenTtlSeconds` (75s by default).
3. Attendee opens `/check-in`, grants location, enters 6‑digit user ID; a local device fingerprint is captured.
4. API verifies:
   - JWT signature/expiration; nonce single-use (insert into `used_token_nonce`)
   - Meeting active and time-valid
   - Inside geofence: Haversine distance ≤ `radius_m + 10m` and accuracy ≤ `100m + 10m`
   - `members` contains the provided `club_id` (if `meetings.strict`)
   - Device fingerprint unused for this meeting
   - Idempotent insert into `attendance` (unique `(member_id, meeting_id)`)
5. Returns `{ status: "ok" }`; duplicates or invalid states surface friendly messages.

## Configuration

- `src/config/meeting.ts`
  - `qrTokenTtlSeconds` – JWT expiry for QR tokens
  - `iatSkewSeconds` – clock skew tolerance (validation primarily via exp)
  - `maxAccuracyMeters`, `radiusBufferMeters`, `refreshIntervalMs`
- `src/config/geo.ts`
  - `enableHighAccuracy`, `timeoutMs`, `maximumAgeMs`, `watchImprovementMs`, `targetAccuracyM`

## Environment Variables

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` – libSQL/Turso
- `QR_CODE_SECRET` – HS256 signing secret for QR tokens
- `NEXT_PUBLIC_APP_URL` – used in `trustedOrigins` for auth

## Install & Run

```bash
# from repo root
bun install

# Push schema to the database
bun run db:push

# (Optional) Inspect with Drizzle Studio
bun run db:studio

# Start the app (Next.js + tRPC routes)
bun run dev
```

## Seeding

Insert known 6‑digit user IDs into `members` (the `club_id` column):

```sql
INSERT INTO members (name, club_id) VALUES
('John Doe', '123456'),
('Jane Smith', '654321');
```

Insert an active meeting (times are Unix epoch seconds in SQLite):

```sql
INSERT INTO meetings (name, start_at, end_at, center_lat, center_lng, radius_m, active, strict)
VALUES (
  'Chapter Meeting',
  unixepoch('now'),
  unixepoch('now','+2 hours'),
  37.7749,
  -122.4194,
  100,
  1,
  1
);
```

## Error Handling

- Human-readable messages are returned; internal app codes are attached server-side
- Frontend shows:
  - success: first-time check-in
  - warning: already checked-in
  - error: validation/geofence/token/device errors

## Security Notes

- JWTs are short-lived and single-use (nonce table)
- Geofence enforced with accuracy constraints
- One device per meeting (used device fingerprint table)
- No IP/UA hashing in the core path (can be added externally)

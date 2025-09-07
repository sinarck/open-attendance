# BPA Attendance System

Fast, secure QR-based attendance for ~500 attendees in ~20 minutes. Built as a Bun monorepo with a typed API, short-lived QR tokens, geofenced check-ins, and anti-fraud controls.

## Highlights

- QR codes rotate every few seconds with short-lived JWTs
- Single-use tokens via nonce consumption
- Geofenced check-ins (Haversine + accuracy thresholds)
- Directory validation by 6-digit user ID
- Device fingerprint gate (one device per meeting)
- Clear user-facing error messages (internal codes hidden)

## Tech Stack

- Runtime/Tooling: Bun, Turbo
- Frontend: Next.js (App Router), React 19, @tanstack/react-query, @tanstack/react-form, shadcn/ui
- Backend: Hono, tRPC, Drizzle ORM (libSQL/Turso driver), Zod
- Auth: better-auth (session in `apps/server/src/lib/auth.ts`)
- QR: qrcode.react

## Monorepo Layout

- `apps/web` – Next.js client
  - `src/app/checkin/page.tsx` – check-in flow (geolocation + user ID + fingerprint)
  - `src/hooks` – `use-geolocation`, `use-fingerprint`
  - `src/config/index.ts` – UI/runtime constants (QR refresh, geolocation options)
- `apps/server` – Hono + tRPC API
  - `src/routers/meeting.ts` – QR token generator (staff-only)
  - `src/routers/checkin.ts` – verify token, geofence, directory, device-limit, insert
  - `src/db/schema` – Drizzle schema (auth + attendance)
  - `src/config/index.ts` – server constants (JWT TTL, geofence thresholds, skew)

## Data Model (attendance)

- `meeting(id, name, startAt, endAt, centerLat, centerLng, radiusM, active)`
- `attendee_directory(userId, name)`
- `used_token_nonce(nonce, meetingId, kioskId, consumedAt)`
- `checkin(id, meetingId, userId, createdAt, lat, lng, accuracyM, kioskId, deviceFingerprint)`
  - Unique: `(meetingId, userId)`

## How It Works

1. Kiosk page (staff logged-in) calls `meeting.generateToken({ meetingId })` every X seconds.
2. QR value is a URL `.../checkin?token=JWT`. The JWT payload includes `{ meetingId, kioskId, nonce, iat, exp }`.
3. Attendee opens `/checkin` on their phone, grants location, enters 6-digit user ID; device fingerprint is captured.
4. API verifies:
   - JWT signature and expiration; nonce single-use (insert into `used_token_nonce`)
   - Meeting active, within geofence (Haversine + accuracy threshold + buffer)
   - `attendee_directory` contains userId
   - Device fingerprint not used for this meeting
   - Idempotent insert into `checkin` (unique `(meetingId, userId)`)
5. Response returns `ok` or `already`; user gets success/warning toast.

## Configuration

- Server (`apps/server/src/config/index.ts`)
  - `tokens.qrTokenTtlSeconds` – JWT expiry for QR tokens
  - `tokens.iatSkewSeconds` – acceptable clock skew
  - `geofence.maxAccuracyMeters` – max allowed GPS accuracy
  - `geofence.radiusBufferMeters` – extra buffer on radius
- Web (`apps/web/src/config/index.ts`)
  - `qr.refreshIntervalMs` – kiosk QR refresh cadence
  - `geo.*` – geolocation API options

## Environment Variables (server)

- `DATABASE_URL`, `DATABASE_AUTH_TOKEN` – libSQL/Turso
- `QR_CODE_SECRET` – HS256 signing secret for QR tokens
- `NEXT_PUBLIC_SERVER_URL` – base URL used by web client to reach API
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN` – auth
- Optional fallback meeting (if DB not seeded):
  - `MEETING_CENTER_LAT`, `MEETING_CENTER_LNG`, `MEETING_RADIUS_M`

## Install & Run

```bash
# from repo root
bun install

# Migrate database (server)
cd apps/server
bun run db:generate
bun run db:migrate

# Start API
bun run dev

# Start web (new terminal)
cd ../web
bun run dev
```

## Seeding Attendees

Insert known 6-digit user IDs into `attendee_directory` (via SQL or a one-off script):

```sql
INSERT INTO attendee_directory (user_id, name) VALUES
('123456', 'John Doe'),
('654321', 'Jane Smith');
```

Insert a meeting row (or use env fallback):

```sql
INSERT INTO meeting (id, name, center_lat, center_lng, radius_m, active)
VALUES ('1', 'Chapter Meeting', 0.0, 0.0, 0, 0);
```

## Error Handling

- Server returns human-readable messages (e.g., “Your check-in link has expired. Please scan the QR code again.”)
- Internal error codes are mapped server-side and not exposed
- Frontend shows:
  - success: first-time check-in
  - warning: already checked-in
  - error: validation/geofence/token/device errors

## Security Notes

- JWTs are short-lived and single-use (nonce table)
- Check-ins require presence inside geofence with acceptable accuracy
- One device per meeting (device fingerprint table)
- No IP/UA hashing in the core path to avoid bloat (can be added externally)

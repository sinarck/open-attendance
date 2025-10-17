## Attendance (QR-based check-in)

Fast, geofenced, fraud‑resistant attendance for large groups. Rotating QR tokens, short TTLs, device gating, and clear UX. Designed to process ~500 check‑ins in ~20 minutes.

### Features

- **Rotating QR tokens**: HS256 JWTs with TTL ≈ 135s, refreshed every 15s.
- **Device-based fraud prevention**: One device per meeting via device fingerprint.
- **Geofenced check‑ins**: Haversine distance with 10m radius buffer and ≤110m accuracy.
- **Directory validation**: 6‑digit user ID (`members.club_id`) when `meetings.strict`.
- **One device per meeting**: enforced via `used_device_fingerprint`.
- **Chromebook bypass (guarded)**: ChromeOS‑only, records `method: "override"`.
- **Auth‑protected kiosk**: only authenticated staff can mint tokens.
- **Typed API errors**: tRPC responses include `data.appCode` for precise handling.

### Tech stack

- **App**: Next.js 15 (App Router), React 19, shadcn/ui, Tailwind CSS v4.
- **API**: tRPC v11 at `/api/trpc`, SuperJSON.
- **Data**: Drizzle ORM + libSQL/Turso (SQLite).
- **Auth**: better-auth at `/api/auth/[...all]`.
- **Testing**: Playwright.
- **Monitoring**: Sentry (manual setup present).

### Repository layout

- `src/app/check-in` — pages for the attendee flow.
- `src/routers/meeting.ts` — `generateToken` (protected kiosk token).
- `src/routers/checkin.ts` — verify token, geofence, device/dup checks, insert; Chromebook path.
- `src/trpc` — context, procedures, client wiring.
- `src/db/schema` — Drizzle tables (`meetings`, `members`, `attendance`, etc.).
- `src/config/meeting.ts` — TTL, refresh cadence, and thresholds.
- `src/config/geo.ts` — browser geolocation options.

### Data model (SQLite)

- `meetings(id, name, description, slug, start_at, end_at, center_lat, center_lng, radius_m, active, strict, created_at, updated_at)`
- `members(id, name, club_id UNIQUE, auth_user_id, created_at, updated_at)`
- `attendance(id, meeting_id, member_id, check_in_at, check_in_lat, check_in_lng, distance_m, method, status, notes, created_at, updated_at)` — UNIQUE(member_id, meeting_id)
- `used_device_fingerprint(fingerprint, meeting_id, member_id, first_used_at)` — UNIQUE(meeting_id, fingerprint)

### How it works (high level)

1. Staff calls `meeting.generateToken` (auth required). Payload: `{ meetingId, kioskId, issuedAt }`.
2. Attendee visits `/check-in?token=…`, shares location, enters 6‑digit ID; device fingerprint is captured.
3. Server verifies signature/expiry, checks geofence + accuracy, validates directory, prevents duplicates and reused devices, and inserts attendance.
4. Chromebook path skips geo checks but logs `method: "override"` with auditability.

### Configuration

- `src/config/meeting.ts`
  - `qrTokenTtlSeconds`: 135 (120 + 15s skew offset).
  - `refreshIntervalMs`: 15_000 (recommended token refresh cadence).
  - `maxAccuracyMeters`: 100; `radiusBufferMeters`: 10; `iatSkewSeconds`: 10.
- `src/config/geo.ts`: `enableHighAccuracy`, `timeoutMs`, `maximumAgeMs`, `watchImprovementMs`, `targetAccuracyM`.

### Environment

- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` — libSQL/Turso connection.
- `QR_CODE_SECRET` — HS256 signing secret for QR tokens.
- `NEXT_PUBLIC_APP_URL` — used by auth.
- `ALLOW_CHROMEBOOK_BYPASS` — `true` to enable Chromebook flow (default off).

### Install and run

```bash
# install deps
pnpm install

# push schema
pnpm run db:push

# optional: Drizzle Studio
pnpm run db:studio

# start dev server (Next.js + tRPC routes)
pnpm run dev
```

### Seeding

Add members (IDs are 6‑digit strings in `club_id`):

```sql
INSERT INTO members (name, club_id) VALUES
('John Doe', '123456'),
('Jane Smith', '654321');
```

Create an active meeting (timestamps in seconds):

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

### Testing

- Headless E2E: `pnpm run test:e2e`
- UI mode: `pnpm run test:e2e:ui`
- Report: `pnpm run test:e2e:report`

E2E runs with a separate SQLite DB (`file:.tmp/e2e.db`) and auto‑sets required env (see `playwright.config.ts`).

### Chromebook geolocation bypass

When managed Chromebooks block `navigator.geolocation`, enable the guarded flow:

```bash
ALLOW_CHROMEBOOK_BYPASS=true
```

- Allowed only on ChromeOS (checked via User‑Agent).
- Still enforces token TTL and device uniqueness.
- Records `method: "override"` and `notes: "Chromebook bypass"` for audit.

### Security notes

- Short‑lived tokens with device fingerprint enforcement.
- Geofence + accuracy checks; one device per meeting.
- Idempotent inserts via unique keys; clear app codes for client handling.

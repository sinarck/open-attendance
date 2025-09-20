import { expect, test } from "@playwright/test";

// This test seeds 500 members and one active meeting, generates a valid QR token,
// then performs 500 concurrent check-in mutations against /api/trpc.

type SeedResponse = {
  meetingId: number;
  centerLat: number;
  centerLng: number;
  clubIds: string[];
  memberCount: number;
};

type OkBody = { ok: true; data: { status: string } };
type ErrBody = {
  ok: false;
  error: { appCode: string | null; message: string };
};

test("500 attendees check in concurrently", async ({ request }) => {
  // 1) Seed DB deterministically
  const seedRes = await request.post("/api/test/seed");
  expect(seedRes.ok()).toBeTruthy();
  const seed = (await seedRes.json()) as SeedResponse;
  expect(seed.memberCount).toBe(500);

  // 2) Generate a valid token for current meeting using the same signing secret
  const tokenRes = await request.post("/api/test/generate-token", {
    data: { meetingId: seed.meetingId, ttlSeconds: 120 },
  });
  expect(tokenRes.ok()).toBeTruthy();
  const { token } = (await tokenRes.json()) as { token: string };

  // 3) Build 500 distinct payloads with unique device fingerprints
  const lat = seed.centerLat;
  const lng = seed.centerLng;
  const accuracyM = 30;

  const inputs = seed.clubIds.map((userId, i) => ({
    token,
    userId,
    geo: { lat, lng, accuracyM },
    deviceFingerprint: `e2e-device-${userId}-${i}`,
  }));

  // 4) Hit tRPC mutation endpoint in parallel via HTTP batch format (single procedure call per request)
  // tRPC v11 expects /api/trpc/checkin.verifyAndRecord with POST JSON { input }
  const endpoint = "/api/test/checkin";

  const responses = await Promise.all(
    inputs.map((input) =>
      request.post(endpoint, {
        headers: { "content-type": "application/json" },
        data: { input },
      }),
    ),
  );

  // 5) Evaluate results: first should succeed, others fail with TOKEN_ALREADY_USED
  const bodies = (await Promise.all(responses.map((r) => r.json()))) as Array<
    OkBody | ErrBody
  >;

  const okCount = bodies.filter((b): b is OkBody => b.ok === true).length;
  const failures = bodies.filter((b): b is ErrBody => b.ok === false);

  expect(okCount).toBe(1);
  expect(failures.length).toBe(499);
});

test("500 attendees check in concurrently with unique tokens", async ({
  request,
}) => {
  const seedRes = await request.post("/api/test/seed");
  expect(seedRes.ok()).toBeTruthy();
  const seed = (await seedRes.json()) as SeedResponse;
  expect(seed.memberCount).toBe(500);

  // Pre-generate 500 unique tokens (unique nonce per token)
  const tokenBodies = await Promise.all(
    seed.clubIds.map(() =>
      request.post("/api/test/generate-token", {
        data: { meetingId: seed.meetingId, ttlSeconds: 180 },
      }),
    ),
  );
  for (const r of tokenBodies) expect(r.ok()).toBeTruthy();
  const tokens: { token: string }[] = await Promise.all(
    tokenBodies.map(async (r) => (await r.json()) as { token: string }),
  );

  const lat = seed.centerLat;
  const lng = seed.centerLng;
  const accuracyM = 30;

  const endpoint = "/api/test/checkin";

  const responses = await Promise.all(
    seed.clubIds.map((userId, i) => {
      const token = (tokens[i] as { token: string }).token as string;
      const input = {
        token,
        userId,
        geo: { lat, lng, accuracyM },
        deviceFingerprint: `e2e-device-${userId}-${i}`,
      };
      return request.post(endpoint, {
        headers: { "content-type": "application/json" },
        data: { input },
      });
    }),
  );

  const bodies = (await Promise.all(responses.map((r) => r.json()))) as Array<
    OkBody | ErrBody
  >;
  const okCount = bodies.filter((b): b is OkBody => b.ok === true).length;
  const failures = bodies.filter((b): b is ErrBody => b.ok === false);

  expect(okCount).toBe(500);
  expect(failures.length).toBe(0);
});

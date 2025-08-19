import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import z from "zod";
import { db } from "../db";
import {
  attendeeDirectory,
  checkin,
  meeting as meetingTable,
  usedTokenNonce,
} from "../db/schema/attendance";
import { publicProcedure, router } from "../lib/trpc";

const inputSchema = z.object({
  token: z.string().min(1),
  userId: z.string().regex(/^\d{6}$/, "User ID must be 6 digits"),
  geo: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracyM: z.number().max(2000),
  }),
});

function toRad(n: number) {
  return (n * Math.PI) / 180;
}
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getMeetingConfig(meetingId: string) {
  const [m] = await db
    .select()
    .from(meetingTable)
    .where(eq(meetingTable.id, meetingId));
  if (m) {
    return {
      centerLat: m.centerLat,
      centerLng: m.centerLng,
      radiusM: m.radiusM,
      startAt: m.startAt ? new Date(m.startAt) : undefined,
      endAt: m.endAt ? new Date(m.endAt) : undefined,
      active: m.active,
    };
  }
  // Optional env fallback for no-admin bootstrap
  const envLat = process.env.MEETING_CENTER_LAT
    ? Number(process.env.MEETING_CENTER_LAT)
    : undefined;
  const envLng = process.env.MEETING_CENTER_LNG
    ? Number(process.env.MEETING_CENTER_LNG)
    : undefined;
  const envRad = process.env.MEETING_RADIUS_M
    ? Number(process.env.MEETING_RADIUS_M)
    : undefined;
  if (envLat && envLng && envRad) {
    return {
      centerLat: envLat,
      centerLng: envLng,
      radiusM: envRad,
      active: true,
    };
  }
  throw new Error("MEETING_NOT_CONFIGURED");
}

function hashValue(v: string | undefined | null) {
  if (!v) return null;
  const salt = process.env.HASH_SALT || "salt";
  return crypto
    .createHash("sha256")
    .update(salt + v)
    .digest("hex");
}

// naive per-process rate limiter (best effort)
const ipCounts = new Map<string, { ts: number; count: number }>();
function rateLimitOk(ip: string | undefined | null, limitPerMin = 20) {
  if (!ip) return true;
  const now = Date.now();
  const rec = ipCounts.get(ip);
  if (!rec || now - rec.ts > 60_000) {
    ipCounts.set(ip, { ts: now, count: 1 });
    return true;
  }
  rec.count++;
  if (rec.count > limitPerMin) return false;
  return true;
}

export const checkinRouter = router({
  validateAndCreate: publicProcedure
    .input(inputSchema)
    .mutation(async ({ input, ctx }) => {
      let payload: any;
      try {
        payload = jwt.verify(input.token, process.env.QR_CODE_SECRET!, {
          algorithms: ["HS256"],
        });
      } catch {
        throw new Error("TOKEN_INVALID_OR_EXPIRED");
      }
      const { meetingId, kioskId, nonce, iat, exp } = payload ?? {};
      if (!meetingId || !nonce) throw new Error("TOKEN_MALFORMED");

      // iat skew bound (optional hardening)
      if (typeof iat === "number") {
        const nowS = Math.floor(Date.now() / 1000);
        if (Math.abs(nowS - iat) > 120) throw new Error("TOKEN_STALE");
      }

      const clientIp =
        (ctx.ip as string | undefined) ||
        (ctx.headers?.get?.("x-forwarded-for") as string | undefined) ||
        undefined;
      if (!rateLimitOk(clientIp)) throw new Error("RATE_LIMITED");

      const meeting = await getMeetingConfig(meetingId);
      if (!meeting.active) throw new Error("MEETING_INACTIVE");

      // Geofence check
      const { lat, lng, accuracyM } = input.geo;
      if (accuracyM > 50) throw new Error("LOCATION_INACCURATE");
      const distance = haversineMeters(
        lat,
        lng,
        meeting.centerLat,
        meeting.centerLng
      );
      if (distance > meeting.radiusM + 10) throw new Error("NOT_IN_GEOFENCE");

      // Directory validation
      const [att] = await db
        .select()
        .from(attendeeDirectory)
        .where(eq(attendeeDirectory.userId, input.userId));
      if (!att) throw new Error("UNKNOWN_USER");

      const ua =
        (ctx.userAgent as string | undefined) ||
        (ctx.headers?.get?.("user-agent") as string | undefined) ||
        "";
      const ipHash = hashValue(clientIp || "");
      const userAgentHash = hashValue(ua);

      // Single-use nonce + idempotent check-in
      try {
        await db.transaction(async (tx) => {
          await tx.insert(usedTokenNonce).values({
            nonce,
            meetingId,
            kioskId: kioskId || "unknown",
            consumedAt: new Date(),
          });
          await tx.insert(checkin).values({
            id: crypto.randomUUID(),
            meetingId,
            userId: input.userId,
            createdAt: new Date(),
            lat,
            lng,
            accuracyM,
            userAgentHash,
            ipHash,
            kioskId: kioskId || "unknown",
          });
        });
        return { status: "ok" as const };
      } catch (e: any) {
        const msg = String(e?.message || "");
        // If nonce already inserted or unique constraint on meeting+user triggers
        if (
          msg.includes("UNIQUE") ||
          msg.includes("unique") ||
          msg.includes("constraint")
        ) {
          // Distinguish already checked-in vs nonce reuse by checking existing check-in
          const existing = await db
            .select()
            .from(checkin)
            .where(
              and(
                eq(checkin.meetingId, meetingId),
                eq(checkin.userId, input.userId)
              )
            );
          if (existing.length > 0) {
            return { status: "already" as const };
          }
          throw new Error("TOKEN_ALREADY_USED");
        }
        throw e;
      }
    }),
});


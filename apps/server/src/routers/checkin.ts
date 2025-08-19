import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import z from "zod";
import { db } from "../db";
import {
  attendeeDirectory,
  checkin,
  meeting as meetingTable,
  usedDeviceFingerprint,
  usedTokenNonce,
} from "../db/schema/attendance";
import { publicProcedure, router } from "../lib/trpc";

// Error code mappings for user-friendly messages
const ERROR_MESSAGES = {
  TOKEN_INVALID_OR_EXPIRED: {
    code: "INVALID_TOKEN",
    message: "Your check-in link has expired. Please scan the QR code again.",
  },
  TOKEN_MALFORMED: {
    code: "INVALID_TOKEN",
    message: "Invalid check-in link. Please scan the QR code again.",
  },
  TOKEN_STALE: {
    code: "INVALID_TOKEN",
    message: "Your check-in link has expired. Please scan the QR code again.",
  },
  TOKEN_ALREADY_USED: {
    code: "TOKEN_USED",
    message:
      "This check-in link has already been used. Please scan a fresh QR code.",
  },
  RATE_LIMITED: {
    code: "TOO_MANY_ATTEMPTS",
    message: "Too many attempts. Please wait a moment and try again.",
  },
  MEETING_INACTIVE: {
    code: "EVENT_UNAVAILABLE",
    message: "This event is currently not available for check-in.",
  },
  MEETING_NOT_CONFIGURED: {
    code: "EVENT_UNAVAILABLE",
    message: "Event configuration error. Please contact event staff.",
  },
  LOCATION_INACCURATE: {
    code: "LOCATION_REQUIRED",
    message:
      "Unable to verify your location accurately. Please ensure location services are enabled and try again.",
  },
  NOT_IN_GEOFENCE: {
    code: "LOCATION_REQUIRED",
    message: "You must be at the event location to check in.",
  },
  UNKNOWN_USER: {
    code: "INVALID_USER",
    message: "User ID not found. Please check your ID and try again.",
  },
  DEVICE_ALREADY_USED: {
    code: "DEVICE_USED",
    message: "This device has already been used to check in to this event.",
  },
} as const;

function createUserError(errorKey: keyof typeof ERROR_MESSAGES) {
  const error = ERROR_MESSAGES[errorKey];
  const err = new Error(error.message);
  (err as any).code = error.code;
  return err;
}

const inputSchema = z.object({
  token: z.string().min(1),
  userId: z.string().regex(/^\d{6}$/, "User ID must be 6 digits"),
  geo: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracyM: z.number().max(2000),
  }),
  deviceFingerprint: z.string().min(1),
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
  throw createUserError("MEETING_NOT_CONFIGURED");
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
        throw createUserError("TOKEN_INVALID_OR_EXPIRED");
      }
      const { meetingId, kioskId, nonce, iat, exp } = payload ?? {};
      if (!meetingId || !nonce) throw createUserError("TOKEN_MALFORMED");

      // iat skew bound (optional hardening)
      if (typeof iat === "number") {
        const nowS = Math.floor(Date.now() / 1000);
        if (Math.abs(nowS - iat) > 120) throw createUserError("TOKEN_STALE");
      }

      const clientIp =
        (ctx.ip as string | undefined) ||
        (ctx.headers?.get?.("x-forwarded-for") as string | undefined) ||
        undefined;
      if (!rateLimitOk(clientIp)) throw createUserError("RATE_LIMITED");

      const meeting = await getMeetingConfig(meetingId);
      if (!meeting.active) throw createUserError("MEETING_INACTIVE");

      // Geofence check
      const { lat, lng, accuracyM } = input.geo;
      if (accuracyM > 50) throw createUserError("LOCATION_INACCURATE");
      const distance = haversineMeters(
        lat,
        lng,
        meeting.centerLat,
        meeting.centerLng
      );
      if (distance > meeting.radiusM + 10)
        throw createUserError("NOT_IN_GEOFENCE");

      // Directory validation
      const [att] = await db
        .select()
        .from(attendeeDirectory)
        .where(eq(attendeeDirectory.userId, input.userId));
      if (!att) throw createUserError("UNKNOWN_USER");

      // Check if user already checked in to this meeting
      const [existingCheckin] = await db
        .select()
        .from(checkin)
        .where(
          and(
            eq(checkin.meetingId, meetingId),
            eq(checkin.userId, input.userId)
          )
        );

      if (existingCheckin) {
        return { status: "already" as const };
      }

      // Check if device fingerprint was already used for this meeting
      const [existingDevice] = await db
        .select()
        .from(usedDeviceFingerprint)
        .where(
          and(
            eq(usedDeviceFingerprint.fingerprint, input.deviceFingerprint),
            eq(usedDeviceFingerprint.meetingId, meetingId)
          )
        );

      if (existingDevice) {
        throw createUserError("DEVICE_ALREADY_USED");
      }

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
          await tx.insert(usedDeviceFingerprint).values({
            fingerprint: input.deviceFingerprint,
            meetingId,
            userId: input.userId,
            firstUsedAt: new Date(),
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
            deviceFingerprint: input.deviceFingerprint,
          });
        });
        return { status: "ok" as const };
      } catch (e: any) {
        const msg = String(e?.message || "");
        // If nonce already inserted, token was reused
        if (
          msg.includes("UNIQUE") ||
          msg.includes("unique") ||
          msg.includes("constraint") ||
          msg.includes("SQLITE_CONSTRAINT")
        ) {
          throw createUserError("TOKEN_ALREADY_USED");
        }
        throw e;
      }
    }),
});


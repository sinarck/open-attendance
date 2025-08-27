import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";
import { db } from "../db";
import {
  attendeeDirectory,
  checkin,
  meeting as meetingTable,
  usedDeviceFingerprint,
  usedTokenNonce,
} from "../db/schema/attendance";
import { haversineMeters } from "../lib/location";
import { publicProcedure, router } from "../lib/trpc";
import { inputSchema } from "../schema/checkin";

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
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error.message,
    cause: {
      errorCode: error.code,
    },
  });
}

export const checkinRouter = router({
  validateAndCreate: publicProcedure
    .input(inputSchema)
    .mutation(async ({ input }) => {
      let payload: any;
      try {
        payload = jwt.verify(input.token, process.env.QR_CODE_SECRET!, {
          algorithms: ["HS256"],
        });
      } catch {
        throw createUserError("TOKEN_INVALID_OR_EXPIRED");
      }
      const { meetingId, kioskId, nonce, iat } = payload;

      if (!meetingId || !nonce) {
        throw createUserError("TOKEN_MALFORMED");
      }

      // iat skew bound (optional hardening)
      if (typeof iat === "number") {
        const nowS = Math.floor(Date.now() / 1000);

        if (Math.abs(nowS - iat) > CONFIG.tokens.iatSkewSeconds)
          throw createUserError("TOKEN_STALE");
      }

      const [meeting] = await db
        .select()
        .from(meetingTable)
        .where(eq(meetingTable.id, meetingId));

      if (!meeting.active) {
        throw createUserError("MEETING_INACTIVE");
      }

      // Geofence check
      const { lat, lng, accuracyM } = input.geo;
      if (accuracyM > CONFIG.geofence.maxAccuracyMeters) {
        throw createUserError("LOCATION_INACCURATE");
      }

      const distance = haversineMeters(
        lat,
        lng,
        meeting.centerLat,
        meeting.centerLng
      );

      if (distance > meeting.radiusM + CONFIG.geofence.radiusBufferMeters) {
        throw createUserError("NOT_IN_GEOFENCE");
      }

      // Directory validation
      const [att] = await db
        .select()
        .from(attendeeDirectory)
        .where(eq(attendeeDirectory.userId, input.userId));

      if (!att) {
        throw createUserError("UNKNOWN_USER");
      }

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
        return {
          status: "already",
        };
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
            kioskId: kioskId || "unknown",
            deviceFingerprint: input.deviceFingerprint,
          });
        });

        return {
          status: "ok",
        };
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


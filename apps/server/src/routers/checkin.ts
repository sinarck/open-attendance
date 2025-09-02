import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/index.js";
import { db } from "../db/index.js";
import {
  attendeeDirectory,
  checkin,
  meeting as meetingTable,
  usedDeviceFingerprint,
  usedTokenNonce,
} from "../db/schema/attendance.js";
import { createUserError } from "../lib/error.js";
import { haversineMeters } from "../lib/location.js";
import { publicProcedure, router } from "../lib/trpc.js";
import { inputSchema } from "../schema/checkin.js";

export const checkinRouter = router({
  validateAndCreate: publicProcedure
    .input(inputSchema.assert)
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
        throw createUserError("ALREADY_CHECKED_IN");
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
          attendee: {
            userId: input.userId,
            name: att.name,
          },
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


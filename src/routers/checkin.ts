import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import db from "@/db";
import {
  attendance,
  meetings,
  members,
  usedDeviceFingerprint,
  usedTokenNonce,
} from "@/db/schema/schema";
import { createTRPCRouter, fail, publicProcedure } from "@/trpc/init";

const haversineMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000; // meters
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
};

export const checkinRouter = createTRPCRouter({
  verifyAndRecord: publicProcedure
    .input((val) => {
      type Input = {
        token: string;
        userId: string;
        deviceFingerprint: string;
        geo: { lat: number; lng: number; accuracyM: number };
      };
      const v = val as Partial<Input> | null | undefined;
      if (
        !v ||
        typeof v.token !== "string" ||
        typeof v.userId !== "string" ||
        typeof v.deviceFingerprint !== "string" ||
        !v.geo ||
        typeof v.geo.lat !== "number" ||
        typeof v.geo.lng !== "number" ||
        typeof v.geo.accuracyM !== "number"
      ) {
        fail("BAD_REQUEST", "BAD_REQUEST", "Invalid input. Try again.");
      }
      return v as Input;
    })
    .mutation(async ({ input }) => {
      let payload: {
        meetingId?: number | string;
        kioskId?: string;
        nonce?: string;
        jti?: string;
        iat?: number;
      } | null = null;

      try {
        payload = jwt.verify(input.token, process.env.QR_CODE_SECRET ?? "", {
          algorithms: ["HS256"],
        }) as {
          meetingId?: number | string;
          kioskId?: string;
          nonce?: string;
          jti?: string;
          iat?: number;
        };
      } catch {
        fail(
          "UNAUTHORIZED",
          "TOKEN_INVALID_OR_EXPIRED",
          "Token invalid or expired. Please scan the QR code again.",
        );
      }

      const raw = payload ?? {};
      const meetingIdStr =
        typeof raw.meetingId === "string" ? raw.meetingId : undefined;
      const meetingIdNum =
        typeof raw.meetingId === "number"
          ? raw.meetingId
          : meetingIdStr && /^\d+$/.test(meetingIdStr)
            ? Number(meetingIdStr)
            : undefined;
      const nonce =
        typeof raw.nonce === "string"
          ? raw.nonce
          : typeof raw.jti === "string"
            ? raw.jti
            : undefined;
      const kioskId = raw.kioskId;
      const _iat = raw.iat;
      if (meetingIdNum === undefined || !nonce)
        fail(
          "BAD_REQUEST",
          "TOKEN_MALFORMED",
          "Token malformed. Please scan the QR code again.",
        );

      // Skew checks removed; rely on exp verification from JWT

      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingIdNum));
      if (!meeting || !meeting.active)
        fail("BAD_REQUEST", "MEETING_INACTIVE", "Meeting not in progress.");

      // Geo checks
      const { lat, lng, accuracyM } = input.geo;
      if (accuracyM > 100 + 10)
        fail(
          "BAD_REQUEST",
          "LOCATION_INACCURATE",
          "Location accuracy too low.",
        );

      const distance = haversineMeters(
        lat,
        lng,
        meeting.centerLat,
        meeting.centerLng,
      );
      if (distance > meeting.radiusM + 10)
        fail("BAD_REQUEST", "NOT_IN_GEOFENCE", "Not at meeting location.");

      // Directory validation
      const [att] = await db
        .select()
        .from(members)
        .where(eq(members.clubId, input.userId));
      if (!att && meeting.strict)
        fail(
          "BAD_REQUEST",
          "UNKNOWN_USER",
          "User ID not a member of this chapter.",
        );

      // Check duplicates
      const [existing] = await db
        .select()
        .from(attendance)
        .where(
          and(
            eq(attendance.meetingId, meetingIdNum),
            eq(attendance.memberId, att?.id ?? -1),
          ),
        );
      if (existing)
        fail(
          "BAD_REQUEST",
          "ALREADY_CHECKED_IN",
          "You've already checked in to this meeting.",
        );

      const [existingDevice] = await db
        .select()
        .from(usedDeviceFingerprint)
        .where(
          and(
            eq(usedDeviceFingerprint.fingerprint, input.deviceFingerprint),
            eq(usedDeviceFingerprint.meetingId, meetingIdNum),
          ),
        );
      if (existingDevice)
        fail(
          "BAD_REQUEST",
          "DEVICE_ALREADY_USED",
          "Device already used to check in to this meeting.",
        );

      try {
        await db.transaction(async (tx) => {
          await tx.insert(usedTokenNonce).values({
            nonce,
            meetingId: meetingIdNum,
            kioskId: kioskId || "unknown",
            consumedAt: new Date(),
          });

          await tx.insert(usedDeviceFingerprint).values({
            fingerprint: input.deviceFingerprint,
            meetingId: meetingIdNum,
            memberId: att?.id ?? null,
            firstUsedAt: new Date(),
          });

          if (att) {
            await tx.insert(attendance).values({
              meetingId: meetingIdNum,
              memberId: att.id,
              checkInAt: new Date(),
              checkInLat: lat,
              checkInLng: lng,
              distanceM: distance,
              method: "geo",
              status: "present",
              notes: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      } catch (e) {
        const msg = String((e as Error)?.message ?? "");
        if (msg.includes("UNIQUE") || msg.includes("constraint"))
          fail(
            "CONFLICT",
            "TOKEN_ALREADY_USED",
            "Scanned QR code already used. Try again.",
          );
        throw e;
      }

      return {
        status: "ok" as const,
        attendee: { userId: input.userId, name: att?.name ?? null },
      };
    }),
  verifyAndRecordChromebook: publicProcedure
    .input((val) => {
      type Input = {
        token: string;
        userId: string;
        deviceFingerprint: string;
      };
      const v = val as Partial<Input> | null | undefined;
      if (
        !v ||
        typeof v.token !== "string" ||
        typeof v.userId !== "string" ||
        typeof v.deviceFingerprint !== "string"
      ) {
        fail("BAD_REQUEST", "BAD_REQUEST", "Invalid input. Try again.");
      }
      return v as Input;
    })
    .mutation(async ({ input, ctx }) => {
      const allowBypass =
        (process.env.ALLOW_CHROMEBOOK_BYPASS || "").toLowerCase() === "true";
      if (!allowBypass)
        fail("UNAUTHORIZED", "UNAUTHORIZED", "Chromebook bypass is disabled.");

      const ua = ctx.headers.get("user-agent") || "";
      const isChromeOS = /CrOS/i.test(ua);
      if (!isChromeOS)
        fail(
          "UNAUTHORIZED",
          "UNAUTHORIZED",
          "Chromebook bypass allowed only on ChromeOS.",
        );

      let payload: {
        meetingId?: number | string;
        kioskId?: string;
        nonce?: string;
        jti?: string;
        iat?: number;
      } | null = null;

      try {
        payload = jwt.verify(input.token, process.env.QR_CODE_SECRET ?? "", {
          algorithms: ["HS256"],
        }) as {
          meetingId?: number | string;
          kioskId?: string;
          nonce?: string;
          jti?: string;
          iat?: number;
        };
      } catch {
        fail(
          "UNAUTHORIZED",
          "TOKEN_INVALID_OR_EXPIRED",
          "Token invalid or expired. Please scan the QR code again.",
        );
      }

      const raw = payload ?? {};
      const meetingIdStr =
        typeof raw.meetingId === "string" ? raw.meetingId : undefined;
      const meetingIdNum =
        typeof raw.meetingId === "number"
          ? raw.meetingId
          : meetingIdStr && /^\d+$/.test(meetingIdStr)
            ? Number(meetingIdStr)
            : undefined;
      const nonce =
        typeof raw.nonce === "string"
          ? raw.nonce
          : typeof raw.jti === "string"
            ? raw.jti
            : undefined;
      const kioskId = raw.kioskId;
      const _iat = raw.iat;

      if (meetingIdNum === undefined || !nonce)
        fail(
          "BAD_REQUEST",
          "TOKEN_MALFORMED",
          "Token malformed. Please scan the QR code again.",
        );

      if (!kioskId)
        fail("BAD_REQUEST", "TOKEN_MALFORMED", "Token missing kiosk id.");

      const [meeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, meetingIdNum));
      if (!meeting || !meeting.active)
        fail("BAD_REQUEST", "MEETING_INACTIVE", "Meeting not in progress.");

      // Directory validation
      const [att] = await db
        .select()
        .from(members)
        .where(eq(members.clubId, input.userId));
      if (!att && meeting.strict)
        fail(
          "BAD_REQUEST",
          "UNKNOWN_USER",
          "User ID not a member of this chapter.",
        );

      // Member duplicate check (preempt unique constraint)
      if (att) {
        const [existingAttendance] = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.meetingId, meetingIdNum),
              eq(attendance.memberId, att.id),
            ),
          );
        if (existingAttendance)
          fail(
            "BAD_REQUEST",
            "ALREADY_CHECKED_IN",
            "You've already checked in to this meeting.",
          );
      }

      // Check duplicates for device
      const [existingDevice] = await db
        .select()
        .from(usedDeviceFingerprint)
        .where(
          and(
            eq(usedDeviceFingerprint.fingerprint, input.deviceFingerprint),
            eq(usedDeviceFingerprint.meetingId, meetingIdNum),
          ),
        );
      if (existingDevice)
        fail(
          "BAD_REQUEST",
          "DEVICE_ALREADY_USED",
          "Device already used to check in to this meeting.",
        );

      try {
        await db.transaction(async (tx) => {
          await tx.insert(usedTokenNonce).values({
            nonce,
            meetingId: meetingIdNum,
            kioskId: kioskId || "unknown",
            consumedAt: new Date(),
          });

          await tx.insert(usedDeviceFingerprint).values({
            fingerprint: input.deviceFingerprint,
            meetingId: meetingIdNum,
            memberId: att?.id ?? null,
            firstUsedAt: new Date(),
          });

          if (att) {
            await tx.insert(attendance).values({
              meetingId: meetingIdNum,
              memberId: att.id,
              checkInAt: new Date(),
              checkInLat: null,
              checkInLng: null,
              distanceM: null,
              method: "override",
              status: "present",
              notes: "Chromebook bypass",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      } catch (e) {
        const msg = String((e as Error)?.message ?? "");
        if (msg) {
          const lower = msg.toLowerCase();
          if (lower.includes("attendance")) {
            fail(
              "BAD_REQUEST",
              "ALREADY_CHECKED_IN",
              "You've already checked in to this meeting.",
            );
          }
          if (
            lower.includes("used_device_fingerprint") ||
            lower.includes("uniq_fingerprint_per_meeting")
          ) {
            fail(
              "BAD_REQUEST",
              "DEVICE_ALREADY_USED",
              "Device already used to check in to this meeting.",
            );
          }
          if (
            lower.includes("used_token_nonce") ||
            lower.includes("nonce") ||
            lower.includes("token_nonce")
          ) {
            fail(
              "CONFLICT",
              "TOKEN_ALREADY_USED",
              "Scanned QR code already used. Try again.",
            );
          }
        }
        throw e;
      }

      return {
        status: "ok" as const,
        attendee: { userId: input.userId, name: att?.name ?? null },
      };
    }),
});

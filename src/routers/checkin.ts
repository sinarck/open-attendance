import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import z from "zod";
import db from "@/db";
import {
  attendance,
  meetings,
  members,
  usedDeviceFingerprint,
} from "@/db/schema/schema";
import { createTRPCRouter, fail, publicProcedure } from "@/trpc/init";
import type {
  VerifyAndRecordChromebookInput,
  VerifyAndRecordChromebookOutput,
  VerifyAndRecordInput,
  VerifyAndRecordOutput,
} from "@/types/trpc";
import { haversineMeters } from "@/utils/location";

const verifyAndRecordInputSchema = z.object({
  token: z.string(),
  userId: z.string(),
  deviceFingerprint: z.string(),
  geo: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracyM: z.number(),
  }),
}) as z.ZodType<VerifyAndRecordInput>;

const verifyAndRecordChromebookInputSchema = z.object({
  token: z.string(),
  userId: z.string(),
  deviceFingerprint: z.string(),
}) as z.ZodType<VerifyAndRecordChromebookInput>;

const jwtPayloadSchema = z.object({
  meetingId: z
    .union([z.number(), z.string().regex(/^\d+$/)])
    .transform((val) => (typeof val === "number" ? val : Number(val))),
  kioskId: z.string().optional(),
  iat: z.number().optional(),
});

export const checkinRouter = createTRPCRouter({
  verifyAndRecord: publicProcedure
    .input(verifyAndRecordInputSchema)
    .mutation(async ({ input }): Promise<VerifyAndRecordOutput> => {
      let rawPayload: unknown;

      try {
        rawPayload = jwt.verify(input.token, process.env.QR_CODE_SECRET ?? "", {
          algorithms: ["HS256"],
        });
      } catch {
        fail(
          "UNAUTHORIZED",
          "TOKEN_INVALID_OR_EXPIRED",
          "Token invalid or expired. Please scan the QR code again.",
        );
      }

      const parseResult = jwtPayloadSchema.safeParse(rawPayload);
      if (!parseResult.success) {
        fail(
          "BAD_REQUEST",
          "TOKEN_MALFORMED",
          "Token malformed. Please scan the QR code again.",
        );
      }

      const { meetingId: meetingIdNum } = parseResult.data;

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
            "DEVICE_ALREADY_USED",
            "Device already used to check in. Try again.",
          );
        throw e;
      }

      return {
        status: "ok",
        attendee: { userId: input.userId, name: att?.name ?? null },
      };
    }),
  verifyAndRecordChromebook: publicProcedure
    .input(verifyAndRecordChromebookInputSchema)
    .mutation(
      async ({ input, ctx }): Promise<VerifyAndRecordChromebookOutput> => {
        const allowBypass =
          (process.env.ALLOW_CHROMEBOOK_BYPASS || "").toLowerCase() === "true";
        if (!allowBypass)
          fail(
            "UNAUTHORIZED",
            "UNAUTHORIZED",
            "Chromebook bypass is disabled.",
          );

        const ua = ctx.headers.get("user-agent") || "";
        const isChromeOS = /CrOS/i.test(ua);
        if (!isChromeOS)
          fail(
            "UNAUTHORIZED",
            "UNAUTHORIZED",
            "Chromebook bypass allowed only on ChromeOS.",
          );

        let rawPayload: unknown;

        try {
          rawPayload = jwt.verify(
            input.token,
            process.env.QR_CODE_SECRET ?? "",
            {
              algorithms: ["HS256"],
            },
          );
        } catch {
          fail(
            "UNAUTHORIZED",
            "TOKEN_INVALID_OR_EXPIRED",
            "Token invalid or expired. Please scan the QR code again.",
          );
        }

        const parseResult = jwtPayloadSchema.safeParse(rawPayload);
        if (!parseResult.success) {
          fail(
            "BAD_REQUEST",
            "TOKEN_MALFORMED",
            "Token malformed. Please scan the QR code again.",
          );
        }

        const { meetingId: meetingIdNum, kioskId } = parseResult.data;
        if (!kioskId) {
          fail("BAD_REQUEST", "TOKEN_MALFORMED", "Token missing kiosk id.");
        }

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
          }
          throw e;
        }

        return {
          status: "ok",
          attendee: { userId: input.userId, name: att?.name ?? null },
        };
      },
    ),
});

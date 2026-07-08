import { v } from "convex/values";
import { isAfter, isBefore, isEqual } from "date-fns";
import type { Id } from "./_generated/dataModel";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import {
  normalizeMeetingName,
  normalizeMeetingOptionalText,
  normalizeMeetingTags,
} from "./lib/validation";

/**
 * Meeting mutations and queries for authenticated organization admins.
 *
 * @remarks
 * Meetings own the public self check-in lifecycle. Creating or updating a
 * meeting configures the future check-in rules, while activation controls when
 * the public endpoint in `convex/attendance.ts` will accept records.
 */
const geofenceValidator = v.object({
  latitude: v.number(),
  longitude: v.number(),
  radiusM: v.number(),
});

const meetingErrorMessages = {
  end_time_not_after_start_time: "End time must be after start time",
  invalid_late_after: "Late-after cutoff must be between start time and end time",
  invalid_geofence_radius: "Geofence radius must be a positive number",
  meeting_not_found: "Meeting not found",
} as const;

type MeetingErrorCode = keyof typeof meetingErrorMessages;
type MeetingMutationResult =
  | { ok: true; id: Id<"meetings"> }
  | { ok: false; code: MeetingErrorCode; message: string };

function meetingError(code: MeetingErrorCode) {
  return { ok: false, code, message: meetingErrorMessages[code] } as const;
}

/**
 * Validates `startTime < lateAfter <= endTime`.
 *
 * @remarks
 * `lateAfter` defaults to `endTime`, which means "no late window" rather than
 * "late immediately". This helper keeps that rule consistent across create and
 * update mutations.
 */
function assertValidTimeWindow(startTime: number, endTime: number, lateAfter: number) {
  if (isBefore(endTime, startTime) || isEqual(endTime, startTime)) {
    return meetingError("end_time_not_after_start_time");
  }
  if (isBefore(lateAfter, startTime) || isAfter(lateAfter, endTime)) {
    return meetingError("invalid_late_after");
  }

  return null;
}

function assertValidGeofence(
  geofence: { latitude: number; longitude: number; radiusM: number } | undefined,
) {
  if (geofence !== undefined && geofence.radiusM <= 0) {
    return meetingError("invalid_geofence_radius");
  }

  return null;
}

/**
 * Lists meetings for the caller's organization in reverse chronological order.
 */
export const list = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("meetings")
      .withIndex("by_org", (q) => q.eq("organizationId", ctx.organizationId))
      .order("desc")
      .collect();
  },
});

/**
 * Creates a meeting owned by the caller's organization.
 *
 * @remarks
 * New meetings start inactive. Opening check-in is a separate explicit action
 * so drafting or editing a meeting never accidentally exposes a live code.
 */
export const create = authedMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    tags: v.optional(v.array(v.string())),
    lateAfter: v.optional(v.number()),
    geofence: v.optional(geofenceValidator),
    requireFingerprint: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<MeetingMutationResult> => {
    const name = normalizeMeetingName(args.name);
    const description =
      args.description === undefined ? undefined : normalizeMeetingOptionalText(args.description);
    const location =
      args.location === undefined ? undefined : normalizeMeetingOptionalText(args.location);
    const tags = normalizeMeetingTags(args.tags);

    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });
    const lateAfter = args.lateAfter ?? args.endTime;

    const timeWindowError = assertValidTimeWindow(args.startTime, args.endTime, lateAfter);
    if (timeWindowError) return timeWindowError;

    const geofenceError = assertValidGeofence(args.geofence);
    if (geofenceError) return geofenceError;

    return {
      ok: true,
      id: await ctx.db.insert("meetings", {
        organizationId: ctx.organizationId,
        name,
        startTime: args.startTime,
        endTime: args.endTime,
        lateAfter,
        checkInCode: crypto.randomUUID(),
        isActive: false,
        requireFingerprint: args.requireFingerprint ?? false,
        ...(description === undefined ? {} : { description }),
        ...(location === undefined ? {} : { location }),
        ...(tags === undefined ? {} : { tags }),
        ...(args.geofence === undefined ? {} : { geofence: args.geofence }),
      }),
    };
  },
});

/**
 * Updates mutable meeting fields without changing tenant ownership or the
 * existing check-in code.
 *
 * @remarks
 * `checkInCode` and `organizationId` stay stable here on purpose. Code rotation
 * happens only through `activate({ regenerateCode: true })`, which keeps the
 * operational meaning of "open check-in" and "change the code" in one place.
 */
export const update = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    lateAfter: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    geofence: v.optional(v.union(geofenceValidator, v.null())),
    requireFingerprint: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<MeetingMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", args.meetingId);
    if (!meeting) return meetingError("meeting_not_found");

    const name = args.name === undefined ? meeting.name : normalizeMeetingName(args.name);
    const description =
      args.description === undefined
        ? meeting.description
        : normalizeMeetingOptionalText(args.description);
    const location =
      args.location === undefined ? meeting.location : normalizeMeetingOptionalText(args.location);
    const tags = args.tags === undefined ? meeting.tags : normalizeMeetingTags(args.tags);
    const geofence = args.geofence === undefined ? meeting.geofence : (args.geofence ?? undefined);
    const startTime = args.startTime ?? meeting.startTime;
    const endTime = args.endTime ?? meeting.endTime;
    const lateAfter = args.lateAfter ?? meeting.lateAfter;
    const requireFingerprint = args.requireFingerprint ?? meeting.requireFingerprint;

    if (
      args.startTime !== undefined ||
      args.endTime !== undefined ||
      args.lateAfter !== undefined
    ) {
      const timeWindowError = assertValidTimeWindow(startTime, endTime, lateAfter);
      if (timeWindowError) return timeWindowError;
    }

    if (args.geofence !== undefined) {
      const geofenceError = assertValidGeofence(geofence);
      if (geofenceError) return geofenceError;
    }

    await ctx.db.replace("meetings", args.meetingId, {
      organizationId: meeting.organizationId,
      name,
      startTime,
      endTime,
      lateAfter,
      checkInCode: meeting.checkInCode,
      isActive: meeting.isActive,
      requireFingerprint,
      ...(description === undefined ? {} : { description }),
      ...(location === undefined ? {} : { location }),
      ...(tags === undefined ? {} : { tags }),
      ...(geofence === undefined ? {} : { geofence }),
    });
    return { ok: true, id: args.meetingId };
  },
});

/**
 * Opens check-in for a meeting, optionally rotating the public check-in code.
 */
export const activate = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    regenerateCode: v.optional(v.boolean()),
  },
  handler: async (ctx, { meetingId, regenerateCode }): Promise<MeetingMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) return meetingError("meeting_not_found");
    if (meeting.isActive && !regenerateCode) {
      return { ok: true, id: meetingId };
    }

    const activationUpdate: { isActive: boolean; checkInCode?: string } = {
      isActive: true,
    };
    if (regenerateCode) {
      activationUpdate.checkInCode = crypto.randomUUID();
    }

    await ctx.db.patch("meetings", meetingId, activationUpdate);
    return { ok: true, id: meetingId };
  },
});

/**
 * Closes check-in for a meeting without changing any other meeting data.
 */
export const deactivate = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }): Promise<MeetingMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) return meetingError("meeting_not_found");
    if (!meeting.isActive) {
      return { ok: true, id: meetingId };
    }
    await ctx.db.patch("meetings", meetingId, { isActive: false });
    return { ok: true, id: meetingId };
  },
});

/**
 * Permanently deletes a meeting and its attendance records.
 *
 * @remarks
 * Attendance records are removed manually first so we do not leave orphaned
 * rows behind. This is one of the few places where the relationship is cleaned
 * up explicitly instead of relying on a database-level cascade.
 */
export const remove = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }): Promise<MeetingMutationResult> => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) return meetingError("meeting_not_found");

    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_meeting", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("meetingId", meetingId),
      )
      .collect();

    for (const record of records) {
      await ctx.db.delete("attendanceRecords", record._id);
    }

    await ctx.db.delete("meetings", meetingId);
    return { ok: true, id: meetingId };
  },
});

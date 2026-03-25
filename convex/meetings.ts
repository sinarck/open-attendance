import { ConvexError, v } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { isAfter, isBefore, isEqual } from "date-fns";
import { authedMutation, authedQuery, zAuthedMutation } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { z } from "zod";
import {
  meetingNameSchema,
  meetingOptionalTextSchema,
  meetingTagsSchema,
} from "../lib/validation/convex";

/** Validates startTime < lateAfter <= endTime. */
function validateTimeWindow(startTime: number, endTime: number, lateAfter: number) {
  if (isBefore(endTime, startTime) || isEqual(endTime, startTime)) {
    throw new ConvexError("End time must be after start time");
  }
  if (isBefore(lateAfter, startTime) || isAfter(lateAfter, endTime)) {
    throw new ConvexError("Late-after cutoff must be between start time and end time");
  }
}

/** Requires all 3 geo-fence fields or none, and radius > 0. */
function validateGeoFence(
  latitude: number | undefined,
  longitude: number | undefined,
  radiusM: number | undefined,
) {
  const geoFields = [latitude, longitude, radiusM];
  const geoProvided = geoFields.filter((f) => f !== undefined).length;
  if (geoProvided !== 0 && geoProvided !== 3) {
    throw new ConvexError("Geo-fence requires all three fields: latitude, longitude, and radius");
  }
  if (radiusM !== undefined && radiusM <= 0) {
    throw new ConvexError("Geo-fence radius must be a positive number");
  }
}

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

export const listActive = authedQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("meetings")
      .withIndex("by_org_active", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("isActive", true),
      )
      .collect();
  },
});

export const get = authedQuery({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    return ctx.db.get("meetings", meetingId);
  },
});

/** lateAfter defaults to endTime (no one marked late). */
export const create = zAuthedMutation({
  args: {
    name: meetingNameSchema,
    description: meetingOptionalTextSchema,
    location: meetingOptionalTextSchema,
    startTime: z.number(),
    endTime: z.number(),
    tags: meetingTagsSchema,
    lateAfter: z.number().optional(),
    geoFenceLatitude: z.number().optional(),
    geoFenceLongitude: z.number().optional(),
    geoFenceRadiusM: z.number().optional(),
    requireFingerprint: z.boolean().optional(),
  },
  handler: async (ctx, args) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });
    const lateAfter = args.lateAfter ?? args.endTime;

    validateTimeWindow(args.startTime, args.endTime, lateAfter);
    validateGeoFence(args.geoFenceLatitude, args.geoFenceLongitude, args.geoFenceRadiusM);

    return ctx.db.insert("meetings", {
      organizationId: ctx.organizationId,
      name: args.name,
      description: args.description,
      location: args.location,
      startTime: args.startTime,
      endTime: args.endTime,
      lateAfter,
      checkInCode: crypto.randomUUID(),
      isActive: false,
      tags: args.tags,
      geoFenceLatitude: args.geoFenceLatitude,
      geoFenceLongitude: args.geoFenceLongitude,
      geoFenceRadiusM: args.geoFenceRadiusM,
      requireFingerprint: args.requireFingerprint ?? false,
    });
  },
});

/** Cannot change checkInCode or organizationId. */
export const update = zAuthedMutation({
  args: {
    meetingId: zid("meetings"),
    name: meetingNameSchema.optional(),
    description: meetingOptionalTextSchema,
    location: meetingOptionalTextSchema,
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    lateAfter: z.number().optional(),
    tags: meetingTagsSchema,
    geoFenceLatitude: z.number().optional(),
    geoFenceLongitude: z.number().optional(),
    geoFenceRadiusM: z.number().optional(),
    requireFingerprint: z.boolean().optional(),
  },
  handler: async (ctx, { meetingId, ...patch }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

    // Merge with existing values so partial updates stay consistent.
    const effectiveStart = patch.startTime ?? meeting.startTime;
    const effectiveEnd = patch.endTime ?? meeting.endTime;
    const effectiveLateAfter = patch.lateAfter ?? meeting.lateAfter;
    if (
      patch.startTime !== undefined ||
      patch.endTime !== undefined ||
      patch.lateAfter !== undefined
    ) {
      validateTimeWindow(effectiveStart, effectiveEnd, effectiveLateAfter);
    }

    const effectiveLat = patch.geoFenceLatitude ?? meeting.geoFenceLatitude;
    const effectiveLng = patch.geoFenceLongitude ?? meeting.geoFenceLongitude;
    const effectiveRad = patch.geoFenceRadiusM ?? meeting.geoFenceRadiusM;
    if (
      patch.geoFenceLatitude !== undefined ||
      patch.geoFenceLongitude !== undefined ||
      patch.geoFenceRadiusM !== undefined
    ) {
      validateGeoFence(effectiveLat, effectiveLng, effectiveRad);
    }

    await ctx.db.patch("meetings", meetingId, patch);
  },
});

/** Optionally regenerates the check-in code when opening check-ins. */
export const activate = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    regenerateCode: v.optional(v.boolean()),
  },
  handler: async (ctx, { meetingId, regenerateCode }) => {
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");
    if (meeting.isActive && !regenerateCode) {
      return meetingId;
    }

    const patch: { isActive: boolean; checkInCode?: string } = {
      isActive: true,
    };
    if (regenerateCode) {
      patch.checkInCode = crypto.randomUUID();
    }

    await ctx.db.patch("meetings", meetingId, patch);
    return meetingId;
  },
});

export const deactivate = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");
    if (!meeting.isActive) {
      return meetingId;
    }
    await ctx.db.patch("meetings", meetingId, { isActive: false });
    return meetingId;
  },
});

/** Permanently deletes a meeting and all its attendance records. */
export const remove = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

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
  },
});

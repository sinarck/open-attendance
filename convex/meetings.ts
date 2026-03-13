import { ConvexError, v } from "convex/values";
import { isAfter, isBefore, isEqual } from "date-fns";
import { authedMutation, authedQuery } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";

/** Validates startTime < lateAfter <= endTime. */
function validateTimeWindow(
  startTime: number,
  endTime: number,
  lateAfter: number,
) {
  if (isBefore(endTime, startTime) || isEqual(endTime, startTime)) {
    throw new ConvexError("End time must be after start time");
  }
  if (isBefore(lateAfter, startTime) || isAfter(lateAfter, endTime)) {
    throw new ConvexError(
      "Late-after cutoff must be between start time and end time",
    );
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
    throw new ConvexError(
      "Geo-fence requires all three fields: latitude, longitude, and radius",
    );
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
    return ctx.db.get(meetingId);
  },
});

/** lateAfter defaults to endTime (no one marked late). */
export const create = authedMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    tags: v.optional(v.array(v.string())),
    lateAfter: v.optional(v.number()),
    geoFenceLatitude: v.optional(v.number()),
    geoFenceLongitude: v.optional(v.number()),
    geoFenceRadiusM: v.optional(v.number()),
    requireFingerprint: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const lateAfter = args.lateAfter ?? args.endTime;

    validateTimeWindow(args.startTime, args.endTime, lateAfter);
    validateGeoFence(
      args.geoFenceLatitude,
      args.geoFenceLongitude,
      args.geoFenceRadiusM,
    );

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
    geoFenceLatitude: v.optional(v.number()),
    geoFenceLongitude: v.optional(v.number()),
    geoFenceRadiusM: v.optional(v.number()),
    requireFingerprint: v.optional(v.boolean()),
  },
  handler: async (ctx, { meetingId, ...updates }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

    // Merge with existing values so partial updates stay consistent.
    const effectiveStart = updates.startTime ?? meeting.startTime;
    const effectiveEnd = updates.endTime ?? meeting.endTime;
    const effectiveLateAfter = updates.lateAfter ?? meeting.lateAfter;
    if (
      updates.startTime !== undefined ||
      updates.endTime !== undefined ||
      updates.lateAfter !== undefined
    ) {
      validateTimeWindow(effectiveStart, effectiveEnd, effectiveLateAfter);
    }

    const effectiveLat = updates.geoFenceLatitude ?? meeting.geoFenceLatitude;
    const effectiveLng = updates.geoFenceLongitude ?? meeting.geoFenceLongitude;
    const effectiveRad = updates.geoFenceRadiusM ?? meeting.geoFenceRadiusM;
    if (
      updates.geoFenceLatitude !== undefined ||
      updates.geoFenceLongitude !== undefined ||
      updates.geoFenceRadiusM !== undefined
    ) {
      validateGeoFence(effectiveLat, effectiveLng, effectiveRad);
    }

    await ctx.db.patch(meetingId, updates);
  },
});

/** Optionally regenerates the check-in code when opening check-ins. */
export const activate = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    regenerateCode: v.optional(v.boolean()),
  },
  handler: async (ctx, { meetingId, regenerateCode }) => {
    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

    const patch: { isActive: boolean; checkInCode?: string } = {
      isActive: true,
    };
    if (regenerateCode) {
      patch.checkInCode = crypto.randomUUID();
    }

    await ctx.db.patch(meetingId, patch);
  },
});

export const deactivate = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");
    await ctx.db.patch(meetingId, { isActive: false });
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

    const meeting = await ctx.db.get(meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_org_meeting", (q) =>
        q.eq("organizationId", ctx.organizationId).eq("meetingId", meetingId),
      )
      .collect();

    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    await ctx.db.delete(meetingId);
  },
});

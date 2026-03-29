import { ConvexError, v } from "convex/values";
import { zid } from "convex-helpers/server/zod4";
import { isAfter, isBefore, isEqual } from "date-fns";
import { authedMutation, authedQuery, zAuthedMutation } from "./lib/auth";
import { rateLimit } from "./lib/rateLimits";
import { z } from "zod";
import {
  meetingGeofenceSchema,
  meetingGeofenceUpdateSchema,
  meetingNameSchema,
  meetingOptionalTextSchema,
  meetingTagsSchema,
} from "./lib/validation";

/** Validates startTime < lateAfter <= endTime. */
function assertValidTimeWindow(startTime: number, endTime: number, lateAfter: number) {
  if (isBefore(endTime, startTime) || isEqual(endTime, startTime)) {
    throw new ConvexError("End time must be after start time");
  }
  if (isBefore(lateAfter, startTime) || isAfter(lateAfter, endTime)) {
    throw new ConvexError("Late-after cutoff must be between start time and end time");
  }
}

function assertValidGeofence(
  geofence: { latitude: number; longitude: number; radiusM: number } | undefined,
) {
  if (geofence !== undefined && geofence.radiusM <= 0) {
    throw new ConvexError("Geofence radius must be a positive number");
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
    geofence: meetingGeofenceSchema,
    requireFingerprint: z.boolean().optional(),
  },
  handler: async (ctx, args) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });
    const lateAfter = args.lateAfter ?? args.endTime;

    assertValidTimeWindow(args.startTime, args.endTime, lateAfter);
    assertValidGeofence(args.geofence);

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
      geofence: args.geofence,
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
    geofence: meetingGeofenceUpdateSchema,
    requireFingerprint: z.boolean().optional(),
  },
  handler: async (ctx, { meetingId, ...meetingChanges }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");

    // Merge with existing values so partial updates stay consistent.
    const effectiveStartTime = meetingChanges.startTime ?? meeting.startTime;
    const effectiveEndTime = meetingChanges.endTime ?? meeting.endTime;
    const effectiveLateAfter = meetingChanges.lateAfter ?? meeting.lateAfter;
    if (
      meetingChanges.startTime !== undefined ||
      meetingChanges.endTime !== undefined ||
      meetingChanges.lateAfter !== undefined
    ) {
      assertValidTimeWindow(effectiveStartTime, effectiveEndTime, effectiveLateAfter);
    }

    if (meetingChanges.geofence !== undefined) {
      assertValidGeofence(meetingChanges.geofence ?? undefined);
    }

    const { geofence, ...otherMeetingChanges } = meetingChanges;

    if (geofence === null) {
      const { _creationTime, _id, geofence: _storedGeofence, ...storedMeeting } = meeting;
      await ctx.db.replace("meetings", meetingId, {
        ...storedMeeting,
        ...otherMeetingChanges,
      });
      return;
    }

    if (geofence !== undefined) {
      await ctx.db.patch("meetings", meetingId, {
        ...otherMeetingChanges,
        geofence,
      });
      return;
    }

    if (Object.keys(otherMeetingChanges).length > 0) {
      await ctx.db.patch("meetings", meetingId, otherMeetingChanges);
    }
  },
});

/** Optionally regenerates the check-in code when opening check-ins. */
export const activate = authedMutation({
  args: {
    meetingId: v.id("meetings"),
    regenerateCode: v.optional(v.boolean()),
  },
  handler: async (ctx, { meetingId, regenerateCode }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

    const meeting = await ctx.db.get("meetings", meetingId);
    if (!meeting) throw new ConvexError("Meeting not found");
    if (meeting.isActive && !regenerateCode) {
      return meetingId;
    }

    const activationUpdate: { isActive: boolean; checkInCode?: string } = {
      isActive: true,
    };
    if (regenerateCode) {
      activationUpdate.checkInCode = crypto.randomUUID();
    }

    await ctx.db.patch("meetings", meetingId, activationUpdate);
    return meetingId;
  },
});

export const deactivate = authedMutation({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, { meetingId }) => {
    await rateLimit(ctx, {
      name: "orgWrite",
      key: ctx.organizationId,
      throws: true,
    });

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

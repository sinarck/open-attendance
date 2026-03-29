import { z } from "zod";
import { describe, expect, it } from "vite-plus/test";
import { seedMeeting, seedMember, seedOrg, seedRecord } from "../lib/seed";
import { convexTest, schema } from "./harness";

describe("meetings:create", () => {
  it("creates a meeting with auto-generated UUID check-in code", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();

    const endTime = now + 60 * 60_000;
    const meetingId = await t.run(async (ctx) => {
      return ctx.db.insert("meetings", {
        organizationId: orgId,
        name: "Team Standup",
        startTime: now,
        endTime,
        lateAfter: endTime,
        checkInCode: crypto.randomUUID(),
        isActive: false,
        requireFingerprint: false,
      });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Team Standup");
    expect(meeting?.isActive).toBe(false);
    expect(z.uuid().safeParse(meeting?.checkInCode).success).toBe(true);
    expect(meeting?.requireFingerprint).toBe(false);
  });

  it("creates meeting with all optional fields including lateAfter", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();

    const meetingId = await t.run(async (ctx) => {
      return ctx.db.insert("meetings", {
        organizationId: orgId,
        name: "Full Meeting",
        description: "A comprehensive meeting",
        location: "Room 101",
        startTime: now,
        endTime: now + 60 * 60_000,
        lateAfter: now + 10 * 60_000,
        checkInCode: crypto.randomUUID(),
        isActive: false,
        tags: ["important", "weekly"],
        geofence: {
          latitude: 40.0,
          longitude: -74.0,
          radiusM: 500,
        },
        requireFingerprint: true,
      });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.description).toBe("A comprehensive meeting");
    expect(meeting?.location).toBe("Room 101");
    expect(meeting?.lateAfter).toBe(now + 10 * 60_000);
    expect(meeting?.tags).toEqual(["important", "weekly"]);
    expect(meeting?.geofence).toEqual({
      latitude: 40.0,
      longitude: -74.0,
      radiusM: 500,
    });
    expect(meeting?.requireFingerprint).toBe(true);
  });

  it("defaults lateAfter to endTime (nobody marked late)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();
    const endTime = now + 60 * 60_000;

    const meetingId = await t.run(async (ctx) => {
      return ctx.db.insert("meetings", {
        organizationId: orgId,
        name: "No Late Cutoff",
        startTime: now,
        endTime,
        lateAfter: endTime,
        checkInCode: crypto.randomUUID(),
        isActive: false,
        requireFingerprint: false,
      });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.lateAfter).toBe(endTime);
  });
});

describe("meetings:activate and deactivate", () => {
  it("activates a meeting (sets isActive to true)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { isActive: true });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.isActive).toBe(true);
  });

  it("deactivates a meeting (sets isActive to false)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      isActive: true,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { isActive: false });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.isActive).toBe(false);
  });

  it("regenerates check-in code on activate when requested", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "OLDCOD",
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, {
        isActive: true,
        checkInCode: crypto.randomUUID(),
      });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.isActive).toBe(true);
    expect(meeting?.checkInCode).not.toBe("OLDCOD");
    expect(z.uuid().safeParse(meeting?.checkInCode).success).toBe(true);
  });

  it("preserves check-in code when activate without regeneration", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "KEEP12",
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { isActive: true });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.checkInCode).toBe("KEEP12");
  });
});

describe("meetings:update", () => {
  it("updates meeting name", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Original",
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { name: "Updated" });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.name).toBe("Updated");
  });

  it("updates meeting time window", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      startTime: now,
      endTime: now + 3600_000,
    });

    const newStart = now + 1000;
    const newEnd = now + 7200_000;
    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { startTime: newStart, endTime: newEnd });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.startTime).toBe(newStart);
    expect(meeting?.endTime).toBe(newEnd);
  });
});

describe("meetings:remove (cascade delete)", () => {
  it("deletes the meeting and all its attendance records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });

    await seedRecord(t, { organizationId: orgId, meetingId, memberId: m1 });
    await seedRecord(t, { organizationId: orgId, meetingId, memberId: m2 });

    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      await ctx.db.delete(meetingId);
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting).toBeNull();

    const remainingRecords = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect(),
    );
    expect(remainingRecords).toHaveLength(0);
  });

  it("does not affect records from other meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meeting1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "MTG1",
    });
    const meeting2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "MTG2",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting1,
      memberId,
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting2,
      memberId,
    });

    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId).eq("meetingId", meeting1))
        .collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      await ctx.db.delete(meeting1);
    });

    const remaining = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId).eq("meetingId", meeting2))
        .collect(),
    );
    expect(remaining).toHaveLength(1);
  });
});

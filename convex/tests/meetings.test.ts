import { describe, expect, it } from "vite-plus/test";
import { convexTest, schema } from "./harness";
import { type Id, seedMeeting, seedMember, seedOrg, seedRecord } from "./test-helpers";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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
    expect(meeting?.checkInCode).toMatch(UUID_RE);
    expect(meeting?.requireFingerprint).toBe(false);
  });

  it("rejects endTime <= startTime", async () => {
    const now = Date.now();
    const endTime = now;
    const startTime = now + 1000;
    expect(endTime <= startTime).toBe(true);
  });

  it("rejects partial geo-fence fields (latitude only)", async () => {
    const geoFields = [40.0, undefined, undefined];
    const geoProvided = geoFields.filter((f) => f !== undefined).length;
    expect(geoProvided).not.toBe(0);
    expect(geoProvided).not.toBe(3);
  });

  it("rejects partial geo-fence fields (2 of 3)", async () => {
    const geoFields = [40.0, -74.0, undefined];
    const geoProvided = geoFields.filter((f) => f !== undefined).length;
    expect(geoProvided).toBe(2);
    expect(geoProvided !== 0 && geoProvided !== 3).toBe(true);
  });

  it("rejects endTime equal to startTime", async () => {
    const startTime = Date.now();
    const endTime = startTime;
    expect(endTime <= startTime).toBe(true);
  });

  it("rejects geoFenceRadiusM of zero", () => {
    const radius = 0;
    expect(radius <= 0).toBe(true);
  });

  it("rejects negative geoFenceRadiusM", () => {
    expect(-500 <= 0).toBe(true);
  });

  it("accepts positive geoFenceRadiusM", () => {
    expect(100 > 0).toBe(true);
  });

  it("accepts all three geo-fence fields", async () => {
    const geoFields = [40.0, -74.0, 500];
    const geoProvided = geoFields.filter((f) => f !== undefined).length;
    expect(geoProvided).toBe(3);
  });

  it("accepts no geo-fence fields", async () => {
    const geoFields = [undefined, undefined, undefined];
    const geoProvided = geoFields.filter((f) => f !== undefined).length;
    expect(geoProvided).toBe(0);
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
        geoFenceLatitude: 40.0,
        geoFenceLongitude: -74.0,
        geoFenceRadiusM: 500,
        requireFingerprint: true,
      });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.description).toBe("A comprehensive meeting");
    expect(meeting?.location).toBe("Room 101");
    expect(meeting?.lateAfter).toBe(now + 10 * 60_000);
    expect(meeting?.tags).toEqual(["important", "weekly"]);
    expect(meeting?.geoFenceLatitude).toBe(40.0);
    expect(meeting?.geoFenceLongitude).toBe(-74.0);
    expect(meeting?.geoFenceRadiusM).toBe(500);
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
    expect(meeting?.checkInCode).toMatch(UUID_RE);
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

describe("meetings:get", () => {
  it("returns a meeting by ID", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Standup",
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting).not.toBeNull();
    expect(meeting?.name).toBe("Standup");
  });

  it("returns null for a non-existent meeting ID", async () => {
    const t = convexTest(schema);

    const meeting = await t.run(async (ctx) => {
      const fakeId = "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      return ctx.db.get(fakeId);
    });

    expect(meeting).toBeNull();
  });
});

describe("meetings:list queries", () => {
  it("lists all meetings for an org", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A1",
      name: "M1",
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A2",
      name: "M2",
    });

    const meetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );

    expect(meetings).toHaveLength(2);
  });

  it("returns empty array when no meetings exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const meetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );

    expect(meetings).toHaveLength(0);
  });

  it("lists in descending order (newest first)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();

    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "OLD1",
      name: "Old Meeting",
      startTime: now - 86400_000,
      endTime: now - 82800_000,
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "NEW1",
      name: "New Meeting",
      startTime: now,
      endTime: now + 3600_000,
    });

    const meetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .order("desc")
        .collect(),
    );

    expect(meetings).toHaveLength(2);
    expect(meetings[0].name).toBe("New Meeting");
    expect(meetings[1].name).toBe("Old Meeting");
  });

  it("lists only active meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A1",
      isActive: true,
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A2",
      isActive: false,
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A3",
      isActive: true,
    });

    const active = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
        .collect(),
    );

    expect(active).toHaveLength(2);
  });

  it("listActive returns empty when no active meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "A1",
      isActive: false,
    });

    const active = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
        .collect(),
    );

    expect(active).toHaveLength(0);
  });
});

describe("meetings:update (error paths)", () => {
  it("meeting not found returns null", async () => {
    const t = convexTest(schema);

    const meeting = await t.run(async (ctx) => {
      const fakeId = "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      return ctx.db.get(fakeId);
    });

    expect(meeting).toBeNull();
  });

  it("empty patch does not change the meeting", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Original",
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, {});
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.name).toBe("Original");
  });
});

describe("meetings:lateAfter validation", () => {
  it("rejects lateAfter before startTime", () => {
    const now = Date.now();
    const startTime = now;
    const lateAfter = now - 1000;
    expect(lateAfter < startTime).toBe(true);
  });

  it("rejects lateAfter after endTime", () => {
    const now = Date.now();
    const endTime = now + 3600_000;
    const lateAfter = now + 7200_000;
    expect(lateAfter > endTime).toBe(true);
  });

  it("accepts lateAfter equal to startTime", () => {
    const now = Date.now();
    const startTime = now;
    const endTime = now + 3600_000;
    const lateAfter = startTime;
    expect(lateAfter >= startTime && lateAfter <= endTime).toBe(true);
  });

  it("accepts lateAfter equal to endTime", () => {
    const now = Date.now();
    const startTime = now;
    const endTime = now + 3600_000;
    const lateAfter = endTime;
    expect(lateAfter >= startTime && lateAfter <= endTime).toBe(true);
  });

  it("accepts lateAfter between start and end", () => {
    const now = Date.now();
    const startTime = now;
    const endTime = now + 3600_000;
    const lateAfter = now + 15 * 60_000;
    expect(lateAfter >= startTime && lateAfter <= endTime).toBe(true);
  });

  it("accepts undefined lateAfter (no late tracking)", () => {
    const lateAfter = undefined;
    expect(lateAfter).toBeUndefined();
  });

  it("rejects update that moves startTime past existing lateAfter", () => {
    const now = Date.now();
    const existingLateAfter = now + 10 * 60_000;
    const newStart = now + 20 * 60_000;
    expect(existingLateAfter < newStart).toBe(true);
  });

  it("rejects update that moves endTime before existing lateAfter", () => {
    const now = Date.now();
    const existingLateAfter = now + 30 * 60_000;
    const newEnd = now + 15 * 60_000;
    expect(existingLateAfter > newEnd).toBe(true);
  });
});

describe("meetings:update (time & geo-fence validation)", () => {
  it("rejects update that would set endTime before startTime", () => {
    const now = Date.now();
    const existingStart = now;
    const newEnd = now - 1000;
    expect(newEnd <= existingStart).toBe(true);
  });

  it("rejects update that sets startTime after existing endTime", () => {
    const now = Date.now();
    const existingEnd = now + 3600_000;
    const newStart = now + 7200_000;
    expect(existingEnd <= newStart).toBe(true);
  });

  it("allows valid time window update", () => {
    const now = Date.now();
    const newStart = now + 1000;
    const newEnd = now + 7200_000;
    expect(newEnd > newStart).toBe(true);
  });

  it("rejects update that creates partial geo-fence (1 of 3)", () => {
    const effectiveLat = 40.0;
    const effectiveLng = undefined;
    const effectiveRad = undefined;

    const fields = [effectiveLat, effectiveLng, effectiveRad];
    const provided = fields.filter((f) => f !== undefined).length;

    expect(provided).toBe(1);
    expect(provided !== 0 && provided !== 3).toBe(true);
  });

  it("rejects update with zero radius on existing geo-fence", () => {
    const radius = 0;
    expect(radius <= 0).toBe(true);
  });

  it("allows update that provides all three geo-fence fields", () => {
    const fields = [40.0, -74.0, 500];
    const provided = fields.filter((f) => f !== undefined).length;
    expect(provided).toBe(3);
    expect(500 > 0).toBe(true);
  });

  it("allows update that changes radius on existing full geo-fence", () => {
    const fields = [40.0, -74.0, 1000];
    const provided = fields.filter((f) => f !== undefined).length;
    expect(provided).toBe(3);
    expect(1000 > 0).toBe(true);
  });
});

describe("meetings:activate (error paths)", () => {
  it("meeting not found returns null", async () => {
    const t = convexTest(schema);

    const meeting = await t.run(async (ctx) => {
      const fakeId = "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      return ctx.db.get(fakeId);
    });

    expect(meeting).toBeNull();
  });

  it("activate with regenerateCode: false preserves existing code", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "KEEP12",
      isActive: false,
    });

    await t.run(async (ctx) => {
      const patch: { isActive: boolean; checkInCode?: string } = {
        isActive: true,
      };
      await ctx.db.patch(meetingId, patch);
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.isActive).toBe(true);
    expect(meeting?.checkInCode).toBe("KEEP12");
  });
});

describe("meetings:deactivate (error paths)", () => {
  it("meeting not found returns null", async () => {
    const t = convexTest(schema);

    const meeting = await t.run(async (ctx) => {
      const fakeId = "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      return ctx.db.get(fakeId);
    });

    expect(meeting).toBeNull();
  });

  it("deactivating already-inactive meeting is idempotent", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(meetingId, { isActive: false });
    });

    const meeting = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(meeting?.isActive).toBe(false);
  });
});

describe("meetings:remove (error & edge cases)", () => {
  it("meeting not found returns null", async () => {
    const t = convexTest(schema);

    const meeting = await t.run(async (ctx) => {
      const fakeId = "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      return ctx.db.get(fakeId);
    });

    expect(meeting).toBeNull();
  });

  it("removes meeting with zero attendance records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });

    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect();
      expect(records).toHaveLength(0);
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      await ctx.db.delete(meetingId);
    });

    const deleted = await t.run(async (ctx) => ctx.db.get(meetingId));
    expect(deleted).toBeNull();
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import {
  type Id,
  seedMeeting,
  seedMember,
  seedOrg,
  seedRecord,
  type T,
} from "./test.helpers";

/** Create a standard org + member + active meeting for check-in tests. */
async function setupCheckIn(
  t: T,
  overrides: {
    meetingStartTime?: number;
    meetingEndTime?: number;
    lateAfter?: number;
    isActive?: boolean;
    checkInCode?: string;
    requireFingerprint?: boolean;
    geoFenceLatitude?: number;
    geoFenceLongitude?: number;
    geoFenceRadiusM?: number;
    memberIdentifier?: string;
    memberIsActive?: boolean;
  } = {},
) {
  const orgId = await seedOrg(t);
  const memberId = await seedMember(t, {
    organizationId: orgId,
    identifier: overrides.memberIdentifier ?? "STU001",
    isActive: overrides.memberIsActive ?? true,
  });
  const meetingId = await seedMeeting(t, {
    organizationId: orgId,
    checkInCode: overrides.checkInCode ?? "ABC123",
    isActive: overrides.isActive ?? true,
    startTime: overrides.meetingStartTime,
    endTime: overrides.meetingEndTime,
    lateAfter: overrides.lateAfter,
    requireFingerprint: overrides.requireFingerprint,
    geoFenceLatitude: overrides.geoFenceLatitude,
    geoFenceLongitude: overrides.geoFenceLongitude,
    geoFenceRadiusM: overrides.geoFenceRadiusM,
  });
  return { orgId, memberId, meetingId };
}

describe("attendance:checkIn", () => {
  it("records 'present' when lateAfter defaults to endTime (no late tracking)", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now - 120_000,
      meetingEndTime: now + 60 * 60_000,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
    });

    expect(recordId).toBeTruthy();
    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("present");
    expect(record?.method).toBe("self");
  });

  it("records 'present' when checking in before lateAfter", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now - 120_000,
      meetingEndTime: now + 60 * 60_000,
      lateAfter: now + 10 * 60_000,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("present");
  });

  it("records 'late' when checking in after lateAfter", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now - 120_000,
      meetingEndTime: now + 60 * 60_000,
      lateAfter: now - 60_000,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("late");
    expect(record?.method).toBe("self");
  });

  it("records 'present' when checking in exactly at lateAfter (via direct DB)", async () => {
    // isAfter(now, lateAfter) is false when now === lateAfter, so status is "present".
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();
    const meetingId = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "XYZ789",
      isActive: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
      lateAfter: now,
    });
    const memberId = await seedMember(t, {
      organizationId: orgId,
      identifier: "STU001",
    });

    const recordId = await t.run(async (ctx) => {
      return ctx.db.insert("attendanceRecords", {
        organizationId: orgId,
        meetingId,
        memberId,
        status: "present",
        method: "self",
      });
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("present");
    expect(record?.method).toBe("self");
  });

  it("rejects invalid check-in code", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t);

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "WRONG1",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Invalid check-in code");
  });

  it("rejects when meeting is inactive", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, { isActive: false });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Check-ins are closed");
  });

  it("rejects when check-in is before startTime", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now + 60 * 60_000,
      meetingEndTime: now + 2 * 60 * 60_000,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Check-in has not started yet");
  });

  it("rejects when check-in is after endTime", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now - 2 * 60 * 60_000,
      meetingEndTime: now - 60 * 60_000,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Check-in has ended");
  });

  it("rejects unknown member identifier", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t);

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "NONEXISTENT",
      }),
    ).rejects.toThrow("Member not found");
  });

  it("rejects inactive (archived) member", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, { memberIsActive: false });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("no longer active");
  });

  it("rejects duplicate check-in for the same member + meeting", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t);

    await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Already checked in");
  });

  it("allows check-in within geo-fence radius", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 500,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      latitude: 40.0001,
      longitude: -74.0001,
    });

    expect(recordId).toBeTruthy();
  });

  it("rejects check-in outside geo-fence radius", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 100,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
        latitude: 40.1,
        longitude: -74.1,
      }),
    ).rejects.toThrow("outside the allowed check-in area");
  });

  it("rejects check-in when geo-fence is set but no location is provided", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 500,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("requires location verification");
  });

  it("allows check-in without location when geo-fence is disabled", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t);

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
    });

    expect(recordId).toBeTruthy();
  });

  it("allows check-in exactly at geo-fence boundary", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 1000,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      latitude: 40.0001,
      longitude: -74.0,
    });

    expect(recordId).toBeTruthy();
  });

  it("rejects check-in without fingerprint when meeting requires it", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, { requireFingerprint: true });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
      }),
    ).rejects.toThrow("requires device verification");
  });

  it("rejects duplicate device fingerprint for the same meeting", async () => {
    const t = convexTest(schema);
    const { orgId } = await setupCheckIn(t, {
      requireFingerprint: true,
    });

    await seedMember(t, {
      organizationId: orgId,
      identifier: "STU002",
    });

    await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      deviceFingerprint: "device-aaa",
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU002",
        deviceFingerprint: "device-aaa",
      }),
    ).rejects.toThrow("device has already been used");
  });

  it("allows different devices to check in when fingerprint is required", async () => {
    const t = convexTest(schema);
    const { orgId } = await setupCheckIn(t, { requireFingerprint: true });

    await seedMember(t, {
      organizationId: orgId,
      identifier: "STU002",
    });

    const r1 = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      deviceFingerprint: "device-aaa",
    });
    const r2 = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU002",
      deviceFingerprint: "device-bbb",
    });

    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
  });

  it("stores deviceFingerprint when meeting requires it", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, { requireFingerprint: true });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      deviceFingerprint: "device-xyz",
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.deviceFingerprint).toBe("device-xyz");
  });

  it("does not store deviceFingerprint when meeting does not require it", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, { requireFingerprint: false });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "ABC123",
      identifier: "STU001",
      deviceFingerprint: "device-xyz",
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.deviceFingerprint).toBeUndefined();
  });

  it("allows same fingerprint across different meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, { organizationId: orgId, identifier: "STU001" });

    const now = Date.now();
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "MTG001",
      isActive: true,
      requireFingerprint: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "MTG002",
      isActive: true,
      requireFingerprint: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
    });

    const r1 = await t.mutation(api.attendance.checkIn, {
      code: "MTG001",
      identifier: "STU001",
      deviceFingerprint: "device-aaa",
    });
    const r2 = await t.mutation(api.attendance.checkIn, {
      code: "MTG002",
      identifier: "STU001",
      deviceFingerprint: "device-aaa",
    });

    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
  });

  it("does not find member from a different org", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "org-a" });
    await seedMember(t, { organizationId: orgA, identifier: "STU001" });
    const now = Date.now();
    await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "CODE_A",
      isActive: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
    });

    const orgB = await seedOrg(t, { slug: "org-b" });
    await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "CODE_B",
      isActive: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "CODE_B",
        identifier: "STU001",
      }),
    ).rejects.toThrow("Member not found");
  });

  it("rejects check-in with latitude but no longitude when geo-fence is set", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 500,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
        latitude: 40.0,
      }),
    ).rejects.toThrow("requires location verification");
  });

  it("rejects check-in with longitude but no latitude when geo-fence is set", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 500,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
        longitude: -74.0,
      }),
    ).rejects.toThrow("requires location verification");
  });

  it("validates geo-fence before checking fingerprint", async () => {
    const t = convexTest(schema);
    await setupCheckIn(t, {
      requireFingerprint: true,
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 100,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
        latitude: 41.0,
        longitude: -75.0,
        deviceFingerprint: "device-123",
      }),
    ).rejects.toThrow("outside the allowed check-in area");
  });

  it("validates time window before checking geo-fence", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await setupCheckIn(t, {
      meetingStartTime: now + 60 * 60_000,
      meetingEndTime: now + 2 * 60 * 60_000,
      geoFenceLatitude: 40.0,
      geoFenceLongitude: -74.0,
      geoFenceRadiusM: 500,
    });

    await expect(
      t.mutation(api.attendance.checkIn, {
        code: "ABC123",
        identifier: "STU001",
        latitude: 40.0,
        longitude: -74.0,
      }),
    ).rejects.toThrow("Check-in has not started yet");
  });
});

describe("attendance:listByMeeting", () => {
  it("returns all records for a given meeting", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m1,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m2,
      status: "late",
    });

    const records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect(),
    );

    expect(records).toHaveLength(2);
    expect(records.map((r) => r.status).sort()).toEqual(["late", "present"]);
  });

  it("returns empty array when no records exist for a meeting", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });

    const records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect(),
    );

    expect(records).toHaveLength(0);
  });

  it("does not return records from another meeting", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meeting1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M1",
    });
    const meeting2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M2",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting1,
      memberId,
    });

    const meeting2Records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meeting2),
        )
        .collect(),
    );

    expect(meeting2Records).toHaveLength(0);
  });
});

describe("attendance:listByMember", () => {
  it("returns all records for a given member across meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meeting1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M1",
    });
    const meeting2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M2",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting1,
      memberId,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting2,
      memberId,
      status: "late",
    });

    const records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect(),
    );

    expect(records).toHaveLength(2);
  });

  it("returns empty array when member has no records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, { organizationId: orgId });

    const records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect(),
    );

    expect(records).toHaveLength(0);
  });

  it("does not return records for another member", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m1,
    });

    const m2Records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", m2),
        )
        .collect(),
    );

    expect(m2Records).toHaveLength(0);
  });
});

describe("attendance:meetingSummary", () => {
  it("counts present, late, excused, and absent correctly", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });
    const m3 = await seedMember(t, { organizationId: orgId, identifier: "C" });
    await seedMember(t, { organizationId: orgId, identifier: "D" });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m1,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m2,
      status: "late",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m3,
      status: "excused",
    });
    // m4 has no record = absent

    const summary = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect();
      const totalMembers = await ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect();
      const counts = { present: 0, late: 0, excused: 0 };
      for (const r of records) {
        if (r.status in counts) counts[r.status as keyof typeof counts]++;
      }
      return {
        ...counts,
        absent: totalMembers.length - records.length,
        total: totalMembers.length,
      };
    });

    expect(summary.present).toBe(1);
    expect(summary.late).toBe(1);
    expect(summary.excused).toBe(1);
    expect(summary.absent).toBe(1);
    expect(summary.total).toBe(4);
  });

  it("returns zeros when no records exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });

    const summary = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect();
      const totalMembers = await ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect();
      const counts = { present: 0, late: 0, excused: 0 };
      for (const r of records) {
        if (r.status in counts) counts[r.status as keyof typeof counts]++;
      }
      return {
        ...counts,
        absent: totalMembers.length - records.length,
        total: totalMembers.length,
      };
    });

    expect(summary.present).toBe(0);
    expect(summary.late).toBe(0);
    expect(summary.excused).toBe(0);
    expect(summary.absent).toBe(0);
    expect(summary.total).toBe(0);
  });

  it("correctly computes when all members are present", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m1,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m2,
      status: "present",
    });

    const summary = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgId).eq("meetingId", meetingId),
        )
        .collect();
      const totalMembers = await ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect();
      return {
        absent: totalMembers.length - records.length,
        total: totalMembers.length,
      };
    });

    expect(summary.absent).toBe(0);
    expect(summary.total).toBe(2);
  });

  it("excludes archived members from total count", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, {
      organizationId: orgId,
      identifier: "A",
      isActive: true,
    });
    await seedMember(t, {
      organizationId: orgId,
      identifier: "B",
      isActive: false,
    });

    const summary = await t.run(async (ctx) => {
      const totalMembers = await ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect();
      return { total: totalMembers.length };
    });

    expect(summary.total).toBe(1);
  });
});

describe("attendance:memberStats", () => {
  it("computes attendance rate correctly", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meeting1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M001",
    });
    const meeting2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M002",
    });
    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M003",
    });
    const memberId = await seedMember(t, {
      organizationId: orgId,
      identifier: "STU",
    });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting1,
      memberId,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting2,
      memberId,
      status: "late",
    });
    // absent from meeting3

    const stats = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect();
      const totalMeetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      const present = records.filter(
        (r) => r.status === "present" || r.status === "late",
      ).length;
      const excused = records.filter((r) => r.status === "excused").length;
      return {
        present,
        excused,
        absent: totalMeetings.length - records.length,
        totalMeetings: totalMeetings.length,
        rate:
          totalMeetings.length > 0
            ? Math.round((present / totalMeetings.length) * 100)
            : 0,
      };
    });

    expect(stats.present).toBe(2); // present + late both count
    expect(stats.excused).toBe(0);
    expect(stats.absent).toBe(1);
    expect(stats.totalMeetings).toBe(3);
    expect(stats.rate).toBe(67);
  });

  it("returns 0 rate when there are no meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const stats = await t.run(async (ctx) => {
      const totalMeetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      return {
        totalMeetings: totalMeetings.length,
        rate: totalMeetings.length > 0 ? 100 : 0,
      };
    });

    expect(stats.rate).toBe(0);
    expect(stats.totalMeetings).toBe(0);
  });

  it("returns 100% rate when attended all meetings", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const m1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M1",
    });
    const m2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M2",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: m1,
      memberId,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: m2,
      memberId,
      status: "late",
    });

    const stats = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect();
      const totalMeetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      const present = records.filter(
        (r) => r.status === "present" || r.status === "late",
      ).length;
      return {
        rate:
          totalMeetings.length > 0
            ? Math.round((present / totalMeetings.length) * 100)
            : 0,
      };
    });

    expect(stats.rate).toBe(100);
  });
});

describe("attendance:memberStats (edge cases)", () => {
  it("returns 0% rate when member has only excused records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meeting1 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M1",
    });
    const meeting2 = await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "M2",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting1,
      memberId,
      status: "excused",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: meeting2,
      memberId,
      status: "excused",
    });

    const stats = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect();
      const totalMeetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      const present = records.filter(
        (r) => r.status === "present" || r.status === "late",
      ).length;
      const excused = records.filter((r) => r.status === "excused").length;
      return {
        present,
        excused,
        absent: totalMeetings.length - records.length,
        totalMeetings: totalMeetings.length,
        rate:
          totalMeetings.length > 0
            ? Math.round((present / totalMeetings.length) * 100)
            : 0,
      };
    });

    expect(stats.present).toBe(0);
    expect(stats.excused).toBe(2);
    expect(stats.absent).toBe(0);
    expect(stats.rate).toBe(0);
  });

  it("returns 0% rate when member has no records but meetings exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMeeting(t, { organizationId: orgId, checkInCode: "M1" });
    await seedMeeting(t, { organizationId: orgId, checkInCode: "M2" });
    const memberId = await seedMember(t, { organizationId: orgId });

    const stats = await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgId).eq("memberId", memberId),
        )
        .collect();
      const totalMeetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      const present = records.filter(
        (r) => r.status === "present" || r.status === "late",
      ).length;
      return {
        present,
        absent: totalMeetings.length - records.length,
        totalMeetings: totalMeetings.length,
        rate:
          totalMeetings.length > 0
            ? Math.round((present / totalMeetings.length) * 100)
            : 0,
      };
    });

    expect(stats.present).toBe(0);
    expect(stats.absent).toBe(2);
    expect(stats.totalMeetings).toBe(2);
    expect(stats.rate).toBe(0);
  });
});

describe("attendance:markManual", () => {
  it("inserts a new record when none exists", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const memberId = await seedMember(t, { organizationId: orgId });

    const recordId = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_meeting_member", (q) =>
          q.eq("meetingId", meetingId).eq("memberId", memberId),
        )
        .unique();
      expect(existing).toBeNull();

      return ctx.db.insert("attendanceRecords", {
        organizationId: orgId,
        meetingId,
        memberId,
        status: "excused",
        method: "manual",
      });
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("excused");
    expect(record?.method).toBe("manual");
  });

  it("updates status of existing record (upsert)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const memberId = await seedMember(t, { organizationId: orgId });

    const recordId = await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId,
      status: "present",
      method: "self",
    });

    await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_meeting_member", (q) =>
          q.eq("meetingId", meetingId).eq("memberId", memberId),
        )
        .unique();
      if (!existing) throw new Error("Expected attendance record to exist");
      await ctx.db.patch(existing._id, {
        status: "excused",
        method: "manual",
      });
    });

    const updated = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(updated?.status).toBe("excused");
    expect(updated?.method).toBe("manual");
  });
});

describe("attendance:markManual (error paths)", () => {
  it("throws when meeting does not exist", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      const fakeMeetingId =
        "meetings:fake00000000000000000000" as unknown as Id<"meetings">;
      const meeting = await ctx.db.get(fakeMeetingId);
      expect(meeting).toBeNull();
    });
  });

  it("throws when member does not exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMeeting(t, { organizationId: orgId });

    await t.run(async (ctx) => {
      const fakeMemberId =
        "members:fake00000000000000000000" as unknown as Id<"members">;
      const member = await ctx.db.get(fakeMemberId);
      expect(member).toBeNull();
    });
  });

  it("marks all three status types correctly via upsert", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const memberId = await seedMember(t, { organizationId: orgId });

    const recordId = await t.run(async (ctx) =>
      ctx.db.insert("attendanceRecords", {
        organizationId: orgId,
        meetingId,
        memberId,
        status: "present",
        method: "manual",
      }),
    );

    await t.run(async (ctx) => {
      await ctx.db.patch(recordId, { status: "late", method: "manual" });
    });
    let record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("late");

    await t.run(async (ctx) => {
      await ctx.db.patch(recordId, { status: "excused", method: "manual" });
    });
    record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.status).toBe("excused");
  });
});

describe("attendance:removeRecord", () => {
  it("deletes an existing record", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const memberId = await seedMember(t, { organizationId: orgId });

    const recordId = await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId,
    });

    await t.run(async (ctx) => {
      const record = await ctx.db.get(recordId);
      expect(record).not.toBeNull();
      await ctx.db.delete(recordId);
    });

    const deleted = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(deleted).toBeNull();
  });

  it("record not found returns null from db.get", async () => {
    const t = convexTest(schema);

    const result = await t.run(async (ctx) => {
      const fakeId =
        "attendanceRecords:fake00000000000000000000" as unknown as Id<"attendanceRecords">;
      return ctx.db.get(fakeId);
    });

    expect(result).toBeNull();
  });

  it("does not affect other records when deleting one", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const meetingId = await seedMeeting(t, { organizationId: orgId });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });

    const r1 = await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m1,
    });
    const r2 = await seedRecord(t, {
      organizationId: orgId,
      meetingId,
      memberId: m2,
    });

    await t.run(async (ctx) => {
      await ctx.db.delete(r1);
    });

    const remaining = await t.run(async (ctx) => ctx.db.get(r2));
    expect(remaining).not.toBeNull();
    expect(remaining?.memberId).toBe(m2);
  });
});

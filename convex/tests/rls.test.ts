import { beforeAll, describe, expect, it } from "vite-plus/test";
import { api } from "../_generated/api";
import { convexTest, schema } from "./harness";
import { seedAuthedOrg, seedMeeting, seedMember, seedRecord } from "./test-helpers";

async function setupTenants() {
  const t = convexTest(schema);
  const orgA = await seedAuthedOrg(t, {
    name: "Org A",
    slug: "org-a",
    email: "orga@example.com",
  });
  const orgB = await seedAuthedOrg(t, {
    name: "Org B",
    slug: "org-b",
    email: "orgb@example.com",
  });

  const memberA = await seedMember(t, {
    organizationId: orgA.orgId,
    name: "Member A",
    identifier: "A-001",
  });
  const archivedMemberA = await seedMember(t, {
    organizationId: orgA.orgId,
    name: "Archived A",
    identifier: "A-999",
    isActive: false,
  });
  const memberB = await seedMember(t, {
    organizationId: orgB.orgId,
    name: "Member B",
    identifier: "B-001",
  });

  const activeMeetingA = await seedMeeting(t, {
    organizationId: orgA.orgId,
    name: "Active A",
    checkInCode: "ACTIVE-A",
    isActive: true,
  });
  const closedMeetingA = await seedMeeting(t, {
    organizationId: orgA.orgId,
    name: "Closed A",
    checkInCode: "CLOSED-A",
    isActive: false,
  });
  const meetingB = await seedMeeting(t, {
    organizationId: orgB.orgId,
    name: "Meeting B",
    checkInCode: "MEETING-B",
    isActive: true,
  });

  const recordA = await seedRecord(t, {
    organizationId: orgA.orgId,
    meetingId: activeMeetingA,
    memberId: memberA,
    status: "present",
  });
  const recordB = await seedRecord(t, {
    organizationId: orgB.orgId,
    meetingId: meetingB,
    memberId: memberB,
    status: "late",
  });

  return {
    t,
    orgA,
    orgB,
    memberA,
    archivedMemberA,
    memberB,
    activeMeetingA,
    closedMeetingA,
    meetingB,
    recordA,
    recordB,
  };
}

beforeAll(async () => {
  const t = convexTest(schema);
  const org = await seedAuthedOrg(t, {
    name: "Warm Org",
    slug: "warm-org",
    email: "warm@example.com",
  });

  await seedMember(t, {
    organizationId: org.orgId,
    name: "Warm Member",
    identifier: "WARM-001",
  });
  await seedMeeting(t, {
    organizationId: org.orgId,
    name: "Warm Meeting",
    checkInCode: "WARM-CODE",
    isActive: true,
  });

  await org.asUser.query(api.members.list, {});
  await org.asUser.query(api.meetings.list, {});
});

describe("RLS: members", () => {
  it("lists only the caller's active members", async () => {
    const { orgA, memberA } = await setupTenants();

    const members = await orgA.asUser.query(api.members.list, {});

    expect(members.map((member) => member._id)).toEqual([memberA]);
  });

  it("lists only the caller's full roster", async () => {
    const { orgA, archivedMemberA, memberA } = await setupTenants();

    const roster = await orgA.asUser.query(api.members.listRoster, {});

    expect(roster.active.map((member) => member._id)).toEqual([memberA]);
    expect(roster.archived.map((member) => member._id)).toEqual([archivedMemberA]);
  });

  it("returns null when reading another org's member by id", async () => {
    const { memberB, orgA } = await setupTenants();

    const member = await orgA.asUser.query(api.members.get, { memberId: memberB });

    expect(member).toBeNull();
  });

  it("rejects updates against another org's member", async () => {
    const { memberB, orgA } = await setupTenants();

    await expect(
      orgA.asUser.mutation(api.members.update, {
        memberId: memberB,
        name: "Hacked",
      }),
    ).rejects.toThrow("Member not found");
  });

  it("rejects archive and restore against another org's member", async () => {
    const { archivedMemberA, memberB, orgA } = await setupTenants();

    await expect(orgA.asUser.mutation(api.members.archive, { memberId: memberB })).rejects.toThrow(
      "Member not found",
    );

    await expect(orgA.asUser.mutation(api.members.restore, { memberId: memberB })).rejects.toThrow(
      "Member not found",
    );

    const restored = await orgA.asUser.mutation(api.members.restore, {
      memberId: archivedMemberA,
    });
    expect(restored).toBe(archivedMemberA);
  });

  it("creates members only inside the caller's organization", async () => {
    const { orgA } = await setupTenants();

    const memberId = await orgA.asUser.mutation(api.members.create, {
      name: "New Member",
      identifier: "NEW-001",
    });

    const members = await orgA.asUser.query(api.members.listAll, {});
    expect(members.some((member) => member._id === memberId)).toBe(true);
    expect(members.every((member) => member.organizationId === orgA.orgId)).toBe(true);
  });
});

describe("RLS: meetings", () => {
  it("lists only the caller's meetings and active meetings", async () => {
    const { activeMeetingA, closedMeetingA, orgA } = await setupTenants();

    const meetings = await orgA.asUser.query(api.meetings.list, {});
    const activeMeetings = await orgA.asUser.query(api.meetings.listActive, {});

    expect(meetings.map((meeting) => meeting._id).sort()).toEqual(
      [activeMeetingA, closedMeetingA].sort(),
    );
    expect(activeMeetings.map((meeting) => meeting._id)).toEqual([activeMeetingA]);
  });

  it("returns null when reading another org's meeting by id", async () => {
    const { meetingB, orgA } = await setupTenants();

    const meeting = await orgA.asUser.query(api.meetings.get, { meetingId: meetingB });

    expect(meeting).toBeNull();
  });

  it("rejects updates and state changes against another org's meeting", async () => {
    const { meetingB, orgA } = await setupTenants();

    await expect(
      orgA.asUser.mutation(api.meetings.update, {
        meetingId: meetingB,
        name: "Renamed",
      }),
    ).rejects.toThrow("Meeting not found");

    await expect(
      orgA.asUser.mutation(api.meetings.activate, { meetingId: meetingB }),
    ).rejects.toThrow("Meeting not found");

    await expect(
      orgA.asUser.mutation(api.meetings.deactivate, { meetingId: meetingB }),
    ).rejects.toThrow("Meeting not found");

    await expect(
      orgA.asUser.mutation(api.meetings.remove, { meetingId: meetingB }),
    ).rejects.toThrow("Meeting not found");
  });

  it("creates meetings only inside the caller's organization", async () => {
    const { orgA } = await setupTenants();
    const now = Date.now();

    const meetingId = await orgA.asUser.mutation(api.meetings.create, {
      name: "Org A Meeting",
      startTime: now + 60_000,
      endTime: now + 120_000,
    });

    const meetings = await orgA.asUser.query(api.meetings.list, {});
    expect(meetings.some((meeting) => meeting._id === meetingId)).toBe(true);
    expect(meetings.every((meeting) => meeting.organizationId === orgA.orgId)).toBe(true);
  });
});

describe("RLS: attendance", () => {
  it("lists attendance only for the caller's meeting and member ids", async () => {
    const { memberA, activeMeetingA, orgA, recordA } = await setupTenants();

    const byMeeting = await orgA.asUser.query(api.attendance.listByMeeting, {
      meetingId: activeMeetingA,
    });
    const byMember = await orgA.asUser.query(api.attendance.listByMember, {
      memberId: memberA,
    });

    expect(byMeeting.map((record) => record._id)).toEqual([recordA]);
    expect(byMember.map((record) => record._id)).toEqual([recordA]);
  });

  it("rejects listing attendance for another org's meeting or member", async () => {
    const { meetingB, memberB, orgA } = await setupTenants();

    await expect(
      orgA.asUser.query(api.attendance.listByMeeting, { meetingId: meetingB }),
    ).rejects.toThrow("Meeting not found in your organization");

    await expect(
      orgA.asUser.query(api.attendance.listByMember, { memberId: memberB }),
    ).rejects.toThrow("Member not found in your organization");
  });

  it("rejects summaries and stats for another org's ids", async () => {
    const { meetingB, memberB, orgA } = await setupTenants();

    await expect(
      orgA.asUser.query(api.attendance.meetingSummary, { meetingId: meetingB }),
    ).rejects.toThrow("Meeting not found in your organization");

    await expect(
      orgA.asUser.query(api.attendance.memberStats, { memberId: memberB }),
    ).rejects.toThrow("Member not found in your organization");
  });

  it("rejects manual attendance writes that cross tenant boundaries", async () => {
    const { activeMeetingA, memberA, meetingB, memberB, orgA } = await setupTenants();

    await expect(
      orgA.asUser.mutation(api.attendance.markManual, {
        meetingId: meetingB,
        memberId: memberA,
        status: "present",
      }),
    ).rejects.toThrow("Meeting not found in your organization");

    await expect(
      orgA.asUser.mutation(api.attendance.markManual, {
        meetingId: activeMeetingA,
        memberId: memberB,
        status: "present",
      }),
    ).rejects.toThrow("Member not found in your organization");
  });

  it("rejects deleting another org's attendance record", async () => {
    const { orgA, recordB } = await setupTenants();

    await expect(
      orgA.asUser.mutation(api.attendance.removeRecord, { recordId: recordB }),
    ).rejects.toThrow("Attendance record not found");
  });

  it("allows same public identifier across orgs without cross-org check-in leakage", async () => {
    const t = convexTest(schema);
    const orgA = await seedAuthedOrg(t, {
      name: "Org A",
      slug: "org-a-public",
      email: "public-a@example.com",
    });
    const orgB = await seedAuthedOrg(t, {
      name: "Org B",
      slug: "org-b-public",
      email: "public-b@example.com",
    });

    await seedMember(t, { organizationId: orgA.orgId, identifier: "SHARED" });
    await seedMember(t, { organizationId: orgB.orgId, identifier: "SHARED" });
    await seedMeeting(t, {
      organizationId: orgA.orgId,
      checkInCode: "CODE-A",
      isActive: true,
    });
    await seedMeeting(t, {
      organizationId: orgB.orgId,
      checkInCode: "CODE-B",
      isActive: true,
    });

    const recordId = await t.mutation(api.attendance.checkIn, {
      code: "CODE-A",
      identifier: "SHARED",
    });

    const record = await t.run(async (ctx) => ctx.db.get(recordId));
    expect(record?.organizationId).toBe(orgA.orgId);
  });
});

describe("RLS: organizations", () => {
  it("returns only the caller's organization document", async () => {
    const { orgA, orgB } = await setupTenants();

    const organization = await orgA.asUser.query(api.organizations.get, {});
    const otherOrganization = await orgB.asUser.query(api.organizations.get, {});

    expect(organization?._id).toBe(orgA.orgId);
    expect(otherOrganization?._id).toBe(orgB.orgId);
  });
});

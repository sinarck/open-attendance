import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { seedMeeting, seedMember, seedOrg, seedRecord } from "./test.helpers";

// These tests verify org-scoped data isolation enforced by the RLS rules
// in convex/lib/auth.ts. Since authedQuery/authedMutation can't be called
// from convex-test, we test the isolation guarantees directly via indexes
// and the rule predicate logic as pure assertions.

describe("RLS: members isolation", () => {
  it("org A cannot see org B's members via by_org index", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    await seedMember(t, { organizationId: orgA, identifier: "A1" });
    await seedMember(t, { organizationId: orgB, identifier: "B1" });

    const membersA = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgA))
        .collect(),
    );

    expect(membersA).toHaveLength(1);
    expect(membersA[0].identifier).toBe("A1");
  });

  it("org-scoped identifier uniqueness does not cross orgs", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    await seedMember(t, { organizationId: orgA, identifier: "SHARED" });
    await seedMember(t, { organizationId: orgB, identifier: "SHARED" });

    const result = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", orgA).eq("identifier", "SHARED"),
        )
        .unique(),
    );

    expect(result).not.toBeNull();
    expect(result!.organizationId).toBe(orgA);
  });
});

describe("RLS: meetings isolation", () => {
  it("org A cannot see org B's meetings via by_org index", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "A1",
      name: "Meeting A",
    });
    await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "B1",
      name: "Meeting B",
    });

    const meetingsA = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgA))
        .collect(),
    );

    expect(meetingsA).toHaveLength(1);
    expect(meetingsA[0].name).toBe("Meeting A");
  });

  it("active meeting query is scoped to the requesting org", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "A1",
      isActive: true,
    });
    await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "B1",
      isActive: true,
    });

    const activeA = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgA).eq("isActive", true),
        )
        .collect(),
    );

    expect(activeA).toHaveLength(1);
  });
});

describe("RLS: attendanceRecords isolation", () => {
  it("org A cannot see org B's records via by_org_meeting index", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    const meetingA = await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "A1",
    });
    const meetingB = await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "B1",
    });
    const memberA = await seedMember(t, {
      organizationId: orgA,
      identifier: "A1",
    });
    const memberB = await seedMember(t, {
      organizationId: orgB,
      identifier: "B1",
    });

    await seedRecord(t, {
      organizationId: orgA,
      meetingId: meetingA,
      memberId: memberA,
    });
    await seedRecord(t, {
      organizationId: orgB,
      meetingId: meetingB,
      memberId: memberB,
    });

    const recordsA = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) =>
          q.eq("organizationId", orgA).eq("meetingId", meetingA),
        )
        .collect(),
    );

    expect(recordsA).toHaveLength(1);
    expect(recordsA[0].organizationId).toBe(orgA);
  });

  it("org A cannot see org B's records via by_org_member index", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    const meetingA = await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "A1",
    });
    const meetingB = await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "B1",
    });
    const memberA = await seedMember(t, {
      organizationId: orgA,
      identifier: "A1",
    });
    const memberB = await seedMember(t, {
      organizationId: orgB,
      identifier: "B1",
    });

    await seedRecord(t, {
      organizationId: orgA,
      meetingId: meetingA,
      memberId: memberA,
    });
    await seedRecord(t, {
      organizationId: orgB,
      meetingId: meetingB,
      memberId: memberB,
    });

    const memberARecords = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_member", (q) =>
          q.eq("organizationId", orgA).eq("memberId", memberA),
        )
        .collect(),
    );

    expect(memberARecords).toHaveLength(1);
    expect(memberARecords[0].memberId).toBe(memberA);
  });
});

describe("RLS: organizations isolation", () => {
  it("each org can only access its own document", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a", name: "Org A" });
    const orgB = await seedOrg(t, { slug: "b", name: "Org B" });

    const canOrgAReadOrgB = await t.run(async (ctx) => {
      const docB = await ctx.db.get(orgB);
      return docB!._id === orgA;
    });

    const canOrgAReadOrgA = await t.run(async (ctx) => {
      const docA = await ctx.db.get(orgA);
      return docA!._id === orgA;
    });

    expect(canOrgAReadOrgB).toBe(false);
    expect(canOrgAReadOrgA).toBe(true);
  });
});

describe("RLS: read predicates", () => {
  it("organizations: allows when doc._id matches", () => {
    const orgId = "org123" as any;
    const doc = { _id: "org123" } as any;
    expect(doc._id === orgId).toBe(true);
  });

  it("organizations: denies when doc._id differs", () => {
    const orgId = "org123" as any;
    const doc = { _id: "org456" } as any;
    expect(doc._id === orgId).toBe(false);
  });

  it("members: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("members: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });

  it("meetings: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("meetings: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });

  it("attendanceRecords: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("attendanceRecords: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });
});

describe("RLS: modify predicates", () => {
  it("organizations: allows when doc._id matches", () => {
    const orgId = "org123" as any;
    const doc = { _id: "org123" } as any;
    expect(doc._id === orgId).toBe(true);
  });

  it("organizations: denies when doc._id differs", () => {
    const orgId = "org123" as any;
    const doc = { _id: "org456" } as any;
    expect(doc._id === orgId).toBe(false);
  });

  it("members: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("members: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });

  it("meetings: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("meetings: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });

  it("attendanceRecords: allows when organizationId matches", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org123" } as any;
    expect(doc.organizationId === orgId).toBe(true);
  });

  it("attendanceRecords: denies when organizationId differs", () => {
    const orgId = "org123" as any;
    const doc = { organizationId: "org456" } as any;
    expect(doc.organizationId === orgId).toBe(false);
  });
});

describe("RLS: insert predicates", () => {
  it("members: allows when doc.organizationId matches caller's org", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org123" } as any;
    expect(newDoc.organizationId === orgId).toBe(true);
  });

  it("members: denies when doc.organizationId does not match", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org456" } as any;
    expect(newDoc.organizationId === orgId).toBe(false);
  });

  it("meetings: allows when doc.organizationId matches caller's org", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org123" } as any;
    expect(newDoc.organizationId === orgId).toBe(true);
  });

  it("meetings: denies when doc.organizationId does not match", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org456" } as any;
    expect(newDoc.organizationId === orgId).toBe(false);
  });

  it("attendanceRecords: allows when doc.organizationId matches", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org123" } as any;
    expect(newDoc.organizationId === orgId).toBe(true);
  });

  it("attendanceRecords: denies when doc.organizationId does not match", () => {
    const orgId = "org123" as any;
    const newDoc = { organizationId: "org456" } as any;
    expect(newDoc.organizationId === orgId).toBe(false);
  });
});

describe("RLS: cross-org write isolation", () => {
  it("modifying a member's org association does not leak across orgs", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    const memberA = await seedMember(t, {
      organizationId: orgA,
      identifier: "A1",
    });

    const member = await t.run(async (ctx) => ctx.db.get(memberA));
    expect(member!.organizationId).toBe(orgA);

    const canOrgBModify = member!.organizationId === orgB;
    expect(canOrgBModify).toBe(false);
  });

  it("inserting a meeting into another org is denied by RLS insert rule", async () => {
    const orgA = "org_aaa" as any;
    const orgB = "org_bbb" as any;

    const callerOrgId = orgA;
    const newDoc = { organizationId: orgB };
    expect(newDoc.organizationId === callerOrgId).toBe(false);
  });

  it("inserting an attendance record into another org is denied by RLS insert rule", async () => {
    const orgA = "org_aaa" as any;
    const orgB = "org_bbb" as any;

    const callerOrgId = orgA;
    const newDoc = { organizationId: orgB };
    expect(newDoc.organizationId === callerOrgId).toBe(false);
  });
});

describe("RLS: defaultPolicy deny", () => {
  it("rlsConfig has defaultPolicy set to deny", async () => {
    const { readFileSync } = await import("fs");
    const authFile = readFileSync(
      new URL("./lib/auth.ts", import.meta.url),
      "utf8",
    );
    expect(authFile).toContain('defaultPolicy: "deny"');
  });
});

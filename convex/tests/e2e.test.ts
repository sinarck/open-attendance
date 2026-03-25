import { describe, expect, it } from "vite-plus/test";
import { convexTest, schema } from "./harness";
import { seedMeeting, seedMember, seedOrg, seedRecord } from "./test-helpers";

describe("E2E: signup -> onboarding -> dashboard", () => {
  it("full new-user lifecycle", async () => {
    const t = convexTest(schema);

    const orgId = await seedOrg(t, { authId: "auth_new", name: "", slug: "" });
    const placeholder = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(placeholder?.slug).toBe("");

    await t.run(async (ctx) => {
      const slugTaken = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "robotics"))
        .unique();
      expect(slugTaken).toBeNull();
      await ctx.db.patch(orgId, {
        name: "Robotics Club",
        slug: "robotics",
        timezone: "America/Chicago",
      });
    });

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org?.name).toBe("Robotics Club");
    expect(org?.slug).toBe("robotics");

    const meetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    const members = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
        .collect(),
    );
    expect(meetings).toHaveLength(0);
    expect(members).toHaveLength(0);
  });
});

describe("E2E: meeting + attendance", () => {
  it("records attendance for members", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const alice = await seedMember(t, {
      organizationId: orgId,
      identifier: "A",
    });
    const bob = await seedMember(t, { organizationId: orgId, identifier: "B" });
    await seedMember(t, { organizationId: orgId, identifier: "C" });
    const mtg = await seedMeeting(t, { organizationId: orgId });

    await seedRecord(t, {
      organizationId: orgId,
      meetingId: mtg,
      memberId: alice,
      status: "present",
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: mtg,
      memberId: bob,
      status: "late",
    });

    const records = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId).eq("meetingId", mtg))
        .collect(),
    );
    expect(records).toHaveLength(2);
    expect(records.map((r) => r.status).sort()).toEqual(["late", "present"]);

    const active = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
        .collect(),
    );
    expect(active).toHaveLength(3);
  });
});

describe("E2E: member archive lifecycle", () => {
  it("archive hides from active list, restore brings back", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const id = await seedMember(t, {
      organizationId: orgId,
      identifier: "ARC",
    });

    const query = async () =>
      t.run(async (ctx) =>
        ctx.db
          .query("members")
          .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
          .collect(),
      );

    expect(await query()).toHaveLength(1);

    await t.run(async (ctx) => ctx.db.patch(id, { isActive: false }));
    expect(await query()).toHaveLength(0);

    const all = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(false);

    await t.run(async (ctx) => ctx.db.patch(id, { isActive: true }));
    expect(await query()).toHaveLength(1);
  });
});

describe("E2E: meeting deactivation", () => {
  it("moves from active to closed list", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const mtg = await seedMeeting(t, { organizationId: orgId });

    const queryActive = async () =>
      t.run(async (ctx) =>
        ctx.db
          .query("meetings")
          .withIndex("by_org_active", (q) => q.eq("organizationId", orgId).eq("isActive", true))
          .collect(),
      );

    expect(await queryActive()).toHaveLength(1);

    await t.run(async (ctx) => ctx.db.patch(mtg, { isActive: false }));
    expect(await queryActive()).toHaveLength(0);

    const all = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    expect(all).toHaveLength(1);
    expect(all[0].isActive).toBe(false);
  });
});

describe("E2E: multi-org isolation", () => {
  it("org B sees nothing from org A", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "a" });
    const orgB = await seedOrg(t, { slug: "b" });

    const member = await seedMember(t, {
      organizationId: orgA,
      identifier: "A1",
    });
    const mtg = await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "iso",
    });
    await seedRecord(t, {
      organizationId: orgA,
      meetingId: mtg,
      memberId: member,
    });

    const bMembers = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgB))
        .collect(),
    );
    const bMeetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgB))
        .collect(),
    );
    const bRecords = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgB))
        .collect(),
    );

    expect(bMembers).toHaveLength(0);
    expect(bMeetings).toHaveLength(0);
    expect(bRecords).toHaveLength(0);

    const aMembers = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgA))
        .collect(),
    );
    expect(aMembers).toHaveLength(1);
  });
});

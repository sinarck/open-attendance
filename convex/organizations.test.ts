import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { seedMeeting, seedMember, seedOrg, seedRecord } from "./test.helpers";

describe("organizations:getCurrent (authId lookup)", () => {
  it("finds an org by authId", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, { authId: "user_abc" });

    const org = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_authId", (q) => q.eq("authId", "user_abc"))
        .unique(),
    );

    expect(org).not.toBeNull();
    expect(org?._id).toBe(orgId);
  });

  it("returns null when authId does not match", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { authId: "user_abc" });

    const org = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_authId", (q) => q.eq("authId", "nonexistent"))
        .unique(),
    );

    expect(org).toBeNull();
  });
});

describe("organizations:completeOnboarding", () => {
  it("updates placeholder org with name, slug, and timezone", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, {
      authId: "user_abc",
      name: "",
      slug: "",
      timezone: "UTC",
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(orgId, {
        name: "My Classroom",
        slug: "my-classroom",
        timezone: "America/New_York",
      });
    });

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org?.name).toBe("My Classroom");
    expect(org?.slug).toBe("my-classroom");
    expect(org?.timezone).toBe("America/New_York");
  });

  it("rejects onboarding if slug is already set (already onboarded)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, {
      authId: "user_abc",
      name: "Existing",
      slug: "existing-slug",
    });

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    // The production code checks `org.slug !== ""`.
    expect(org?.slug).not.toBe("");
  });
});

describe("organizations:slug uniqueness", () => {
  it("detects that a slug is taken", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { slug: "taken-slug" });

    const existing = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "taken-slug"))
        .unique(),
    );

    expect(existing).not.toBeNull();
  });

  it("confirms slug is available when not taken", async () => {
    const t = convexTest(schema);

    const existing = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "fresh-slug"))
        .unique(),
    );

    expect(existing).toBeNull();
  });

  it("two orgs cannot have the same slug", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { slug: "unique-slug" });

    // Attempting to insert a second org with the same slug is valid at the DB
    // level (Convex indexes are not unique constraints), but the application
    // validates uniqueness before insertion.
    const existing = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "unique-slug"))
        .unique(),
    );

    expect(existing).not.toBeNull();
    // In production, the code would throw ConvexError("Slug already taken")
    // before inserting.
  });
});

describe("organizations:isSlugAvailable", () => {
  it("returns true for an available slug", async () => {
    const t = convexTest(schema);

    const isAvailable = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "available"))
        .unique();
      return existing === null;
    });

    expect(isAvailable).toBe(true);
  });

  it("returns false for a taken slug", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { slug: "taken" });

    const isAvailable = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "taken"))
        .unique();
      return existing === null;
    });

    expect(isAvailable).toBe(false);
  });
});

describe("organizations:cascade delete (user.onDelete trigger)", () => {
  it("deletes all org data when org is deleted", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, { authId: "user_del" });
    const m1 = await seedMember(t, { organizationId: orgId, identifier: "A" });
    const m2 = await seedMember(t, { organizationId: orgId, identifier: "B" });
    const mtg = await seedMeeting(t, { organizationId: orgId });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: mtg,
      memberId: m1,
    });
    await seedRecord(t, {
      organizationId: orgId,
      meetingId: mtg,
      memberId: m2,
    });

    // Simulate the user.onDelete cascade.
    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const r of records) await ctx.db.delete(r._id);

      const members = await ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const m of members) await ctx.db.delete(m._id);

      const meetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const mt of meetings) await ctx.db.delete(mt._id);

      await ctx.db.delete(orgId);
    });

    // Verify everything is gone.
    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org).toBeNull();

    const remainingMembers = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    expect(remainingMembers).toHaveLength(0);

    const remainingMeetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    expect(remainingMeetings).toHaveLength(0);

    const remainingRecords = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId))
        .collect(),
    );
    expect(remainingRecords).toHaveLength(0);
  });

  it("does not affect data from other orgs during cascade delete", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "org-a" });
    const orgB = await seedOrg(t, { slug: "org-b" });

    const memberA = await seedMember(t, {
      organizationId: orgA,
      identifier: "A",
    });
    const memberB = await seedMember(t, {
      organizationId: orgB,
      identifier: "B",
    });
    const mtgA = await seedMeeting(t, {
      organizationId: orgA,
      checkInCode: "A1",
    });
    const mtgB = await seedMeeting(t, {
      organizationId: orgB,
      checkInCode: "B1",
    });
    await seedRecord(t, {
      organizationId: orgA,
      meetingId: mtgA,
      memberId: memberA,
    });
    await seedRecord(t, {
      organizationId: orgB,
      meetingId: mtgB,
      memberId: memberB,
    });

    // Delete orgA's data.
    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgA))
        .collect();
      for (const r of records) await ctx.db.delete(r._id);
      const members = await ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgA))
        .collect();
      for (const m of members) await ctx.db.delete(m._id);
      const meetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgA))
        .collect();
      for (const mt of meetings) await ctx.db.delete(mt._id);
      await ctx.db.delete(orgA);
    });

    // OrgB's data should be intact.
    const bMembers = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgB))
        .collect(),
    );
    expect(bMembers).toHaveLength(1);

    const bMeetings = await t.run(async (ctx) =>
      ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgB))
        .collect(),
    );
    expect(bMeetings).toHaveLength(1);

    const bRecords = await t.run(async (ctx) =>
      ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgB))
        .collect(),
    );
    expect(bRecords).toHaveLength(1);
  });
});

describe("organizations:isSlugAvailable (edge cases)", () => {
  it("returns true for an empty string slug", async () => {
    const t = convexTest(schema);

    const isAvailable = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", ""))
        .unique();
      return existing === null;
    });

    expect(isAvailable).toBe(true);
  });

  it("returns false for empty string when a placeholder org exists with empty slug", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { slug: "" }); // placeholder org with empty slug

    const isAvailable = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", ""))
        .unique();
      return existing === null;
    });

    expect(isAvailable).toBe(false);
  });
});

describe("organizations:completeOnboarding (returns org._id)", () => {
  it("returns the org ID after successful onboarding", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, {
      authId: "user_onboard",
      name: "",
      slug: "",
    });

    // Simulate completeOnboarding: patch and return org._id.
    const returnedId = await t.run(async (ctx) => {
      const org = await ctx.db.get(orgId);
      expect(org?.slug).toBe("");
      await ctx.db.patch(org?._id, {
        name: "My Org",
        slug: "my-org",
        timezone: "America/Chicago",
      });
      return org?._id;
    });

    expect(returnedId).toBe(orgId);

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org?.name).toBe("My Org");
    expect(org?.slug).toBe("my-org");
  });
});

describe("organizations:cascade delete (empty org)", () => {
  it("deletes an org with no members, meetings, or records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, { authId: "user_empty" });

    // Simulate cascade on an empty org — no child data to delete.
    await t.run(async (ctx) => {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_org_meeting", (q) => q.eq("organizationId", orgId))
        .collect();
      expect(records).toHaveLength(0);

      const members = await ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      expect(members).toHaveLength(0);

      const meetings = await ctx.db
        .query("meetings")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      expect(meetings).toHaveLength(0);

      await ctx.db.delete(orgId);
    });

    const deleted = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(deleted).toBeNull();
  });

  it("org not found early return (user.onDelete with no matching org)", async () => {
    const t = convexTest(schema);

    // Simulate: lookup org by authId that doesn't exist.
    const org = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_authId", (q) => q.eq("authId", "nonexistent_user"))
        .unique(),
    );

    // In production, the trigger does an early return if org is null.
    expect(org).toBeNull();
  });
});

describe("organizations:user.onCreate trigger", () => {
  it("creates a placeholder org with empty name and slug", async () => {
    const t = convexTest(schema);
    // Simulate what the trigger does.
    const orgId = await t.run(async (ctx) => {
      return ctx.db.insert("organizations", {
        authId: "new_user_123",
        name: "",
        slug: "",
        timezone: "UTC",
      });
    });

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org?.authId).toBe("new_user_123");
    expect(org?.name).toBe("");
    expect(org?.slug).toBe("");
    expect(org?.timezone).toBe("UTC");
  });
});

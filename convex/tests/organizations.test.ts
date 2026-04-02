import { describe, expect, it } from "vite-plus/test";
import { api } from "../_generated/api";
import { seedAuthedUser, seedMeeting, seedMember, seedOrg, seedRecord } from "../lib/seed";
import {
  cleanupDeletedAuthOrganizationBatch,
  createOrganizationForAuthUser,
} from "../organizations";
import { convexTest, schema } from "./harness";

async function runCleanupToCompletion(
  t: ReturnType<typeof convexTest>,
  organizationId: Awaited<ReturnType<typeof seedOrg>>,
) {
  for (let iteration = 0; iteration < 20; iteration += 1) {
    const status = await t.run((ctx) => cleanupDeletedAuthOrganizationBatch(ctx, organizationId));

    if (status === "done") {
      return;
    }
  }

  throw new Error("Expected organization cleanup to finish");
}

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

describe("organizations:createForAuthUser", () => {
  it("creates the org for a freshly signed-up auth user", async () => {
    const t = convexTest(schema);

    const result = await t.run(async (ctx) =>
      createOrganizationForAuthUser(ctx, "user_missing_org", {
        name: "New Org",
        slug: "new-org",
        timezone: "America/Chicago",
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected organization id");
    }

    const orgId = result.id;
    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org?.authId).toBe("user_missing_org");
    expect(org?.name).toBe("New Org");
    expect(org?.slug).toBe("new-org");
    expect(org?.timezone).toBe("America/Chicago");
  });

  it("rejects creation if the auth user already has an organization", async () => {
    const t = convexTest(schema);
    await seedOrg(t, {
      authId: "existing-user",
      name: "Existing Org",
      slug: "existing-org",
    });

    const result = await t.run(async (ctx) =>
      createOrganizationForAuthUser(ctx, "existing-user", {
        name: "Another Org",
        slug: "another-org",
        timezone: "America/Chicago",
      }),
    );

    expect(result).toEqual({
      code: "exists",
      message: "Organization already exists for this account",
      ok: false,
    });
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

  it("two orgs cannot have the same slug at the application layer", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, {
      authId: "existing-user",
      slug: "unique-slug",
    });

    const result = await t.run(async (ctx) =>
      createOrganizationForAuthUser(ctx, "new-user", {
        name: "Different Org",
        slug: "unique-slug",
        timezone: "America/Chicago",
      }),
    );

    expect(result).toEqual({
      code: "slug",
      message: "Slug already taken",
      ok: false,
    });

    const existing = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(existing?.slug).toBe("unique-slug");
  });
});

describe("organizations:isSlugAvailable", () => {
  it("returns true for an available slug", async () => {
    const t = convexTest(schema);

    const isAvailable = await t.query(api.organizations.isSlugAvailable, {
      slug: "available",
    });

    expect(isAvailable).toBe(true);
  });

  it("returns false for a taken slug", async () => {
    const t = convexTest(schema);
    await seedOrg(t, { slug: "taken" });

    const isAvailable = await t.query(api.organizations.isSlugAvailable, {
      slug: "taken",
    });

    expect(isAvailable).toBe(false);
  });

  it("returns false for slugs shorter than 2 characters", async () => {
    const t = convexTest(schema);

    const isAvailable = await t.query(api.organizations.isSlugAvailable, {
      slug: "a",
    });

    expect(isAvailable).toBe(false);
  });
});

describe("organizations:cascade delete", () => {
  it("deletes all org data in bounded batches", async () => {
    const t = convexTest(schema);
    const { userId } = await seedAuthedUser(t, { email: "cleanup@example.com" });
    const orgId = await seedOrg(t, { authId: userId, slug: "cleanup-org" });
    const mtg = await seedMeeting(t, { organizationId: orgId });
    for (let index = 0; index < 70; index += 1) {
      const memberId = await seedMember(t, {
        organizationId: orgId,
        identifier: `ID-${index}`,
        name: `Member ${index}`,
      });
      await seedRecord(t, {
        organizationId: orgId,
        meetingId: mtg,
        memberId,
      });
    }

    await runCleanupToCompletion(t, orgId);

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
    const { userId } = await seedAuthedUser(t, { email: "org-a@example.com" });
    const orgA = await seedOrg(t, { authId: userId, slug: "org-a" });
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

    await runCleanupToCompletion(t, orgA);

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

describe("organizations:cascade delete (empty org)", () => {
  it("deletes an org with no members, meetings, or records", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, { authId: "user_empty" });

    await runCleanupToCompletion(t, orgId);

    const deleted = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(deleted).toBeNull();
  });

  it("returns early when cleanup reruns after the org is already gone", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t, { authId: "user_repeat", slug: "repeat-org" });

    await runCleanupToCompletion(t, orgId);
    await runCleanupToCompletion(t, orgId);

    const org = await t.run(async (ctx) => ctx.db.get(orgId));
    expect(org).toBeNull();
  });
});

describe("organizations:user creation", () => {
  it("does not create an organization before sign-up provisioning runs", async () => {
    const t = convexTest(schema);
    const { userId } = await seedAuthedUser(t);

    const org = await t.run(async (ctx) =>
      ctx.db
        .query("organizations")
        .withIndex("by_authId", (q) => q.eq("authId", userId))
        .unique(),
    );

    expect(org).toBeNull();
  });
});

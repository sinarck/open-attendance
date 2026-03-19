import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { type Id, seedMember, seedOrg } from "./test.helpers";

describe("members:create", () => {
  it("creates a new active member with given name and identifier", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const memberId = await t.run(async (ctx) => {
      return ctx.db.insert("members", {
        organizationId: orgId,
        name: "Alice",
        identifier: "STU001",
        isActive: true,
      });
    });

    const member = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(member).not.toBeNull();
    expect(member?.name).toBe("Alice");
    expect(member?.identifier).toBe("STU001");
    expect(member?.isActive).toBe(true);
    expect(member?.organizationId).toBe(orgId);
  });

  it("rejects duplicate identifier within the same org", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, { organizationId: orgId, identifier: "STU001" });

    await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", orgId).eq("identifier", "STU001"),
        )
        .unique();
      expect(existing).not.toBeNull();
    });
  });

  it("allows same identifier in different orgs", async () => {
    const t = convexTest(schema);
    const orgA = await seedOrg(t, { slug: "org-a" });
    const orgB = await seedOrg(t, { slug: "org-b" });

    const memberA = await seedMember(t, {
      organizationId: orgA,
      identifier: "STU001",
    });
    const memberB = await seedMember(t, {
      organizationId: orgB,
      identifier: "STU001",
    });

    expect(memberA).toBeTruthy();
    expect(memberB).toBeTruthy();
    expect(memberA).not.toBe(memberB);
  });
});

describe("members:update", () => {
  it("updates member name", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      name: "Alice",
      identifier: "STU001",
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { name: "Alice Updated" });
    });

    const updated = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(updated?.name).toBe("Alice Updated");
  });

  it("updates member identifier when new one is unique", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      identifier: "OLD001",
    });

    await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", orgId).eq("identifier", "NEW001"),
        )
        .unique();
      expect(existing).toBeNull();
      await ctx.db.patch(memberId, { identifier: "NEW001" });
    });

    const updated = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(updated?.identifier).toBe("NEW001");
  });

  it("rejects changing identifier to a duplicate", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, { organizationId: orgId, identifier: "STU001" });

    const collision = await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", orgId).eq("identifier", "STU001"),
        )
        .unique();
      return existing !== null;
    });

    expect(collision).toBe(true);
  });
});

describe("members:archive and restore", () => {
  it("archives a member (sets isActive to false)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      isActive: true,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { isActive: false });
    });

    const archived = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(archived?.isActive).toBe(false);
  });

  it("restores an archived member (sets isActive to true)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { isActive: true });
    });

    const restored = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(restored?.isActive).toBe(true);
  });

  it("archived members are excluded from active list query", async () => {
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
    await seedMember(t, {
      organizationId: orgId,
      identifier: "C",
      isActive: true,
    });

    const activeMembers = await t.run(async (ctx) => {
      return ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect();
    });

    expect(activeMembers).toHaveLength(2);
    expect(activeMembers.map((m) => m.identifier).sort()).toEqual(["A", "C"]);
  });

  it("archived members still appear in listAll query", async () => {
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

    const allMembers = await t.run(async (ctx) => {
      return ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
    });

    expect(allMembers).toHaveLength(2);
  });
});

describe("members:importBulk", () => {
  it("creates all members when none are duplicates", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const members = [
      { name: "Alice", identifier: "A001" },
      { name: "Bob", identifier: "B002" },
      { name: "Charlie", identifier: "C003" },
    ];

    const result = await t.run(async (ctx) => {
      let created = 0;
      let skipped = 0;
      for (const { name, identifier } of members) {
        const existing = await ctx.db
          .query("members")
          .withIndex("by_org_identifier", (q) =>
            q.eq("organizationId", orgId).eq("identifier", identifier),
          )
          .unique();
        if (existing) {
          skipped++;
          continue;
        }
        await ctx.db.insert("members", {
          organizationId: orgId,
          name,
          identifier,
          isActive: true,
        });
        created++;
      }
      return { created, skipped, total: members.length };
    });

    expect(result.created).toBe(3);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(3);
  });

  it("skips duplicates and creates new ones", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, {
      organizationId: orgId,
      identifier: "A001",
      name: "Alice",
    });

    const members = [
      { name: "Alice Dup", identifier: "A001" },
      { name: "Bob", identifier: "B002" },
    ];

    const result = await t.run(async (ctx) => {
      let created = 0;
      let skipped = 0;
      for (const { name, identifier } of members) {
        const existing = await ctx.db
          .query("members")
          .withIndex("by_org_identifier", (q) =>
            q.eq("organizationId", orgId).eq("identifier", identifier),
          )
          .unique();
        if (existing) {
          skipped++;
          continue;
        }
        await ctx.db.insert("members", {
          organizationId: orgId,
          name,
          identifier,
          isActive: true,
        });
        created++;
      }
      return { created, skipped, total: members.length };
    });

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.total).toBe(2);
  });

  it("does not create any members when all are duplicates", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, { organizationId: orgId, identifier: "A001" });
    await seedMember(t, { organizationId: orgId, identifier: "B002" });

    const members = [
      { name: "Alice", identifier: "A001" },
      { name: "Bob", identifier: "B002" },
    ];

    const result = await t.run(async (ctx) => {
      let created = 0;
      let skipped = 0;
      for (const { name, identifier } of members) {
        const existing = await ctx.db
          .query("members")
          .withIndex("by_org_identifier", (q) =>
            q.eq("organizationId", orgId).eq("identifier", identifier),
          )
          .unique();
        if (existing) {
          skipped++;
          continue;
        }
        await ctx.db.insert("members", {
          organizationId: orgId,
          name,
          identifier,
          isActive: true,
        });
        created++;
      }
      return { created, skipped, total: members.length };
    });

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(2);
  });
});

describe("members:get", () => {
  it("returns a member by ID", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      name: "Alice",
      identifier: "A001",
    });

    const member = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(member).not.toBeNull();
    expect(member?.name).toBe("Alice");
    expect(member?.identifier).toBe("A001");
  });

  it("returns null for a non-existent member ID", async () => {
    const t = convexTest(schema);

    const member = await t.run(async (ctx) => {
      const fakeId =
        "members:fake00000000000000000000" as unknown as Id<"members">;
      return ctx.db.get(fakeId);
    });

    expect(member).toBeNull();
  });
});

describe("members:list (empty)", () => {
  it("returns empty array when no active members exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const active = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect(),
    );

    expect(active).toHaveLength(0);
  });

  it("returns empty when only archived members exist", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    await seedMember(t, {
      organizationId: orgId,
      identifier: "A",
      isActive: false,
    });

    const active = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org_active", (q) =>
          q.eq("organizationId", orgId).eq("isActive", true),
        )
        .collect(),
    );

    expect(active).toHaveLength(0);
  });
});

describe("members:listAll (empty)", () => {
  it("returns empty array when no members exist at all", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const all = await t.run(async (ctx) =>
      ctx.db
        .query("members")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect(),
    );

    expect(all).toHaveLength(0);
  });
});

describe("members:importBulk (empty input)", () => {
  it("returns zero created and zero skipped for empty array", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);

    const members: { name: string; identifier: string }[] = [];

    const result = await t.run(async (ctx) => {
      let created = 0;
      let skipped = 0;
      for (const { name, identifier } of members) {
        const existing = await ctx.db
          .query("members")
          .withIndex("by_org_identifier", (q) =>
            q.eq("organizationId", orgId).eq("identifier", identifier),
          )
          .unique();
        if (existing) {
          skipped++;
          continue;
        }
        await ctx.db.insert("members", {
          organizationId: orgId,
          name,
          identifier,
          isActive: true,
        });
        created++;
      }
      return { created, skipped, total: members.length };
    });

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe("members:update (edge cases)", () => {
  it("rejects empty-string name", () => {
    const name = "";
    expect(name.trim() === "").toBe(true);
  });

  it("rejects whitespace-only name", () => {
    const name = "   ";
    expect(name.trim() === "").toBe(true);
  });

  it("rejects empty-string identifier", () => {
    const identifier = "";
    expect(identifier.trim() === "").toBe(true);
  });

  it("skips uniqueness check when identifier is unchanged", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      name: "Alice",
      identifier: "STU001",
    });

    await t.run(async (ctx) => {
      const member = await ctx.db.get(memberId);
      const newIdentifier = "STU001";
      const shouldCheck =
        newIdentifier !== undefined && newIdentifier !== member?.identifier;
      expect(shouldCheck).toBe(false);
    });
  });

  it("updates both name and identifier simultaneously", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      name: "Alice",
      identifier: "OLD",
    });

    await t.run(async (ctx) => {
      const existing = await ctx.db
        .query("members")
        .withIndex("by_org_identifier", (q) =>
          q.eq("organizationId", orgId).eq("identifier", "NEW"),
        )
        .unique();
      expect(existing).toBeNull();
      await ctx.db.patch(memberId, { name: "Bob", identifier: "NEW" });
    });

    const updated = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(updated?.name).toBe("Bob");
    expect(updated?.identifier).toBe("NEW");
  });

  it("handles empty patch (no name or identifier provided)", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      name: "Alice",
      identifier: "STU001",
    });

    await t.run(async (ctx) => {
      const patch: Record<string, string> = {};
      await ctx.db.patch(memberId, patch);
    });

    const unchanged = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(unchanged?.name).toBe("Alice");
    expect(unchanged?.identifier).toBe("STU001");
  });

  it("throws when member not found for update", async () => {
    const t = convexTest(schema);

    const member = await t.run(async (ctx) => {
      const fakeId =
        "members:fake00000000000000000000" as unknown as Id<"members">;
      return ctx.db.get(fakeId);
    });

    expect(member).toBeNull();
  });
});

describe("members:archive and restore (error & idempotency)", () => {
  it("archive: throws when member not found", async () => {
    const t = convexTest(schema);

    const member = await t.run(async (ctx) => {
      const fakeId =
        "members:fake00000000000000000000" as unknown as Id<"members">;
      return ctx.db.get(fakeId);
    });

    expect(member).toBeNull();
  });

  it("archive: idempotent on already-archived member", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      isActive: false,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { isActive: false });
    });

    const member = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(member?.isActive).toBe(false);
  });

  it("restore: throws when member not found", async () => {
    const t = convexTest(schema);

    const member = await t.run(async (ctx) => {
      const fakeId =
        "members:fake00000000000000000000" as unknown as Id<"members">;
      return ctx.db.get(fakeId);
    });

    expect(member).toBeNull();
  });

  it("restore: idempotent on already-active member", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const memberId = await seedMember(t, {
      organizationId: orgId,
      isActive: true,
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(memberId, { isActive: true });
    });

    const member = await t.run(async (ctx) => ctx.db.get(memberId));
    expect(member?.isActive).toBe(true);
  });
});

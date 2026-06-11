import { describe, expect, it } from "vite-plus/test";
import { api } from "../_generated/api";
import { seedAuthedOrg, seedMember } from "../lib/seed";
import { convexTest, schema } from "./harness";

describe("members:previewImport", () => {
  it("classifies invalid rows, file duplicates, and roster conflicts", async () => {
    const t = convexTest(schema);
    const org = await seedAuthedOrg(t, {
      email: "members-preview@example.com",
      name: "Preview Org",
      slug: "preview-org",
    });

    await seedMember(t, {
      organizationId: org.orgId,
      identifier: "ACTIVE-001",
      name: "Existing Active",
    });
    await seedMember(t, {
      organizationId: org.orgId,
      identifier: "ARCHIVED-001",
      isActive: false,
      name: "Existing Archived",
    });

    const preview = await org.asUser.query(api.members.previewImport, {
      rows: [
        { rowNumber: 2, name: "Ada Lovelace", identifier: "NEW-001" },
        { rowNumber: 3, name: "   ", identifier: "NEW-002" },
        { rowNumber: 4, name: "Grace Hopper", identifier: "   " },
        { rowNumber: 5, name: "Linus Torvalds", identifier: "NEW-001" },
        { rowNumber: 6, name: "Margaret Hamilton", identifier: " ACTIVE-001 " },
        { rowNumber: 7, name: "Barbara Liskov", identifier: "ARCHIVED-001" },
      ],
    });

    expect(preview.summary.totalRows).toBe(6);
    expect(preview.summary.validRows).toBe(1);
    expect(preview.summary.invalidNames).toBe(1);
    expect(preview.summary.invalidIdentifiers).toBe(1);
    expect(preview.summary.duplicateIdentifiersInFile).toBe(1);
    expect(preview.summary.activeConflicts).toBe(1);
    expect(preview.summary.archivedConflicts).toBe(1);

    expect(preview.rows.map((row) => row.code ?? "valid")).toEqual([
      "valid",
      "invalid_name",
      "invalid_identifier",
      "duplicate_identifier_in_file",
      "duplicate_identifier",
      "duplicate_identifier_in_archived_roster",
    ]);
    expect(preview.rows[4]?.normalizedIdentifier).toBe("ACTIVE-001");
  });
});

describe("members:importMembers", () => {
  it("imports only valid rows and applies the same normalization rules as manual create", async () => {
    const t = convexTest(schema);
    const org = await seedAuthedOrg(t, {
      email: "members-import@example.com",
      name: "Import Org",
      slug: "import-org",
    });

    await seedMember(t, {
      organizationId: org.orgId,
      identifier: "ACTIVE-001",
      name: "Existing Active",
    });
    await seedMember(t, {
      organizationId: org.orgId,
      identifier: "ARCHIVED-001",
      isActive: false,
      name: "Existing Archived",
    });

    const result = await org.asUser.mutation(api.members.importMembers, {
      rows: [
        { rowNumber: 2, name: "  Ada   Lovelace  ", identifier: " NEW-001 " },
        { rowNumber: 3, name: "Grace Hopper", identifier: "ACTIVE-001" },
        { rowNumber: 4, name: "  Alan   Turing ", identifier: " NEW-002 " },
        { rowNumber: 5, name: "Barbara Liskov", identifier: "ARCHIVED-001" },
      ],
    });

    expect(result.importedCount).toBe(2);
    expect(result.skippedCount).toBe(2);
    expect(result.summary.validRows).toBe(2);
    expect(result.summary.activeConflicts).toBe(1);
    expect(result.summary.archivedConflicts).toBe(1);

    const roster = await org.asUser.query(api.members.listRoster, {});
    expect(roster.active.map((member) => member.identifier).sort()).toEqual([
      "ACTIVE-001",
      "NEW-001",
      "NEW-002",
    ]);
    expect(roster.active.map((member) => member.name).sort()).toEqual([
      "Ada Lovelace",
      "Alan Turing",
      "Existing Active",
    ]);
    expect(roster.archived.map((member) => member.identifier)).toEqual(["ARCHIVED-001"]);
  });
});

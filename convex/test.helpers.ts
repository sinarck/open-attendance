/** Shared test factories for seeding the Convex DB, bypassing auth/RLS. */

import type { TestConvex } from "convex-test";
import type { Id } from "./_generated/dataModel";
import type schema from "./schema";

export type { Id };
export type T = TestConvex<typeof schema>;

export interface SeedOrgOpts {
  authId?: string;
  name?: string;
  slug?: string;
  timezone?: string;
}

export async function seedOrg(
  t: T,
  opts: SeedOrgOpts = {},
): Promise<Id<"organizations">> {
  return t.run(async (ctx) => {
    return ctx.db.insert("organizations", {
      authId: opts.authId ?? `auth_${Math.random().toString(36).slice(2, 10)}`,
      name: opts.name ?? "Test Org",
      slug: opts.slug ?? `test-${Math.random().toString(36).slice(2, 10)}`,
      timezone: opts.timezone ?? "UTC",
    });
  });
}

export interface SeedMemberOpts {
  organizationId: Id<"organizations">;
  name?: string;
  identifier?: string;
  isActive?: boolean;
}

export async function seedMember(
  t: T,
  opts: SeedMemberOpts,
): Promise<Id<"members">> {
  return t.run(async (ctx) => {
    return ctx.db.insert("members", {
      organizationId: opts.organizationId,
      name: opts.name ?? "Test Member",
      identifier:
        opts.identifier ?? `ID-${Math.random().toString(36).slice(2, 10)}`,
      isActive: opts.isActive ?? true,
    });
  });
}

export interface SeedMeetingOpts {
  organizationId: Id<"organizations">;
  name?: string;
  startTime?: number;
  endTime?: number;
  checkInCode?: string;
  isActive?: boolean;
  lateAfter?: number;
  requireFingerprint?: boolean;
  geoFenceLatitude?: number;
  geoFenceLongitude?: number;
  geoFenceRadiusM?: number;
  description?: string;
  location?: string;
  tags?: string[];
}

export async function seedMeeting(
  t: T,
  opts: SeedMeetingOpts,
): Promise<Id<"meetings">> {
  const now = Date.now();
  return t.run(async (ctx) => {
    return ctx.db.insert("meetings", {
      organizationId: opts.organizationId,
      name: opts.name ?? "Test Meeting",
      description: opts.description,
      location: opts.location,
      startTime: opts.startTime ?? now - 60_000,
      endTime: opts.endTime ?? now + 60 * 60_000,
      lateAfter: opts.lateAfter ?? opts.endTime ?? now + 60 * 60_000,
      checkInCode: opts.checkInCode ?? "ABC123",
      isActive: opts.isActive ?? true,
      tags: opts.tags,
      geoFenceLatitude: opts.geoFenceLatitude,
      geoFenceLongitude: opts.geoFenceLongitude,
      geoFenceRadiusM: opts.geoFenceRadiusM,
      requireFingerprint: opts.requireFingerprint ?? false,
    });
  });
}

export interface SeedRecordOpts {
  organizationId: Id<"organizations">;
  meetingId: Id<"meetings">;
  memberId: Id<"members">;
  status?: "present" | "late" | "excused";
  method?: "self" | "manual";
  deviceFingerprint?: string;
}

export async function seedRecord(
  t: T,
  opts: SeedRecordOpts,
): Promise<Id<"attendanceRecords">> {
  return t.run(async (ctx) => {
    return ctx.db.insert("attendanceRecords", {
      organizationId: opts.organizationId,
      meetingId: opts.meetingId,
      memberId: opts.memberId,
      status: opts.status ?? "present",
      method: opts.method ?? "self",
      deviceFingerprint: opts.deviceFingerprint,
    });
  });
}

import { describe, expect, it } from "vite-plus/test";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { seedAuthedOrg, seedMeeting, seedMember, seedOrg, seedRecord } from "../lib/seed";
import { convexTest, schema } from "./harness";

async function expectRateLimited(promise: Promise<unknown>, name: string) {
  await expect(promise).rejects.toSatisfy((error: { data?: string }) => {
    const data = JSON.parse(error.data ?? "null") as {
      kind?: string;
      name?: string;
    } | null;

    return data?.kind === "RateLimited" && data.name === name;
  });
}

async function drainOrgWriteBudget(
  runMutation: (args: { meetingId: Id<"meetings">; name: string }) => Promise<unknown>,
  meetingId: Id<"meetings">,
) {
  for (let index = 0; index < 60; index += 1) {
    await runMutation({
      meetingId,
      name: `Drain ${index}`,
    });
  }
}

describe("rate limits: checkIn", () => {
  it("limits self check-in throughput per meeting", async () => {
    const t = convexTest(schema);
    const orgId = await seedOrg(t);
    const now = Date.now();

    await seedMeeting(t, {
      organizationId: orgId,
      checkInCode: "RATE-LIMIT-CODE",
      isActive: true,
      startTime: now - 60_000,
      endTime: now + 60 * 60_000,
    });

    for (let index = 0; index < 30; index += 1) {
      await seedMember(t, {
        organizationId: orgId,
        identifier: `STU-${index.toString().padStart(2, "0")}`,
      });
    }

    for (let index = 0; index < 30; index += 1) {
      await t.mutation(api.attendance.checkIn, {
        code: "RATE-LIMIT-CODE",
        identifier: `STU-${index.toString().padStart(2, "0")}`,
      });
    }

    await seedMember(t, {
      organizationId: orgId,
      identifier: "STU-30",
    });

    await expectRateLimited(
      t.mutation(api.attendance.checkIn, {
        code: "RATE-LIMIT-CODE",
        identifier: "STU-30",
      }),
      "checkIn",
    );
  });
});

describe("rate limits: orgWrite", () => {
  it("limits member creation", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(
      asUser.mutation(api.members.create, {
        name: "Rate Limited Member",
        identifier: "RATE-LIMIT-MEMBER",
      }),
      "orgWrite",
    );
  });

  it("limits member archive", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(asUser.mutation(api.members.archive, { memberId }), "orgWrite");
  });

  it("limits member restore", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const memberId = await seedMember(t, {
      organizationId: orgId,
      isActive: false,
    });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(asUser.mutation(api.members.restore, { memberId }), "orgWrite");
  });

  it("limits meeting activation", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const targetMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Target Meeting",
      isActive: false,
      checkInCode: "TARGET-ACTIVATE",
    });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(
      asUser.mutation(api.meetings.activate, { meetingId: targetMeetingId }),
      "orgWrite",
    );
  });

  it("limits meeting creation", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const now = Date.now();

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(
      asUser.mutation(api.meetings.create, {
        name: "Rate Limited Meeting",
        startTime: now,
        endTime: now + 60 * 60_000,
      }),
      "orgWrite",
    );
  });

  it("limits meeting deactivation", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const targetMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Target Meeting",
      isActive: true,
      checkInCode: "TARGET-DEACTIVATE",
    });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(
      asUser.mutation(api.meetings.deactivate, { meetingId: targetMeetingId }),
      "orgWrite",
    );
  });

  it("limits attendance record removal", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const targetMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Target Meeting",
      checkInCode: "TARGET-RECORD",
    });
    const memberId = await seedMember(t, { organizationId: orgId });
    const recordId = await seedRecord(t, {
      organizationId: orgId,
      meetingId: targetMeetingId,
      memberId,
    });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(asUser.mutation(api.attendance.removeRecord, { recordId }), "orgWrite");
  });

  it("limits manual attendance upserts", async () => {
    const t = convexTest(schema);
    const { asUser, orgId } = await seedAuthedOrg(t);
    const drainMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Drain Meeting",
      isActive: false,
    });
    const targetMeetingId = await seedMeeting(t, {
      organizationId: orgId,
      name: "Target Meeting",
      checkInCode: "TARGET-MANUAL",
    });
    const memberId = await seedMember(t, { organizationId: orgId });

    await drainOrgWriteBudget((args) => asUser.mutation(api.meetings.update, args), drainMeetingId);

    await expectRateLimited(
      asUser.mutation(api.attendance.markManual, {
        meetingId: targetMeetingId,
        memberId,
        status: "present",
      }),
      "orgWrite",
    );
  });
});

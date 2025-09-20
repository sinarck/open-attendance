import { eq, inArray } from "drizzle-orm";
import db from "@/db";
import { meetings, members } from "@/db/schema/schema";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }

  const now = new Date();

  // Create or update a dedicated e2e meeting without touching existing data
  const slug = "e2e-playwright";
  const existingMeeting = (
    await db.select().from(meetings).where(eq(meetings.slug, slug))
  )[0];

  let meetingRow = existingMeeting;
  if (!meetingRow) {
    [meetingRow] = await db
      .insert(meetings)
      .values({
        name: "E2E Concurrency Test Meeting",
        description: "seeded for playwright",
        slug,
        startAt: new Date(now.getTime() - 60_000),
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        centerLat: 37.7749,
        centerLng: -122.4194,
        radiusM: 100,
        active: true,
        strict: true,
      })
      .returning();
  } else {
    // Ensure it's active for the test window
    const [updated] = await db
      .update(meetings)
      .set({
        startAt: new Date(now.getTime() - 60_000),
        endAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        active: true,
      })
      .where(eq(meetings.id, meetingRow.id))
      .returning();
    meetingRow = updated;
  }

  // Upsert a fixed range of 500 members without deleting anything
  const desiredClubIds = Array.from({ length: 500 }, (_, i) =>
    (100000 + i).toString(),
  );
  const existingMembers = await db
    .select({ clubId: members.clubId })
    .from(members)
    .where(inArray(members.clubId, desiredClubIds));
  const have = new Set(existingMembers.map((m) => m.clubId));

  const toInsert = desiredClubIds
    .filter((id) => !have.has(id))
    .map((id, idx) => ({
      name: `Member ${String(idx + 1).padStart(3, "0")}`,
      clubId: id,
      authUserId: null as string | null,
    }));

  if (toInsert.length > 0) {
    await db.insert(members).values(toInsert);
  }

  // Return exactly these 500 clubIds for the test to use
  return Response.json({
    meetingId: meetingRow.id,
    centerLat: meetingRow.centerLat,
    centerLng: meetingRow.centerLng,
    clubIds: desiredClubIds,
    memberCount: 500,
  });
}

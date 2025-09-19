import { and, desc, eq, gte, lte } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { meetingConfig } from "@/config/meeting";
import db from "@/db";
import { meetings } from "@/db/schema/schema";
import { createTRPCRouter, fail, protectedProcedure } from "@/trpc/init";

export const meetingRouter = createTRPCRouter({
  generateToken: protectedProcedure.query(async ({ ctx }) => {
    const kioskId = ctx.session?.user?.username ?? "kiosk_default";

    if (!process.env.QR_CODE_SECRET)
      fail(
        "INTERNAL_SERVER_ERROR",
        "MISSING_QR_SECRET",
        "QR_CODE_SECRET missing",
      );

    const now = new Date();
    const rows = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.active, true),
          lte(meetings.startAt, now),
          gte(meetings.endAt, now),
        ),
      )
      .orderBy(desc(meetings.startAt))
      .limit(2);

    if (rows.length === 0) {
      fail("NOT_FOUND", "NO_ACTIVE_MEETING", "No active meeting in progress");
    }

    if (rows.length > 1)
      fail(
        "CONFLICT",
        "MULTIPLE_ACTIVE_MEETINGS",
        "Multiple active meetings detected",
      );

    const meeting = rows[0];

    const payload = {
      meetingId: meeting.id,
      kioskId,
      issuedAt: Math.floor(Date.now() / 1000),
      nonce: crypto.randomUUID(),
    } as const;

    const token = jwt.sign(payload, process.env.QR_CODE_SECRET, {
      algorithm: "HS256",
      expiresIn: meetingConfig.qrTokenTtlSeconds,
    });

    return { token };
  }),
});

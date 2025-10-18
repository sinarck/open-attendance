import { and, desc, eq, gte, lte } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { meetingConfig } from "@/config/meeting";
import db from "@/db";
import { meetings } from "@/db/schema/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.QR_CODE_SECRET) {
    return new NextResponse("QR_CODE_SECRET missing", { status: 500 });
  }

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

  if (rows.length !== 1) {
    return new NextResponse("No active meeting", { status: 404 });
  }

  const token = jwt.sign(
    { meetingId: rows[0].id, issuedAt: Math.floor(Date.now() / 1000) },
    process.env.QR_CODE_SECRET,
    { algorithm: "HS256", expiresIn: meetingConfig.qrTokenTtlSeconds },
  );

  const origin = new URL(request.url).origin;
  const dest = `${origin}/check-in?token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(dest, { status: 302 });
}

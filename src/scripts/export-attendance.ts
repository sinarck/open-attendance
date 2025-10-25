import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { attendance, meetings, members } from "@/db/schema/schema";

type Row = {
  timestamp: Date;
  fullName: string;
  clubId: string;
};

function parseArgs(argv: string[]): {
  meetingId?: number;
  slug?: string;
  output?: string;
} {
  const out: { meetingId?: number; slug?: string; output?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === "--meeting-id" || a === "-m") && argv[i + 1]) {
      out.meetingId = Number(argv[++i]);
    } else if ((a === "--slug" || a === "-s") && argv[i + 1]) {
      out.slug = argv[++i];
    } else if ((a === "--output" || a === "-o") && argv[i + 1]) {
      out.output = argv[++i];
    }
  }
  return out;
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function toCsv(rows: Row[]): string {
  const header = ["Timestamp", "First Name", "Last Name", "ID Number"]; // Google Sheets friendly
  const lines = [header.join(",")];
  for (const r of rows) {
    const { firstName, lastName } = splitName(r.fullName);
    const ts = r.timestamp.toISOString();
    const fields = [ts, firstName, lastName, r.clubId];
    lines.push(fields.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

function escapeCsv(value: string): string {
  if (value == null) return "";
  const needsQuote = /[",\n]/.test(value);
  let v = value.replace(/"/g, '""');
  if (needsQuote) v = `"${v}"`;
  return v;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in env");
    process.exit(1);
  }

  if (!args.meetingId && !args.slug) {
    console.error(
      "Usage: bun tsx scripts/export-attendance.ts --meeting-id <id> | --slug <slug> [--output file.csv]",
    );
    process.exit(2);
  }

  const db = drizzle({
    connection: {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
  });

  let meetingId: number | undefined;
  if (args.meetingId) meetingId = args.meetingId;
  if (!meetingId && args.slug) {
    const m = await db
      .select()
      .from(meetings)
      .where(eq(meetings.slug, args.slug))
      .limit(1);
    if (m.length === 0) {
      console.error(`No meeting found with slug: ${args.slug}`);
      process.exit(3);
    }
    meetingId = m[0].id;
  }

  if (!meetingId) {
    console.error("Meeting ID could not be resolved");
    process.exit(4);
  }

  const rows = await db
    .select({
      timestamp: attendance.checkInAt,
      fullName: members.name,
      clubId: members.clubId,
    })
    .from(attendance)
    .innerJoin(members, eq(members.id, attendance.memberId))
    .where(and(eq(attendance.meetingId, meetingId)));

  // Sort by check-in time ascending
  rows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const csv = toCsv(rows);
  if (args.output) {
    await Bun.write(args.output, csv);
    // eslint-disable-next-line no-console
    console.log(`Wrote ${rows.length} rows to ${args.output}`);
  } else {
    process.stdout.write(`${csv}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

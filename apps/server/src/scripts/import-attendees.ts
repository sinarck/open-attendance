import { parse as parseCsv } from "csv-parse/sync";
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";

type ArgMap = Record<string, string | boolean>;

function parseArgs(argv: string[]): ArgMap {
  const args: ArgMap = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function isHttpUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function readCsvInput(source: string): Promise<string> {
  if (isHttpUrl(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch CSV. HTTP ${res.status}`);
    return await res.text();
  }
  const abs = path.isAbsolute(source)
    ? source
    : path.join(process.cwd(), source);
  return await fs.readFile(abs, "utf8");
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function titleCaseWord(word: string): string {
  if (word.length === 0) return word;
  const upperWords = new Set([
    "II",
    "III",
    "IV",
    "VI",
    "VII",
    "VIII",
    "IX",
    "JR",
    "SR",
  ]);
  const maybeRoman = word.toUpperCase();
  if (upperWords.has(maybeRoman)) return maybeRoman;

  const lc = word.toLowerCase();

  // Handle O'Connor, D'Angelo style names and hyphenated parts
  return lc
    .split("-")
    .map((hy) =>
      hy
        .split("'")
        .map((ap) => (ap ? ap[0]!.toUpperCase() + ap.slice(1) : ap))
        .join("'")
    )
    .join("-");
}

function titleCaseNamePreservingParts(name: string): string {
  const cleaned = normalizeWhitespace(name);
  if (cleaned === "") return "";
  return cleaned
    .split(" ")
    .map((part) => titleCaseWord(part))
    .join(" ");
}

function normalizeNames(
  firstRaw: string,
  lastRaw: string
): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  const firstName = titleCaseNamePreservingParts(firstRaw);
  const lastName = titleCaseNamePreservingParts(lastRaw);
  const fullName = normalizeWhitespace(`${firstName} ${lastName}`);
  return { firstName, lastName, fullName };
}

function detectHeader(
  headers: string[],
  candidates: string[]
): string | undefined {
  const normalizedHeaders = headers.map((h) =>
    normalizeWhitespace(h).toLowerCase()
  );
  for (const cand of candidates) {
    const idx = normalizedHeaders.indexOf(cand.toLowerCase());
    if (idx !== -1) return headers[idx]!;
  }
  // Fallback: try contains
  for (const cand of candidates) {
    const found = headers.find((h) =>
      normalizeWhitespace(h).toLowerCase().includes(cand.toLowerCase())
    );
    if (found) return found;
  }
  return undefined;
}

function sanitizeUserId(raw: string): string {
  // Keep digits only, but if an org uses alphanumeric IDs, just trim.
  const digits = raw.replace(/[^0-9A-Za-z]/g, "");
  return normalizeWhitespace(digits);
}

async function upsertChunk(records: { userId: string; name: string }[]) {
  const { db } = await import("../db/index.js");
  const { attendeeDirectory } = await import("../db/schema/attendance.js");
  for (const rec of records) {
    if (!rec.userId || !rec.name) continue;
    await db
      .insert(attendeeDirectory)
      .values({ userId: rec.userId, name: rec.name })
      .onConflictDoUpdate({
        target: attendeeDirectory.userId,
        set: { name: rec.name },
      });
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const csvSource = (args["csv"] as string) || (args["source"] as string);
  const dryRun = Boolean(args["dry-run"] || args["dry"]);
  if (!csvSource) {
    console.error(
      "Usage: bun run src/scripts/import-attendees.ts --csv <path-or-csv-url> [--dry-run] [--id-col 'Student ID'] [--first-col 'First Name'] [--last-col 'Last Name']"
    );
    process.exit(1);
  }

  const csvText = await readCsvInput(csvSource);

  const raw = parseCsv(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  if (raw.length === 0) {
    console.warn("No rows found in CSV.");
    return;
  }

  const headers = Object.keys(raw[0]!);

  const idHeader =
    (args["id-col"] as string) ||
    detectHeader(headers, [
      "student id",
      "id",
      "studentid",
      "student_id",
      "student number",
    ]) ||
    "Student ID";

  const firstHeader =
    (args["first-col"] as string) ||
    detectHeader(headers, ["first name", "first", "given name"]) ||
    "First Name";

  const lastHeader =
    (args["last-col"] as string) ||
    detectHeader(headers, ["last name", "last", "surname", "family name"]) ||
    "Last Name";

  const prepared: {
    userId: string;
    name: string;
    firstName: string;
    lastName: string;
  }[] = [];
  for (const row of raw) {
    const firstRaw = String(row[firstHeader] ?? "");
    const lastRaw = String(row[lastHeader] ?? "");
    const idRaw = String(row[idHeader] ?? "");

    const { firstName, lastName, fullName } = normalizeNames(firstRaw, lastRaw);
    const userId = sanitizeUserId(idRaw);

    if (!userId) continue; // skip rows without IDs
    if (!fullName) continue;

    prepared.push({ userId, name: fullName, firstName, lastName });
  }

  if (dryRun) {
    console.log(`Would import ${prepared.length} attendees.`);
    console.log("Sample:");
    console.log(prepared.slice(0, 5));
    return;
  }

  // Upsert in small chunks to keep memory and transaction sizes predictable
  const chunkSize = 200;
  for (let i = 0; i < prepared.length; i += chunkSize) {
    const chunk = prepared
      .slice(i, i + chunkSize)
      .map((r) => ({ userId: r.userId, name: r.name }));
    await upsertChunk(chunk);
    console.log(
      `Imported ${Math.min(i + chunkSize, prepared.length)} / ${
        prepared.length
      }`
    );
  }

  console.log(`Done. Imported/updated ${prepared.length} attendees.`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((err) => {
  console.error(err);
  process.exit(1);
});


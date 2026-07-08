import Papa from "papaparse";
import { z } from "zod";
import type { MemberImportDraftRow } from "@/types/member-import";

export const memberImportAccept = {
  "application/vnd.ms-excel": [".csv"],
  "text/csv": [".csv"],
} as const;

const nameHeaderAliases = ["full name", "member", "member name", "name"] as const;

const identifierHeaderAliases = [
  "email",
  "id",
  "identifier",
  "login",
  "student id",
  "student number",
  "username",
] as const;

const parsedCsvRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  values: z.record(z.string(), z.string()),
});

function headerPriorityMatch(headers: string[], aliases: readonly string[]) {
  const normalizedHeaders = new Map(
    headers.map((header) => [normalizeImportHeader(header), header]),
  );
  for (const alias of aliases) {
    const match = normalizedHeaders.get(alias);
    if (match) {
      return match;
    }
  }

  return null;
}

export function normalizeImportHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export async function parseMemberCsv(file: File) {
  return new Promise<MemberImportDraftRow[]>((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      complete(results) {
        if (results.errors.length > 0) {
          reject(new Error(results.errors[0]?.message ?? "Could not read this CSV file."));
          return;
        }

        const headers = results.meta.fields?.map((field) => field.trim()).filter(Boolean) ?? [];
        if (headers.length === 0) {
          reject(new Error("This CSV needs a header row."));
          return;
        }

        const nameHeader = headerPriorityMatch(headers, nameHeaderAliases);
        const identifierHeader = headerPriorityMatch(headers, identifierHeaderAliases);

        if (!nameHeader || !identifierHeader) {
          reject(new Error("CSV must include name and identifier columns."));
          return;
        }

        const rawRows = results.data
          .map((row, index) => {
            const values = Object.fromEntries(
              headers.map((header) => [header, String(row[header] ?? "").trim()]),
            );
            return parsedCsvRowSchema.parse({
              rowNumber: index + 2,
              values,
            });
          })
          .filter((row) => Object.values(row.values).some((value) => value.length > 0));

        if (rawRows.length === 0) {
          reject(new Error("This CSV does not contain any member rows."));
          return;
        }

        resolve(
          rawRows.map((row) => ({
            rowNumber: row.rowNumber,
            identifier: row.values[identifierHeader] ?? "",
            name: row.values[nameHeader] ?? "",
          })),
        );
      },
      error(error) {
        reject(error);
      },
      header: true,
      skipEmptyLines: "greedy",
      transformHeader(header) {
        return header.trim();
      },
      worker: true,
    });
  });
}

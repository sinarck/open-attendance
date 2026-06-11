export type MemberImportCode =
  | "duplicate_identifier"
  | "duplicate_identifier_in_archived_roster"
  | "duplicate_identifier_in_file"
  | "invalid_identifier"
  | "invalid_name";

export interface ParsedCsvRow {
  rowNumber: number;
  values: Record<string, string>;
}

export interface MemberImportMapping {
  identifier: string;
  name: string;
}

export interface MemberImportRowInput {
  rowNumber: number;
  name: string;
  identifier: string;
}

export interface MemberImportDraftRow extends MemberImportRowInput {}

export interface MemberImportRowResult extends MemberImportRowInput {
  normalizedIdentifier?: string;
  normalizedName?: string;
  ok: boolean;
  code?: MemberImportCode;
  message?: string;
}

export interface MemberImportSummary {
  activeConflicts: number;
  archivedConflicts: number;
  duplicateIdentifiersInFile: number;
  invalidIdentifiers: number;
  invalidNames: number;
  totalRows: number;
  validRows: number;
}

export interface MemberImportPreviewResult {
  rows: MemberImportRowResult[];
  summary: MemberImportSummary;
}

export interface MemberImportResult extends MemberImportPreviewResult {
  importedCount: number;
  skippedCount: number;
}

import { tzOffset } from "@date-fns/tz";

const timeZoneReferenceDate = new Date(0);

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function required(value: string, message: string) {
  const normalized = compact(value);
  if (normalized === "") {
    throw new Error(message);
  }
  return normalized;
}

export function normalizeMemberName(value: string) {
  return required(value, "Name cannot be empty");
}

export function normalizeMemberIdentifier(value: string) {
  const normalized = value.trim();
  if (normalized === "") {
    throw new Error("Identifier cannot be empty");
  }
  return normalized;
}

export function normalizeMeetingName(value: string) {
  return required(value, "Meeting name cannot be empty");
}

export function normalizeMeetingOptionalText(value: string) {
  const normalized = compact(value);
  return normalized === "" ? undefined : normalized;
}

export function normalizeMeetingTags(values: string[] | undefined) {
  if (values === undefined) {
    return undefined;
  }

  const tags = Array.from(new Set(values.map(compact).filter((value) => value !== "")));
  return tags.length === 0 ? undefined : tags;
}

export function normalizeOrganizationName(value: string) {
  return required(value, "Organization name cannot be empty");
}

export function normalizeOrganizationTimezone(value: string) {
  const normalized = value.trim();
  if (Number.isNaN(tzOffset(normalized, timeZoneReferenceDate))) {
    throw new Error("Timezone must be valid");
  }
  return normalized;
}

export function normalizeOrganizationSlugCandidate(value: string) {
  return compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function normalizeOrganizationSlug(value: string) {
  const normalized = normalizeOrganizationSlugCandidate(value);
  if (normalized === "") {
    throw new Error("Slug cannot be empty");
  }
  return normalized;
}

export function normalizeCheckInCode(value: string) {
  const normalized = value.trim();
  if (normalized === "") {
    throw new Error("Check-in code cannot be empty");
  }
  return normalized;
}

export function normalizeDeviceFingerprint(value: string) {
  if (value === "") {
    throw new Error("Device fingerprint cannot be empty");
  }
  return value;
}

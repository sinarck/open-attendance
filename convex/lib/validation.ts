import { tzOffset } from "@date-fns/tz";
import { z } from "zod";

const timeZoneReferenceDate = new Date(0);

function compact(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function requiredCompactString(message: string) {
  return z
    .string()
    .transform(compact)
    .refine((value) => value !== "", { message });
}

export const memberNameSchema = requiredCompactString("Name cannot be empty");
export const memberIdentifierSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value !== "", {
    message: "Identifier cannot be empty",
  });
export const meetingNameSchema = requiredCompactString("Meeting name cannot be empty");
export const meetingOptionalTextSchema = z
  .string()
  .transform(compact)
  .transform((value) => {
    return value === "" ? undefined : value;
  });
export const meetingTagsSchema = z.array(z.string()).transform((values) => {
  const tags = Array.from(new Set(values.map(compact).filter((value) => value !== "")));
  return tags.length === 0 ? undefined : tags;
});
export const organizationNameSchema = requiredCompactString("Organization name cannot be empty");
export const organizationTimezoneSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => !Number.isNaN(tzOffset(value, timeZoneReferenceDate)), {
    message: "Timezone must be valid",
  });
export const organizationSlugCandidateSchema = z.string().transform((value) =>
  compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48),
);
export const organizationSlugSchema = organizationSlugCandidateSchema.refine(
  (value) => value !== "",
  {
    message: "Slug cannot be empty",
  },
);
export const checkInCodeSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value !== "", {
    message: "Check-in code cannot be empty",
  });
export const deviceFingerprintSchema = z.string().min(1, "Device fingerprint cannot be empty");

export function normalizeMemberName(value: string) {
  return memberNameSchema.parse(value);
}

export function normalizeMemberIdentifier(value: string) {
  return memberIdentifierSchema.parse(value);
}

export function normalizeMeetingName(value: string) {
  return meetingNameSchema.parse(value);
}

export function normalizeMeetingOptionalText(value: string) {
  return meetingOptionalTextSchema.parse(value);
}

export function normalizeMeetingTags(values: string[] | undefined) {
  if (values === undefined) {
    return undefined;
  }

  return meetingTagsSchema.parse(values);
}

export function normalizeOrganizationName(value: string) {
  return organizationNameSchema.parse(value);
}

export function normalizeOrganizationTimezone(value: string) {
  return organizationTimezoneSchema.parse(value);
}

export function normalizeOrganizationSlugCandidate(value: string) {
  return organizationSlugCandidateSchema.parse(value);
}

export function normalizeOrganizationSlug(value: string) {
  return organizationSlugSchema.parse(value);
}

export function normalizeCheckInCode(value: string) {
  return checkInCodeSchema.parse(value);
}

export function normalizeDeviceFingerprint(value: string) {
  return deviceFingerprintSchema.parse(value);
}

import { z } from "zod";

const compactWhitespace = (value: string) => value.replace(/\s+/g, " ");

const compactRequiredText = (field: string) =>
  z.string().trim().min(1, `${field} cannot be empty`).transform(compactWhitespace);

const compactOptionalText = z
  .string()
  .trim()
  .transform(compactWhitespace)
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const memberNameSchema = compactRequiredText("Name");
export const memberIdentifierSchema = z.string().trim().min(1, "Identifier cannot be empty");

export const meetingNameSchema = compactRequiredText("Meeting name");
export const meetingOptionalTextSchema = compactOptionalText;
export const meetingTagsSchema = z
  .array(z.string().trim().transform(compactWhitespace))
  .transform((tags) => {
    const normalized = tags.filter((tag) => tag.length > 0);
    return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined;
  })
  .optional();

export const organizationNameSchema = compactRequiredText("Organization name");
export const organizationTimezoneSchema = compactRequiredText("Timezone");
export const organizationSlugCandidateSchema = z
  .string()
  .trim()
  .transform((value) =>
    compactWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48),
  );

export const organizationSlugSchema = organizationSlugCandidateSchema.refine(
  (value) => value.length > 0,
  {
    message: "Slug cannot be empty",
  },
);

export const checkInCodeSchema = z.string().trim().min(1, "Check-in code cannot be empty");
export const deviceFingerprintSchema = z.string().min(1, "Device fingerprint cannot be empty");

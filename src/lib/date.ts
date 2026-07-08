import { tz, tzOffset } from "@date-fns/tz";
import { format } from "date-fns";

const TIME_ZONE_FALLBACK = "UTC";
// Use a fixed instant so validation stays deterministic across DST boundaries.
const TIME_ZONE_REFERENCE_DATE = new Date(0);

export function formatInTimeZone(value: Date | number | string, pattern: string, timeZone: string) {
  return format(value, pattern, { in: tz(timeZone) });
}

export function isValidTimeZone(timeZone: string) {
  return !Number.isNaN(tzOffset(timeZone, TIME_ZONE_REFERENCE_DATE));
}

export function normalizeTimeZone(
  timeZone: string | null | undefined,
  fallback = TIME_ZONE_FALLBACK,
) {
  // Persist a canonical fallback instead of leaking empty or invalid values
  // into org settings, query params, and server-rendered formatting paths.
  const value = timeZone?.trim();
  return value && isValidTimeZone(value) ? value : fallback;
}

export function getPreferredTimeZone() {
  // date-fns handles formatting and offset math, but the browser is still the
  // source of truth for the user's current system time zone.
  return normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

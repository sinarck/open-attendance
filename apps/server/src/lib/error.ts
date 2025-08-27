import { TRPCError } from "@trpc/server";

// Error code mappings for user-friendly messages
export const ERROR_MESSAGES = {
  TOKEN_INVALID_OR_EXPIRED: {
    code: "INVALID_TOKEN",
    message: "Your check-in link has expired. Please scan the QR code again.",
  },
  TOKEN_MALFORMED: {
    code: "INVALID_TOKEN",
    message: "Invalid check-in link. Please scan the QR code again.",
  },
  TOKEN_STALE: {
    code: "INVALID_TOKEN",
    message: "Your check-in link has expired. Please scan the QR code again.",
  },
  TOKEN_ALREADY_USED: {
    code: "TOKEN_USED",
    message:
      "This check-in link has already been used. Please scan a fresh QR code.",
  },
  RATE_LIMITED: {
    code: "TOO_MANY_ATTEMPTS",
    message: "Too many attempts. Please wait a moment and try again.",
  },
  MEETING_INACTIVE: {
    code: "EVENT_UNAVAILABLE",
    message: "This event is currently not available for check-in.",
  },
  MEETING_NOT_CONFIGURED: {
    code: "EVENT_UNAVAILABLE",
    message: "Event configuration error. Please contact event staff.",
  },
  LOCATION_INACCURATE: {
    code: "LOCATION_REQUIRED",
    message:
      "Unable to verify your location accurately. Please ensure location services are enabled and try again.",
  },
  NOT_IN_GEOFENCE: {
    code: "LOCATION_REQUIRED",
    message: "You must be at the event location to check in.",
  },
  UNKNOWN_USER: {
    code: "INVALID_USER",
    message: "User ID not found. Please check your ID and try again.",
  },
  DEVICE_ALREADY_USED: {
    code: "DEVICE_USED",
    message: "This device has already been used to check in to this event.",
  },
  ALREADY_CHECKED_IN: {
    code: "ALREADY_CHECKED_IN",
    message: "You have already checked in to this event.",
  },
} as const;

export function createUserError(errorKey: keyof typeof ERROR_MESSAGES) {
  const error = ERROR_MESSAGES[errorKey];
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error.message,
    cause: {
      errorCode: error.code,
    },
  });
}


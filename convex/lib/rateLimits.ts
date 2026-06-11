import { defineRateLimits } from "convex-helpers/server/rateLimit";
import { millisecondsInMinute } from "date-fns/constants";

/**
 * Application-level rate limits enforced inside Convex mutations.
 *
 * @remarks
 * These are intentionally small, transaction-local controls. They protect the
 * app from routine abuse and accidental bursts, but they are not a substitute
 * for network-layer protection or stronger anonymous-user authorization.
 */
export const { rateLimit } = defineRateLimits({
  // Public self check-in, keyed by meeting ID after the code has been resolved.
  checkIn: {
    kind: "token bucket",
    rate: 30,
    period: millisecondsInMinute,
    capacity: 30,
  },

  // Authenticated writes that mutate an organization's data.
  orgWrite: {
    kind: "token bucket",
    rate: 60,
    period: millisecondsInMinute,
    capacity: 60,
  },

  // Batch roster imports should be deliberate and infrequent.
  memberImport: {
    kind: "fixed window",
    rate: 10,
    period: millisecondsInMinute,
    capacity: 10,
  },
});

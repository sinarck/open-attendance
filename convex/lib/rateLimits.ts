import { defineRateLimits } from "convex-helpers/server/rateLimit";
import { millisecondsInMinute } from "date-fns/constants";

export const { rateLimit, checkRateLimit, resetRateLimit } = defineRateLimits({
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
});

import { defineRateLimits } from "convex-helpers/server/rateLimit";
import { millisecondsInMinute } from "date-fns/constants";

export const { rateLimit, checkRateLimit, resetRateLimit } = defineRateLimits({
  // Public check-in endpoint, keyed per meeting.
  checkIn: {
    kind: "token bucket",
    rate: 30,
    period: millisecondsInMinute,
    capacity: 30,
  },

  // Authenticated writes (create member, create meeting, etc.), keyed per org.
  orgWrite: {
    kind: "token bucket",
    rate: 60,
    period: millisecondsInMinute,
    capacity: 60,
  },

  // Bulk member import, keyed per org. Tighter since it's a heavy operation.
  memberImport: {
    kind: "fixed window",
    rate: 10,
    period: millisecondsInMinute,
  },
});

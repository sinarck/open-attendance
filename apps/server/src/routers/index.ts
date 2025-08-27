import { router } from "../lib/trpc.js";
import { checkinRouter } from "./checkin.js";
import { meetingRouter } from "./meeting.js";

export const appRouter = router({
  meeting: meetingRouter,
  checkin: checkinRouter,
});

export type AppRouter = typeof appRouter;


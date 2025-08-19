import { router } from "../lib/trpc";
import { checkinRouter } from "./checkin";
import { meetingRouter } from "./meeting";

export const appRouter = router({
  meeting: meetingRouter,
  checkin: checkinRouter,
});

export type AppRouter = typeof appRouter;


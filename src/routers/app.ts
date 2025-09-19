import { createTRPCRouter } from "@/trpc/init";
import { checkinRouter } from "./checkin";
import { meetingRouter } from "./meeting";

export const appRouter = createTRPCRouter({
  meeting: meetingRouter,
  checkin: checkinRouter,
});

export type AppRouter = typeof appRouter;

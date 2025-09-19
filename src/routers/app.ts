import { createTRPCRouter } from "@/trpc/init";
import { meetingRouter } from "./meeting";

export const appRouter = createTRPCRouter({
  meeting: meetingRouter,
});

export type AppRouter = typeof appRouter;

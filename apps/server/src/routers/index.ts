import { router } from "../lib/trpc";
import { meetingRouter } from "./meeting";

export const appRouter = router({
  meeting: meetingRouter,
});

export type AppRouter = typeof appRouter;


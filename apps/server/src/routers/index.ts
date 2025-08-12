import { protectedProcedure, router } from "../lib/trpc";
import { meetingRouter } from "./meeting";

export const appRouter = router({
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),

  meeting: meetingRouter,
});

export type AppRouter = typeof appRouter;


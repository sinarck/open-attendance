import db from "@/db";
import { meetings } from "@/db/schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/trpc/init";

export const appRouter = createTRPCRouter({
  dbCheck: publicProcedure.query(() => {
    return db.select().from(meetings);
  }),
  me: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.userId };
  }),
});

export type AppRouter = typeof appRouter;

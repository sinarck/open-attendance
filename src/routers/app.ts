import { z } from "zod";
import db from "@/db";
import { meetings } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  dbCheck: baseProcedure.query(() => {
    return db.select().from(meetings);
  }),
});

export type AppRouter = typeof appRouter;

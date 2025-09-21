import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";

export const linkRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        url: z.string(),
      }),
    )
    .mutation(async ({ input }) => {}),
});

import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import type { LinkCreateInput, LinkCreateOutput } from "@/types/trpc";

export const linkRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ url: z.string() }) as z.ZodType<LinkCreateInput>)
    .mutation(async ({ input }): Promise<LinkCreateOutput> => {
      // TODO: Implement link creation/updates
      void input; // placeholder until implemented
      return undefined as unknown as LinkCreateOutput;
    }),
});

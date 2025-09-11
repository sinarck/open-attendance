import { initTRPC } from "@trpc/server";
import superjson from "superjson";

export type TRPCContext = {
  req: Request;
  headers: Headers;
  userId: string | null;
};

export async function createTRPCContext(opts: {
  req: Request;
}): Promise<TRPCContext> {
  const { req } = opts;
  // TODO: derive user from cookies/headers/session if needed
  return { req, headers: req.headers, userId: null };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

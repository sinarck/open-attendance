import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/utils/auth";

interface BetterAuthSessionShape {
  user?: {
    id: string;
    // Extend with fields you rely on (e.g., roles) when needed
  };
}

export type TRPCContext = {
  req: Request;
  headers: Headers;
  session: BetterAuthSessionShape | null;
  userId: string | null;
};

export async function createTRPCContext(opts: {
  req: Request;
}): Promise<TRPCContext> {
  const { req } = opts;
  const session = (await auth.api.getSession({
    headers: req.headers,
  })) as BetterAuthSessionShape | null;

  return {
    req,
    headers: req.headers,
    session,
    userId: session?.user?.id ?? null,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

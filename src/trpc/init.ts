import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/utils/auth";

interface BetterAuthSessionShape {
  user?: {
    id: string;
    username?: string;
    displayUsername?: string;
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
  errorFormatter({ shape, error }) {
    const appCode = (error.cause as { appCode?: string } | undefined)?.appCode;
    return {
      ...shape,
      data: {
        ...shape.data,
        appCode: appCode ?? null,
      },
    };
  },
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

// Error helpers
export type AppCode =
  | "NO_ACTIVE_MEETING"
  | "MULTIPLE_ACTIVE_MEETINGS"
  | "MISSING_QR_SECRET"
  | "UNAUTHORIZED";

export class AppError extends TRPCError {
  appCode: AppCode;
  constructor(code: TRPCError["code"], appCode: AppCode, message?: string) {
    super({ code, message, cause: { appCode } });
    this.appCode = appCode;
  }
}

export function fail(
  code: TRPCError["code"],
  appCode: AppCode,
  message?: string,
): never {
  throw new AppError(code, appCode, message);
}

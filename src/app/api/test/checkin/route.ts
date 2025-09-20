import { appRouter } from "@/routers/app";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";

type VerifyInput = {
  token: string;
  userId: string;
  deviceFingerprint: string;
  geo: { lat: number; lng: number; accuracyM: number };
};

// (unused type removed)

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as
    | { input: VerifyInput }
    | { inputs: VerifyInput[] };

  const ctx = await createTRPCContext({ req });
  const caller = createCallerFactory(appRouter)(ctx);

  if (
    (body as { inputs?: unknown[] }).inputs &&
    Array.isArray((body as { inputs: unknown[] }).inputs)
  ) {
    const inputs = (body as { inputs: VerifyInput[] }).inputs;
    const results = await Promise.all(
      inputs.map(async (input) => {
        try {
          const data = await caller.checkin.verifyAndRecord(input);
          return { ok: true as const, data };
        } catch (e) {
          const err = e as {
            appCode?: string;
            cause?: { appCode?: string };
            data?: { appCode?: string };
            message?: string;
          };
          const appCode: string | null =
            err?.appCode || err?.cause?.appCode || err?.data?.appCode || null;
          const message: string = err?.message || "error";
          return { ok: false as const, error: { appCode, message } };
        }
      }),
    );
    return Response.json({ results });
  }

  const input = (body as { input?: VerifyInput }).input;
  if (!input) return new Response("Bad Request", { status: 400 });
  try {
    const data = await caller.checkin.verifyAndRecord(input);
    return Response.json({ ok: true as const, data });
  } catch (e) {
    const err = e as {
      appCode?: string;
      cause?: { appCode?: string };
      data?: { appCode?: string };
      message?: string;
    };
    const appCode: string | null =
      err?.appCode || err?.cause?.appCode || err?.data?.appCode || null;
    const message: string = err?.message || "error";
    return Response.json(
      { ok: false as const, error: { appCode, message } },
      { status: 400 },
    );
  }
}

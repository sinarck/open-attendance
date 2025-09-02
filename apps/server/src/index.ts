import { trpcServer } from "@hono/trpc-server";
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import { createContext } from "./lib/context.js";
import { appRouter } from "./routers/index.js";

const app = new Hono();

app.use(logger());
const normalizeOrigin = (value?: string) => value?.replace(/\/+$/, "");
const allowedOrigins = [
  "https://attendance-web-two.vercel.app",
  normalizeOrigin(process.env.CORS_ORIGIN),
].filter(Boolean) as string[];
app.use(
  "/*",
  cors({
    origin: (origin) => {
      const normalized = normalizeOrigin(origin || "");
      if (normalized && allowedOrigins.includes(normalized)) {
        return normalized;
      }
      return null;
    },
    credentials: true,
  })
);

const DEBUG_CORS = process.env.DEBUG_CORS === "1";
app.use("/*", async (c, next) => {
  await next();
  if (DEBUG_CORS) {
    console.log(
      "[CORS]",
      JSON.stringify(
        {
          method: c.req.method,
          path: c.req.path,
          origin: c.req.header("origin") || "",
          allowOrigin: c.res.headers.get("Access-Control-Allow-Origin") || "",
          allowCredentials:
            c.res.headers.get("Access-Control-Allow-Credentials") || "",
          vary: c.res.headers.get("Vary") || "",
          status: c.res.status,
        },
        null,
        0
      )
    );
  }
});

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.get("/", (c) => {
  return c.text("OK");
});
export default app;


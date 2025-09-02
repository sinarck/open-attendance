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
// CORS: allow configured origins (comma-separated) with credentials
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const devFallbackOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return ""; // Non-CORS or same-origin requests
      const whitelist = allowedOrigins.length
        ? allowedOrigins
        : devFallbackOrigins;
      return whitelist.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "*",
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-TRPC-Source",
    ],
    credentials: true,
    maxAge: 86400,
  })
);

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


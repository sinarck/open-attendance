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
app.use(
  "/*",
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://attendance-web-two.vercel.app/"
        : process.env.CORS_ORIGIN ?? "http://localhost:3000",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
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


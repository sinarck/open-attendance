const SENTRY_DSN =
  "https://9242d365755c1591d54ffaf442834cae@o4509704937078784.ingest.us.sentry.io/4510596172218368";

const isDevelopment = process.env.NODE_ENV === "development";

export function createSentryConfig() {
  return {
    dsn: SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: isDevelopment ? 1 : 0.1,
    enableLogs: true,
    sendDefaultPii: false,
  };
}

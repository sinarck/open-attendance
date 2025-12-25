import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9242d365755c1591d54ffaf442834cae@o4509704937078784.ingest.us.sentry.io/4510596172218368",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

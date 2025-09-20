import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://83f4c5cf880d2c191ca460d52cb818f2@o4509704937078784.ingest.us.sentry.io/4510050386378752",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

import { env } from "@/lib/env";

export const posthogProjectKey = env.NEXT_PUBLIC_POSTHOG_KEY;

export const posthogOptions = {
  api_host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
  ui_host: env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24",
  person_profiles: "identified_only",
  autocapture: false,
  capture_exceptions: {
    capture_console_errors: false,
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
  },
  capture_pageleave: false,
  capture_pageview: false,
  disable_session_recording: true,
  enable_recording_console_log: false,
  debug: false,
} as const;

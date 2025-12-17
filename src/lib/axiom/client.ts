"use client";

import { Logger, ProxyTransport } from "@axiomhq/logging";
import { createUseLogger, createWebVitalsComponent } from "@axiomhq/react";

export const logger = new Logger({
  transports: [new ProxyTransport({ url: "/api/axiom", autoFlush: true })],
});

export const useLogger = createUseLogger(logger);
export const WebVitals = createWebVitalsComponent(logger);

function getClientMetadata() {
  if (typeof window === "undefined") return {};

  return {
    url: window.location.href,
    pathname: window.location.pathname,
    referrer: document.referrer || undefined,
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

export const log = {
  info: (event: string, meta?: Record<string, unknown>) =>
    logger.info(event, { ...getClientMetadata(), ...meta }),
  warn: (event: string, meta?: Record<string, unknown>) =>
    logger.warn(event, { ...getClientMetadata(), ...meta }),
  error: (event: string, meta?: Record<string, unknown>) =>
    logger.error(event, { ...getClientMetadata(), ...meta }),
  debug: (event: string, meta?: Record<string, unknown>) =>
    logger.debug(event, { ...getClientMetadata(), ...meta }),
  flush: () => logger.flush(),
};

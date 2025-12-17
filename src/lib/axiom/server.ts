import { AxiomJSTransport, Logger } from "@axiomhq/logging";
import {
  createAxiomRouteHandler,
  createProxyRouteHandler,
  nextJsFormatters,
} from "@axiomhq/nextjs";
import axiomClient from "@/lib/axiom/axiom";

if (!process.env.AXIOM_DATASET) {
  throw new Error("AXIOM_DATASET environment variable is not set");
}

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET,
    }),
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);
export const axiomProxyHandler = createProxyRouteHandler(logger);

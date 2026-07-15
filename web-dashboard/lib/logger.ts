import "server-only";
import pino from "pino";

/**
 * Structured JSON logging. In production this emits newline-delimited JSON
 * suitable for ingestion by any log aggregator (CloudWatch, Datadog, Loki,
 * etc). In development it's piped through pino-pretty for readability.
 *
 * Usage:
 *   const log = logger.child({ route: "/api/results", requestId });
 *   log.info({ durationMs }, "served results bundle");
 */
export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : (process.env.LOG_LEVEL ?? "info"),
  base: { service: "causal-inference-dashboard" },
  redact: ["req.headers.authorization", "req.headers.cookie"],
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
});

export function generateRequestId(): string {
  return crypto.randomUUID();
}

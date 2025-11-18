type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const log = (level: LogLevel, event: string, meta: LogMeta = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV,
    ...meta,
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.info(line);
  }
};

export const logger = {
  info: (event: string, meta?: LogMeta) => log("info", event, meta ?? {}),
  warn: (event: string, meta?: LogMeta) => log("warn", event, meta ?? {}),
  error: (event: string, meta?: LogMeta) => log("error", event, meta ?? {}),
};

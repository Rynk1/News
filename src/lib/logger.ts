/**
 * Tiny logging sink so browser logs can be routed through one place (Sentry in
 * production, console in development) instead of scattered `console.log`s.
 */

type Level = "debug" | "info" | "warn" | "error";

function shouldLog(level: Level): boolean {
  const threshold: Level =
    (import.meta.env.VITE_LOG_LEVEL as Level) || "debug";
  const order: Record<Level, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  return order[level] >= order[threshold];
}

function emit(level: Level, args: unknown[]): void {
  if (!shouldLog(level)) return;
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "info"
          ? console.info
          : console.debug;
  // Guard against noisy prod builds.
  if (level === "error" || import.meta.env.DEV) {
    fn(...args);
  }
}

export const logger = {
  debug: (...args: unknown[]) => emit("debug", args),
  info: (...args: unknown[]) => emit("info", args),
  warn: (...args: unknown[]) => emit("warn", args),
  error: (...args: unknown[]) => emit("error", args),
};
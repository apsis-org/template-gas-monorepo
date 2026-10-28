/**
 * Logging utilities
 * Writes logs in a consistent format
 */

type LogLevel = "INFO" | "WARN" | "ERROR";

const log = (level: LogLevel, message: string, details?: unknown): void => {
  const timestamp = new Date().toISOString();
  const logMessage = details
    ? `[${timestamp}] [${level}] ${message} | ${JSON.stringify(details)}`
    : `[${timestamp}] [${level}] ${message}`;
  Logger.log(logMessage);
};

export const logInfo = (message: string, details?: unknown): void => {
  log("INFO", message, details);
};

export const logWarn = (message: string, details?: unknown): void => {
  log("WARN", message, details);
};

/**
 * Error log. When an Error is passed, its message and stack are included.
 */
export const logError = (message: string, error?: unknown): void => {
  if (error instanceof Error) {
    log("ERROR", message, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    log("ERROR", message, error);
  }
};

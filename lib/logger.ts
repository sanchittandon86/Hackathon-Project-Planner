/**
 * Centralized logging utility
 * 
 * Safe to import in both server and client code.
 * In production, info and debug logs are disabled.
 * Warn and error logs always work.
 */

const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'debug' | 'warn' | 'error';

interface Logger {
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const createLogger = (): Logger => {
  return {
    info: (...args: unknown[]) => {
      if (!isProduction) {
        console.log(...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (!isProduction) {
        console.log(...args);
      }
    },
    warn: (...args: unknown[]) => {
      console.warn(...args);
    },
    error: (...args: unknown[]) => {
      console.error(...args);
    },
  };
};

export const logger = createLogger();


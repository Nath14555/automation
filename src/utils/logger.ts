import pino, { type Logger, type LoggerOptions } from 'pino';
import { loadEnv } from './config.js';

const env = loadEnv();

const baseOptions: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: {
    app: 'louna-agent',
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: [
      '*.apiKey',
      '*.api_key',
      '*.password',
      '*.token',
      '*.secret',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
};

const transport =
  env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      }
    : undefined;

export const logger: Logger = pino({
  ...baseOptions,
  ...(transport ? { transport } : {}),
});

export const childLogger = (bindings: Record<string, unknown>): Logger => logger.child(bindings);

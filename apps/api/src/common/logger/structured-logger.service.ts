import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

export interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  trace?: string;
}

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'creditcard',
  'cardnumber',
  'cvv',
]);

function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(
    level: string,
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
    trace?: string
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      context: context || 'OmniFlow',
      message,
    };

    if (metadata) {
      entry.metadata = redactSensitiveData(metadata) as Record<string, unknown>;
    }
    if (trace) {
      entry.trace = trace;
    }

    if (this.isProduction) {
      return JSON.stringify(entry);
    }

    const color =
      level === 'error'
        ? '\x1b[31m'
        : level === 'warn'
        ? '\x1b[33m'
        : level === 'debug'
        ? '\x1b[34m'
        : '\x1b[32m';
    const reset = '\x1b[0m';
    const ctx = context ? ` \x1b[35m[${context}]\x1b[0m` : '';
    const metaStr = metadata ? ` ${JSON.stringify(redactSensitiveData(metadata))}` : '';
    return `${color}[OmniFlow]${reset} ${entry.timestamp} ${color}${level.toUpperCase()}${reset}${ctx} ${message}${metaStr}`;
  }

  log(message: string, context?: string, metadata?: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.log(this.formatMessage('info', message, context, metadata));
  }

  error(message: string, trace?: string, context?: string, metadata?: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, context, metadata, trace));
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>) {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context, metadata));
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>) {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context, metadata));
    }
  }

  verbose(message: string, context?: string, metadata?: Record<string, unknown>) {
    if (!this.isProduction) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('verbose', message, context, metadata));
    }
  }
}

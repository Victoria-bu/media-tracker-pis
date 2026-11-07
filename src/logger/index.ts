import pino from 'pino';
import { ENV } from '../config/env';

const logger = pino({
  level: ENV.NODE_ENV === 'test' ? 'silent' : 'info',
});

export function logRequest(method: string, path: string, status: number, durationMs: number): void {
  logger.info({ type: 'request', method, path, status, durationMs });
}

export function logAuth(
  event: 'register' | 'login' | 'logout' | 'login_failed',
  userId?: string,
): void {
  logger.info({ type: 'auth', event, userId });
}

export function logCrud(
  operation: string,
  resource: string,
  userId: string,
  resourceId?: string,
): void {
  logger.info({ type: 'crud', operation, resource, userId, resourceId });
}

export function logValidationError(path: string, field: string, message: string): void {
  logger.warn({ type: 'validation_error', path, field, message });
}

export function logError(err: Error, path: string): void {
  logger.error({ type: 'server_error', message: err.message, path });
}

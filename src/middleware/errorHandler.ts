import type { Request, Response, NextFunction } from 'express';
import { logError } from '../logger';

/**
 * Centralized Express error handler (must be registered last via app.use()).
 * Catches all unhandled errors passed via next(err), logs them, and returns 500.
 * Domain errors (AppError) are intentionally caught per-route before reaching here.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logError(err, req.path);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
}

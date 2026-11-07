import { Request, Response, NextFunction } from 'express';
import { logError } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logError(err, req.path);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
}

import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logRequest(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
}

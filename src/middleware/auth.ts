import type { Request, Response, NextFunction } from 'express';

/**
 * Express middleware that blocks unauthenticated requests.
 * Reads userId from the session (set by the login route).
 * Returns 401 UNAUTHORIZED if no session exists; otherwise calls next().
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  next();
}

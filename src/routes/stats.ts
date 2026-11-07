import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import { periodSchema, basisSchema, Basis } from '../validators/statsValidators';
import * as statsService from '../services/statsService';
import { logCrud, logValidationError } from '../logger';

export function createStatsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', requireAuth, (req, res, next) => {
    const periodResult = periodSchema.safeParse(req.query.period);
    if (!periodResult.success) {
      logValidationError(req.path, 'period', 'Invalid period');
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'period must be one of: month, year, all',
        field: 'period',
      });
      return;
    }

    let basis: Basis = 'completedAt';
    if (req.query.basis !== undefined) {
      const basisResult = basisSchema.safeParse(req.query.basis);
      if (!basisResult.success) {
        logValidationError(req.path, 'basis', 'Invalid basis');
        res.status(400).json({
          code: 'INVALID_BASIS',
          message: 'basis must be completedAt or sessions',
          field: 'basis',
        });
        return;
      }
      basis = basisResult.data;
    }

    try {
      const period = periodResult.data;
      const stats = statsService.getStats(db, req.session.userId!, period, basis);
      // Log includes period and basis — no sensitive data (no passwords/tokens/cookies)
      logCrud('list', 'stats', req.session.userId!, `${period}/${basis}`);
      res.status(200).json(stats);
    } catch (err) { next(err); }
  });

  return router;
}

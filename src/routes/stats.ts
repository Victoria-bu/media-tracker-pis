import { Router } from 'express';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import * as statsService from '../services/statsService';
import { logCrud, logValidationError } from '../logger';

const periodSchema = z.enum(['month', 'year', 'all']);

export function createStatsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', requireAuth, (req, res, next) => {
    const result = periodSchema.safeParse(req.query.period);
    if (!result.success) {
      logValidationError(req.path, 'period', 'Invalid period');
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'period must be one of: month, year, all',
        field: 'period',
      });
      return;
    }
    try {
      const stats = statsService.getStats(db, req.session.userId!, result.data);
      logCrud('list', 'stats', req.session.userId!);
      res.status(200).json(stats);
    } catch (err) { next(err); }
  });

  return router;
}

import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import { createSessionSchema, updateSessionSchema } from '../validators/sessionValidators';
import * as sessionService from '../services/sessionService';
import { logCrud, logValidationError } from '../logger';

export function createSessionsRouter(db: Database.Database): Router {
  const router = Router({ mergeParams: true });

  router.get('/:id/sessions', requireAuth, (req, res, next) => {
    try {
      const result = sessionService.listSessions(db, req.params.id, req.session.userId!);
      res.status(200).json(result);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.post('/:id/sessions', requireAuth, (req, res, next) => {
    const result = createSessionSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const session = sessionService.createSession(db, req.params.id, req.session.userId!, result.data);
      logCrud('create', 'session', req.session.userId!, session.id);
      res.status(201).json(session);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.patch('/:id/sessions/:sid', requireAuth, (req, res, next) => {
    const result = updateSessionSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const session = sessionService.updateSession(
        db, req.params.id, req.params.sid, req.session.userId!, result.data,
      );
      logCrud('update', 'session', req.session.userId!, req.params.sid);
      res.status(200).json(session);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.delete('/:id/sessions/:sid', requireAuth, (req, res, next) => {
    try {
      sessionService.deleteSession(db, req.params.id, req.params.sid, req.session.userId!);
      logCrud('delete', 'session', req.session.userId!, req.params.sid);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  return router;
}

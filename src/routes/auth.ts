import { Router } from 'express';
import Database from 'better-sqlite3';
import { registerSchema, loginSchema } from '../validators/authValidators';
import * as authService from '../services/authService';
import { logAuth, logValidationError } from '../logger';
import { AppError } from '../services/authService';

export function createAuthRouter(db: Database.Database): Router {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = String(firstError.path[0] ?? 'unknown');
      logValidationError(req.path, field, firstError.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: firstError.message, field });
      return;
    }

    try {
      const { email, password, nickname } = result.data;
      const user = await authService.register(db, email, password, nickname);
      req.session.userId = user.id;
      logAuth('register', user.id);
      res.status(201).json(user);
    } catch (err) {
      const appErr = err as AppError;
      if (appErr.status === 409) {
        res.status(409).json({ code: appErr.code, message: appErr.message, field: appErr.field });
        return;
      }
      next(err);
    }
  });

  router.post('/login', async (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = String(firstError.path[0] ?? 'unknown');
      logValidationError(req.path, field, firstError.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: firstError.message, field });
      return;
    }

    try {
      const { email, password } = result.data;
      const user = await authService.login(db, email, password);
      req.session.userId = user.id;
      logAuth('login', user.id);
      res.status(200).json(user);
    } catch (err) {
      const appErr = err as AppError;
      if (appErr.status === 401) {
        logAuth('login_failed');
        res.status(401).json({ code: appErr.code, message: appErr.message });
        return;
      }
      next(err);
    }
  });

  router.post('/logout', (req, res, next) => {
    if (!req.session.userId) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }
    const userId = req.session.userId;
    req.session.destroy((err) => {
      if (err) { next(err); return; }
      res.clearCookie('connect.sid');
      logAuth('logout', userId);
      res.status(204).send();
    });
  });

  return router;
}

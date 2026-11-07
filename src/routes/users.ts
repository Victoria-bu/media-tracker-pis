import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import { updateNicknameSchema } from '../validators/userValidators';
import * as authService from '../services/authService';
import { logCrud, logValidationError } from '../logger';

export function createUsersRouter(db: Database.Database): Router {
  const router = Router();

  router.patch('/me', requireAuth, (req, res, next) => {
    const result = updateNicknameSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const field = String(firstError.path[0] ?? 'unknown');
      logValidationError(req.path, field, firstError.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: firstError.message, field });
      return;
    }

    try {
      const { nickname } = result.data;
      const userId = req.session.userId!;
      const user = authService.updateNickname(db, userId, nickname);
      logCrud('update', 'user', userId);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

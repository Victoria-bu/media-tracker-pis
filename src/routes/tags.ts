import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import { getUserTags } from '../services/tagService';
import { logCrud } from '../logger';

export function createTagsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', requireAuth, (req, res, next) => {
    try {
      const tags = getUserTags(db, req.session.userId!);
      logCrud('list', 'tags', req.session.userId!);
      res.status(200).json(tags);
    } catch (err) { next(err); }
  });

  return router;
}

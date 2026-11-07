import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import { logCrud } from '../logger';

function getUserTags(db: Database.Database, userId: string): string[] {
  const rows = db
    .prepare('SELECT tags FROM items WHERE user_id = ?')
    .all(userId) as { tags: string }[];
  const tagSet = new Set<string>();
  for (const row of rows) {
    (JSON.parse(row.tags) as string[]).forEach((t) => tagSet.add(t));
  }
  return Array.from(tagSet).sort();
}

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

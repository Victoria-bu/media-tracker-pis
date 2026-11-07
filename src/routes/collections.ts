import { Router } from 'express';
import Database from 'better-sqlite3';
import { requireAuth } from '../middleware/auth';
import {
  createCollectionSchema,
  updateCollectionSchema,
  addItemSchema,
} from '../validators/collectionValidators';
import * as collectionService from '../services/collectionService';
import { logCrud, logValidationError } from '../logger';

export function createCollectionsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', requireAuth, (req, res, next) => {
    try {
      res.status(200).json(collectionService.listCollections(db, req.session.userId!));
    } catch (err) { next(err); }
  });

  router.post('/', requireAuth, (req, res, next) => {
    const result = createCollectionSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const col = collectionService.createCollection(db, req.session.userId!, result.data.name);
      logCrud('create', 'collection', req.session.userId!, col.id);
      res.status(201).json(col);
    } catch (err) { next(err); }
  });

  router.get('/:id', requireAuth, (req, res, next) => {
    try {
      res.status(200).json(collectionService.getCollection(db, req.params.id, req.session.userId!));
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.patch('/:id', requireAuth, (req, res, next) => {
    const result = updateCollectionSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const col = collectionService.updateCollection(
        db, req.params.id, req.session.userId!, result.data.name,
      );
      logCrud('update', 'collection', req.session.userId!, req.params.id);
      res.status(200).json(col);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.delete('/:id', requireAuth, (req, res, next) => {
    try {
      collectionService.deleteCollection(db, req.params.id, req.session.userId!);
      logCrud('delete', 'collection', req.session.userId!, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.post('/:id/items', requireAuth, (req, res, next) => {
    const result = addItemSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const membership = collectionService.addItemToCollection(
        db, req.params.id, result.data.itemId, req.session.userId!,
      );
      logCrud('add_item', 'collection', req.session.userId!, req.params.id);
      res.status(201).json(membership);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      if (err.status === 409) { res.status(409).json({ code: err.code, message: err.message }); return; }
      next(err);
    }
  });

  router.delete('/:id/items/:itemId', requireAuth, (req, res, next) => {
    try {
      collectionService.removeItemFromCollection(
        db, req.params.id, req.params.itemId, req.session.userId!,
      );
      logCrud('remove_item', 'collection', req.session.userId!, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  return router;
}

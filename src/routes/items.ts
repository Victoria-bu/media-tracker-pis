import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { createItemSchema, updateItemSchema } from '../validators/itemValidators';
import * as itemService from '../services/itemService';
import { logCrud, logValidationError } from '../logger';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  return map[mime] ?? '';
}

function buildUpload(uploadDir: string) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => cb(null, `${uuidv4()}${mimeToExt(file.mimetype)}`),
  });

  return multer({
    storage,
    limits: { fileSize: MAX_COVER_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(Object.assign(new Error('INVALID_FILE_TYPE'), { field: 'file' }));
      }
    },
  });
}

export function createItemsRouter(db: Database.Database, uploadDir: string): Router {
  const router = Router();
  const upload = buildUpload(uploadDir);

  router.get('/', requireAuth, (req, res, next) => {
    try {
      const items = itemService.listItems(db, req.session.userId!);
      res.status(200).json(items);
    } catch (err) { next(err); }
  });

  router.post('/', requireAuth, (req, res, next) => {
    const result = createItemSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const item = itemService.createItem(db, req.session.userId!, result.data);
      logCrud('create', 'item', req.session.userId!, item.id);
      res.status(201).json(item);
    } catch (err) { next(err); }
  });

  router.get('/:id', requireAuth, (req, res, next) => {
    try {
      const item = itemService.getItem(db, req.params.id, req.session.userId!);
      res.status(200).json(item);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.patch('/:id', requireAuth, (req, res, next) => {
    const result = updateItemSchema.safeParse(req.body);
    if (!result.success) {
      const e = result.error.errors[0];
      const field = String(e.path[0] ?? 'unknown');
      logValidationError(req.path, field, e.message);
      res.status(400).json({ code: 'VALIDATION_ERROR', message: e.message, field });
      return;
    }
    try {
      const item = itemService.updateItem(db, req.params.id, req.session.userId!, result.data);
      logCrud('update', 'item', req.session.userId!, req.params.id);
      res.status(200).json(item);
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.delete('/:id', requireAuth, (req, res, next) => {
    try {
      itemService.deleteItem(db, req.params.id, req.session.userId!);
      logCrud('delete', 'item', req.session.userId!, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  router.post('/:id/cover', requireAuth, (req, res, next) => {
    upload.single('file')(req, res, async (uploadErr: any) => {
      if (uploadErr) {
        if (uploadErr.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ code: 'VALIDATION_ERROR', message: 'File exceeds 5 MB limit', field: 'file' });
          return;
        }
        if (uploadErr.message === 'INVALID_FILE_TYPE') {
          res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Accepted formats: JPEG, PNG, WebP', field: 'file' });
          return;
        }
        next(uploadErr);
        return;
      }
      if (!req.file) {
        res.status(400).json({ code: 'VALIDATION_ERROR', message: 'File is required', field: 'file' });
        return;
      }
      try {
        const coverUrl = `/uploads/${req.file.filename}`;
        const item = itemService.setCoverUrl(db, req.params.id, req.session.userId!, coverUrl);
        logCrud('cover_upload', 'item', req.session.userId!, req.params.id);
        res.status(200).json({ coverUrl: item.coverUrl });
      } catch (err: any) {
        if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
        next(err);
      }
    });
  });

  router.delete('/:id/cover', requireAuth, (req, res, next) => {
    try {
      itemService.clearCoverUrl(db, req.params.id, req.session.userId!);
      logCrud('cover_delete', 'item', req.session.userId!, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      if (err.status === 404) { res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found' }); return; }
      next(err);
    }
  });

  return router;
}

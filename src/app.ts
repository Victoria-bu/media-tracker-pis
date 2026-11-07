import express from 'express';
import session from 'express-session';
import Database from 'better-sqlite3';
import { ENV } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createUsersRouter } from './routes/users';
import { createItemsRouter } from './routes/items';
import { createTagsRouter } from './routes/tags';
import { createSessionsRouter } from './routes/sessions';
import { createCollectionsRouter } from './routes/collections';

export interface AppOptions {
  uploadDir?: string;
}

export function createApp(db: Database.Database, options: AppOptions = {}): express.Application {
  const uploadDir = options.uploadDir ?? ENV.UPLOAD_DIR;
  const app = express();

  app.use(express.json());

  app.use(
    session({
      secret: ENV.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  app.use(requestLogger);

  app.use('/api/v1/auth', createAuthRouter(db));
  app.use('/api/v1/users', createUsersRouter(db));
  app.use('/api/v1/items', createItemsRouter(db, uploadDir));
  app.use('/api/v1/items', createSessionsRouter(db));
  app.use('/api/v1/tags', createTagsRouter(db));
  app.use('/api/v1/collections', createCollectionsRouter(db));

  app.use(errorHandler);

  return app;
}

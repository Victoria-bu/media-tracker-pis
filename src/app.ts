import express from 'express';
import session from 'express-session';
import Database from 'better-sqlite3';
import { ENV } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createUsersRouter } from './routes/users';

export function createApp(db: Database.Database): express.Application {
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

  app.use(errorHandler);

  return app;
}

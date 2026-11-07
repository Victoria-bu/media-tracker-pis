export const ENV = {
  PORT: process.env.PORT ?? '3000',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-secret-change-in-prod',
  DB_PATH: process.env.DB_PATH ?? './data/media-tracker.db',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR ?? './data/covers',
};

import { getDb } from './db';
import { createApp } from './app';
import { ENV } from './config/env';

const db = getDb();
const app = createApp(db);

app.listen(Number(ENV.PORT), () => {
  console.log(`Media Tracker API running on port ${ENV.PORT}`);
});

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import pino from 'pino';

import env from './env.js';
import * as schema from '../db/schema/index.js';

console.log('Database URL:', env.DATABASE_URL);

const queryLogger = pino(
  { level: 'info' },
  pino.destination('./query.log')
);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, {
  schema,
  logger: {
    logQuery(query, params) {
      queryLogger.info({ query, params }, 'DB Query');
    },
  },
});
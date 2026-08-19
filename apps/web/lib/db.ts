import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://moringa_app:%40KamalGeraei990@127.0.0.1:5433/moringa_dev?sslmode=disable';

export const dbPool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

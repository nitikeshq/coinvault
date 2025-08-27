import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Hardcoded local PostgreSQL connection
const DATABASE_URL = "postgres://postgres:Octamy%231234@127.0.0.1:5432/chillmandb";

console.log('database url is: ', DATABASE_URL);

// Configure connection for local PostgreSQL
const connectionConfig = {
  connectionString: DATABASE_URL,
  ssl: false // No SSL for local development
};

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
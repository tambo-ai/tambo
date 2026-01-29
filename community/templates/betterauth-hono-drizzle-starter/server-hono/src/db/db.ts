import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const psql = neon(process.env.DATABASE_URL!);
export const db = drizzle(psql, { schema });


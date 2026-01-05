import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';        
import env from './env.js';
import * as schema from '../db/schema/index.js';

// Postgres connection for Drizzle
const queryClient = postgres(env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Supabase client (for future auth integration)
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
);

// Supabase admin client (for server-side operations)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
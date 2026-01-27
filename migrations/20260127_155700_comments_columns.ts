import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add missing columns to comments table
 * - parent_id: For comment threading (replies)
 * - client_mutation_id: For idempotency (prevent duplicates)
 * - likes_count: For tracking comment likes
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add parent_id column for comment threading
  await db.execute(sql`
    ALTER TABLE comments 
    ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id);
  `);

  // Add client_mutation_id column for idempotency
  await db.execute(sql`
    ALTER TABLE comments 
    ADD COLUMN IF NOT EXISTS client_mutation_id TEXT;
  `);

  // Add likes_count column if not exists
  await db.execute(sql`
    ALTER TABLE comments 
    ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
  `);

  // Create index on parent_id for faster queries
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
  `);

  // Create index on client_mutation_id for idempotency lookups
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_comments_client_mutation_id ON comments(client_mutation_id);
  `);

  console.log('[Migration] Added columns to comments: parent_id, client_mutation_id, likes_count');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop indexes first
  await db.execute(sql`DROP INDEX IF EXISTS idx_comments_parent_id;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_comments_client_mutation_id;`);
  
  // Drop columns
  await db.execute(sql`ALTER TABLE comments DROP COLUMN IF EXISTS parent_id;`);
  await db.execute(sql`ALTER TABLE comments DROP COLUMN IF EXISTS client_mutation_id;`);
  await db.execute(sql`ALTER TABLE comments DROP COLUMN IF EXISTS likes_count;`);

  console.log('[Migration] Removed columns from comments: parent_id, client_mutation_id, likes_count');
}

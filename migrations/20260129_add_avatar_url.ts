import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add avatarUrl column to users table
 * 
 * This adds the avatarUrl text column for storing Bunny CDN avatar URLs.
 * The column is nullable to support existing users without avatars.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Check if column already exists
  const checkResult = await db.execute(sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  `);
  
  if (checkResult.rows.length === 0) {
    console.log('[Migration] Adding avatar_url column to users table...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN avatar_url VARCHAR(500)
    `);
    console.log('[Migration] avatar_url column added successfully');
  } else {
    console.log('[Migration] avatar_url column already exists, skipping');
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('[Migration] Dropping avatar_url column from users table...');
  await db.execute(sql`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS avatar_url
  `);
  console.log('[Migration] avatar_url column dropped');
}

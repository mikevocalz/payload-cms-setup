/**
 * Migration: Add Performance Indexes
 * 
 * Adds database indexes for improved query performance on commonly queried columns.
 * 
 * Run via: npx payload migrate
 */

import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log("[Migration] Adding performance indexes...");

  // Posts indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts (created_at DESC);
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON posts (author_id, created_at DESC);
  `);

  // Comments indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON comments (post_id, created_at ASC);
  `);

  // Likes indexes - UNIQUE constraint for idempotent likes
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_user_unique ON likes (post_id, user_id) WHERE post_id IS NOT NULL;
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_comment_user_unique ON likes (comment_id, user_id) WHERE comment_id IS NOT NULL;
  `);

  // Follows indexes - UNIQUE constraint for idempotent follows
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_follower_following_unique ON follows (follower_id, following_id);
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows (follower_id);
  `);

  // Notifications indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at ON notifications (recipient_id, created_at DESC);
  `);

  // Messages indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages (conversation_id, created_at ASC);
  `);

  // Conversations indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);
  `);

  // Bookmarks indexes - UNIQUE constraint
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_post_unique ON bookmarks (user_id, post_id);
  `);

  console.log("[Migration] Performance indexes added successfully");
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log("[Migration] Removing performance indexes...");

  // Remove indexes in reverse order
  await db.execute(sql`DROP INDEX IF EXISTS idx_bookmarks_user_post_unique;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_conversations_updated_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_messages_conversation_created_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_notifications_recipient_created_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_follows_follower;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_follows_following;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_follows_follower_following_unique;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_likes_comment_user_unique;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_likes_post_user_unique;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_comments_post_created_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_posts_author_created_at;`);
  await db.execute(sql`DROP INDEX IF EXISTS idx_posts_created_at_desc;`);

  console.log("[Migration] Performance indexes removed");
}

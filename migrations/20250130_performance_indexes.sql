-- Migration: Add performance indexes for key queries
-- Date: 2025-01-30
-- Description: Indexes for feed, likes, follows, notifications, messages, events

-- =============================================================================
-- POSTS INDEXES
-- =============================================================================
-- Feed query: ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at_desc 
ON posts(created_at DESC);

-- Profile posts query: WHERE user_id = X ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_created 
ON posts(author, created_at DESC);

-- =============================================================================
-- COMMENTS INDEXES
-- =============================================================================
-- Post comments: WHERE post_id = X ORDER BY created_at ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_created 
ON comments(post, created_at ASC);

-- =============================================================================
-- LIKES INDEXES (UNIQUE for idempotency)
-- =============================================================================
-- Post likes: UNIQUE(post_id, user_id)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_post_user_unique 
ON likes(post, "user");

-- =============================================================================
-- COMMENT LIKES INDEXES (if table exists)
-- =============================================================================
-- Comment likes: UNIQUE(comment_id, user_id)
-- Note: Only run if comment_likes table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_likes') THEN
    EXECUTE 'CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_likes_unique ON comment_likes(comment, "user")';
  END IF;
END $$;

-- =============================================================================
-- FOLLOWS INDEXES (UNIQUE for idempotency)
-- =============================================================================
-- Unique follow relationship
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_unique 
ON follows(follower, following);

-- Followers of user X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following 
ON follows(following);

-- Following by user X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower 
ON follows(follower);

-- =============================================================================
-- NOTIFICATIONS INDEXES
-- =============================================================================
-- User notifications: WHERE recipient = X ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_created 
ON notifications(recipient, created_at DESC);

-- Unread notifications: WHERE recipient = X AND read = false
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_unread 
ON notifications(recipient, read) WHERE read = false;

-- =============================================================================
-- MESSAGES INDEXES
-- =============================================================================
-- Conversation messages: WHERE conversation_id = X ORDER BY created_at ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation, created_at ASC);

-- =============================================================================
-- CONVERSATIONS INDEXES
-- =============================================================================
-- Recent conversations: ORDER BY updated_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_updated 
ON conversations(updated_at DESC);

-- =============================================================================
-- EVENT RSVPS INDEXES (UNIQUE for idempotency)
-- =============================================================================
-- Unique RSVP per event/user
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_event_rsvps_unique 
ON event_rsvps(event, "user");

-- Event participants: WHERE event_id = X AND status = 'going'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_rsvps_event_status 
ON event_rsvps(event, status);

-- =============================================================================
-- EVENTS INDEXES
-- =============================================================================
-- Upcoming events: ORDER BY date/startDate
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date 
ON events(date DESC) WHERE date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_start_date 
ON events(start_date DESC) WHERE start_date IS NOT NULL;

-- =============================================================================
-- BOOKMARKS INDEXES
-- =============================================================================
-- User bookmarks: WHERE user_id = X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user 
ON bookmarks("user");

-- Unique bookmark per post/user
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_post_unique 
ON bookmarks("user", post);

-- Verify indexes created
DO $$
BEGIN
  RAISE NOTICE 'Performance indexes migration completed successfully';
END $$;

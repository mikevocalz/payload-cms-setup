-- Migration: Fix bookmarks table column names
-- Date: 2025-01-30
-- Description: Rename User/Post columns to user_id/post_id to match Payload v3 conventions

-- Check current column names and rename if needed
DO $$
BEGIN
  -- If "User" column exists (capitalized), rename to user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookmarks' AND column_name = 'User'
  ) THEN
    ALTER TABLE bookmarks RENAME COLUMN "User" TO user_id;
    RAISE NOTICE 'Renamed User to user_id';
  END IF;

  -- If "Post" column exists (capitalized), rename to post_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookmarks' AND column_name = 'Post'
  ) THEN
    ALTER TABLE bookmarks RENAME COLUMN "Post" TO post_id;
    RAISE NOTICE 'Renamed Post to post_id';
  END IF;
END $$;

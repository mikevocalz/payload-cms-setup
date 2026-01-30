-- Migration: Add coverImageUrl and images to events table
-- Date: 2025-01-30
-- Description: Adds Bunny CDN URL fields for event cover and gallery images

-- Add coverImageUrl column (text, nullable)
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add images column (JSONB array for gallery images)
-- Structure: [{ url: string, width?: number, height?: number, mimeType?: string }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Create index on coverImageUrl for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_cover_image_url ON events(cover_image_url) WHERE cover_image_url IS NOT NULL;

-- Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'cover_image_url'
  ) THEN
    RAISE NOTICE 'Migration successful: cover_image_url column added to events';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'images'
  ) THEN
    RAISE NOTICE 'Migration successful: images column added to events';
  END IF;
END $$;

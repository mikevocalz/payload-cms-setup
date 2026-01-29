-- Migration: Add ticket_token column to event_rsvps table
-- Run this in Supabase SQL Editor before deploying

-- Add ticket_token column for QR code ticket verification
ALTER TABLE event_rsvps 
ADD COLUMN IF NOT EXISTS ticket_token TEXT;

-- Create index for fast ticket lookup
CREATE INDEX IF NOT EXISTS idx_event_rsvps_ticket_token 
ON event_rsvps (ticket_token) 
WHERE ticket_token IS NOT NULL;

-- Add unique constraint to prevent duplicate tickets
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_rsvps_ticket_unique 
ON event_rsvps (ticket_token) 
WHERE ticket_token IS NOT NULL;

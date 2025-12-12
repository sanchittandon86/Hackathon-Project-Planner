-- Migration: Add generation_id to plan_versions to group records from same plan generation
-- Run this SQL in your Supabase SQL Editor

-- Add generation_id column to track which version records were created together
ALTER TABLE plan_versions 
ADD COLUMN IF NOT EXISTS generation_id UUID;

-- Add generation_timestamp for easier sorting and display
ALTER TABLE plan_versions 
ADD COLUMN IF NOT EXISTS generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for faster queries by generation
CREATE INDEX IF NOT EXISTS idx_plan_versions_generation_id ON plan_versions(generation_id);
CREATE INDEX IF NOT EXISTS idx_plan_versions_generation_timestamp ON plan_versions(generation_timestamp);


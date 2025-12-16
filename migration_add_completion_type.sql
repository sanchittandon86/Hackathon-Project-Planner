-- Migration: Add completion_type to plans table
-- Run this SQL in your Supabase SQL Editor

-- Add completion_type column to track on-time vs late completion
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS completion_type VARCHAR(10) CHECK (completion_type IN ('on_time', 'late'));

-- Create index for faster queries on completion type
CREATE INDEX IF NOT EXISTS idx_plans_completion_type ON plans(completion_type);

-- Migration: Add task completion tracking to plans table
-- Run this SQL in your Supabase SQL Editor

-- Add is_completed column
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add completed_at timestamp column
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on completion status
CREATE INDEX IF NOT EXISTS idx_plans_is_completed ON plans(is_completed);


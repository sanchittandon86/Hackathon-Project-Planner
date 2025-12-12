-- Migration: Add due date support and overdue tracking
-- Run this SQL in your Supabase SQL Editor

-- Add due_date to tasks table (nullable)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add overdue tracking columns to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS days_overdue INTEGER DEFAULT 0;


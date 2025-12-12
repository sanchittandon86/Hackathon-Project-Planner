-- Migration: Add last_updated timestamp columns
-- Run this SQL in your Supabase SQL Editor

-- Add last_updated to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add last_updated to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add last_updated to leaves table
ALTER TABLE leaves 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add last_updated to plans table
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have a default timestamp
UPDATE employees SET last_updated = NOW() WHERE last_updated IS NULL;
UPDATE tasks SET last_updated = NOW() WHERE last_updated IS NULL;
UPDATE leaves SET last_updated = NOW() WHERE last_updated IS NULL;
UPDATE plans SET last_updated = NOW() WHERE last_updated IS NULL;


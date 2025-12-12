-- Migration: Add employee_name and task_title to plan_versions for historical preservation
-- Run this SQL in your Supabase SQL Editor

-- Add employee_name and task_title columns to preserve names even after deletion
ALTER TABLE plan_versions 
ADD COLUMN IF NOT EXISTS employee_name TEXT;

ALTER TABLE plan_versions 
ADD COLUMN IF NOT EXISTS task_title TEXT;

-- Optional: Backfill existing records (if any exist)
-- This would require joining with employees and tasks tables
-- UPDATE plan_versions pv
-- SET employee_name = e.name
-- FROM employees e
-- WHERE pv.employee_id = e.id AND pv.employee_name IS NULL;
--
-- UPDATE plan_versions pv
-- SET task_title = t.title
-- FROM tasks t
-- WHERE pv.task_id = t.id AND pv.task_title IS NULL;


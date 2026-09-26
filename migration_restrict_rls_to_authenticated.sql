-- Migration: Restrict all RLS policies to logged-in users only
-- Run this SQL in your Supabase SQL Editor
--
-- This is the step that makes the new login screen actually enforce access
-- control. Before this, every policy also granted access to the `anon`
-- role - meaning anyone with the public anon key (which ships in the
-- browser bundle, visible in devtools) could read/write every table
-- directly via the Supabase REST API, completely bypassing the /login
-- page. The app itself now always authenticates via cookies
-- (lib/supabase/server.ts + middleware.ts), so it only ever needs the
-- `authenticated` role from here on.
--
-- Safe to re-run: ALTER POLICY just overwrites the role list each time.

alter policy "Allow all employees deletes" on employees to authenticated;
alter policy "Allow all employee inserts" on employees to authenticated;
alter policy "Allow insert employees" on employees to authenticated;
alter policy "Allow all tasks inserts" on employees to authenticated;
alter policy "Allow all employee reads" on employees to authenticated;
alter policy "update user details" on employees to authenticated;

alter policy "Allow all leaves deletes" on leaves to authenticated;
alter policy "Allow all leaves inserts" on leaves to authenticated;
alter policy "Allow all leaves reads" on leaves to authenticated;
alter policy "Allow all leaves updates" on leaves to authenticated;

alter policy "Allow all plan_versions deletes" on plan_versions to authenticated;
alter policy "Allow all plan_versions inserts" on plan_versions to authenticated;
alter policy "Allow all plan_versions reads" on plan_versions to authenticated;
alter policy "Allow all plan_versions updates" on plan_versions to authenticated;

alter policy "Allow all plans deletes" on plans to authenticated;
alter policy "Allow all plans inserts" on plans to authenticated;
alter policy "Allow all tasks reads" on plans to authenticated;
alter policy "Allow all plans updates" on plans to authenticated;

alter policy "Allow all tasks deletes" on tasks to authenticated;
alter policy "Allow all tasks inserts" on tasks to authenticated;
alter policy "Allow all tasks reads" on tasks to authenticated;
alter policy "Allow all tasks updates" on tasks to authenticated;

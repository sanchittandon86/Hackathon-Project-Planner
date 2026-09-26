-- Migration: Add missing Row Level Security policies
-- Run this SQL in your Supabase SQL Editor
--
-- Problem: RLS is enabled on every table, but policies only exist for a
-- subset of tables/operations. Postgres denies anything with no matching
-- policy - silently, with no error surfaced to the app in most cases
-- (DELETE/UPDATE just match 0 rows; the app logs "success"). This means,
-- against the live database, right now:
--   - leaves:         ALL operations blocked (select/insert/update/delete)
--                      -> Leave Management always shows 0 leaves, adding a
--                         leave silently fails
--   - plan_versions:  ALL operations blocked
--                      -> Version History page is always empty; the
--                         insert in savePlanToDB() fails every time (42501)
--   - plans:          UPDATE and DELETE blocked (SELECT/INSERT already work)
--                      -> "Mark Complete" silently does nothing; old plans
--                         are never actually deleted on regeneration, they
--                         just pile up forever
--   - tasks:          UPDATE and DELETE blocked (SELECT/INSERT already work)
--                      -> Editing or deleting a task from the UI silently
--                         does nothing
--   - employees:      DELETE blocked (SELECT/INSERT/UPDATE already work)
--                      -> Deleting an employee silently does nothing
--
-- This app has no per-user auth yet (see PRODUCTION_READINESS_REPORT.md /
-- fixing.txt item #4) - it's a single shared anon-key tool. These policies
-- match that existing (documented, already-flagged) security model: fully
-- open to anon + authenticated. They restore the CRUD behavior the app's
-- own code already assumes exists. This is NOT a substitute for adding
-- real authentication + scoped policies before any public deployment.

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'leaves' and policyname = 'Allow all leaves reads'
  ) then
    create policy "Allow all leaves reads" on leaves
      for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'leaves' and policyname = 'Allow all leaves inserts'
  ) then
    create policy "Allow all leaves inserts" on leaves
      for insert to anon, authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'leaves' and policyname = 'Allow all leaves updates'
  ) then
    create policy "Allow all leaves updates" on leaves
      for update to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'leaves' and policyname = 'Allow all leaves deletes'
  ) then
    create policy "Allow all leaves deletes" on leaves
      for delete to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plan_versions' and policyname = 'Allow all plan_versions reads'
  ) then
    create policy "Allow all plan_versions reads" on plan_versions
      for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plan_versions' and policyname = 'Allow all plan_versions inserts'
  ) then
    create policy "Allow all plan_versions inserts" on plan_versions
      for insert to anon, authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plan_versions' and policyname = 'Allow all plan_versions updates'
  ) then
    create policy "Allow all plan_versions updates" on plan_versions
      for update to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plan_versions' and policyname = 'Allow all plan_versions deletes'
  ) then
    create policy "Allow all plan_versions deletes" on plan_versions
      for delete to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plans' and policyname = 'Allow all plans updates'
  ) then
    create policy "Allow all plans updates" on plans
      for update to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'plans' and policyname = 'Allow all plans deletes'
  ) then
    create policy "Allow all plans deletes" on plans
      for delete to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'tasks' and policyname = 'Allow all tasks updates'
  ) then
    create policy "Allow all tasks updates" on tasks
      for update to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'tasks' and policyname = 'Allow all tasks deletes'
  ) then
    create policy "Allow all tasks deletes" on tasks
      for delete to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'employees' and policyname = 'Allow all employees deletes'
  ) then
    create policy "Allow all employees deletes" on employees
      for delete to anon, authenticated using (true);
  end if;
end $$;

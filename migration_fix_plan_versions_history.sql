-- Migration: Stop plan_versions history from disappearing on every regeneration
-- Run this SQL in your Supabase SQL Editor
--
-- Problem: plan_versions.plan_id had "ON DELETE CASCADE" pointing at plans(id).
-- Every time "Generate Plan" ran, the old plan row it just recorded a version
-- for was deleted as part of the regular plan-refresh step, which CASCADE
-- deleted the version record too - so the Version History page was showing
-- (near) nothing even though version records were being created correctly.
--
-- Fix: allow plan_id to be NULL, and change the delete behavior to
-- "ON DELETE SET NULL" so history rows survive plan deletion/regeneration.
-- All the human-readable fields (employee_name, task_title, old/new dates)
-- are already stored directly on plan_versions, so losing the plan_id link
-- does not lose any information shown on the Version History page.

alter table plan_versions
  alter column plan_id drop not null;

do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'plan_versions'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'plan_id';

  if fk_name is not null then
    execute format('alter table plan_versions drop constraint %I', fk_name);
  end if;
end $$;

alter table plan_versions
  add constraint plan_versions_plan_id_fkey
  foreign key (plan_id) references plans(id) on delete set null;

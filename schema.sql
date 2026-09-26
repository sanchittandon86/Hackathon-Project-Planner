-- Full base schema for Hackathon-Project-Planner
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query) for a fresh project.
-- Reconstructed from application code + the incremental migration_add_*.sql files in this repo,
-- since no base-schema SQL previously existed in version control.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- employees
-- ─────────────────────────────────────────────
create table if not exists employees (
  id bigint generated always as identity primary key,
  name text not null,
  designation text not null check (designation in ('Developer', 'QA')),
  active boolean not null default true,
  created_at timestamptz default now(),
  last_updated timestamptz default now()
);

-- ─────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────
create table if not exists tasks (
  id bigint generated always as identity primary key,
  client text not null,
  title text not null,
  effort_hours numeric not null,
  designation_required text not null check (designation_required in ('Developer', 'QA')),
  due_date date,
  created_at timestamptz default now(),
  last_updated timestamptz default now()
);

-- ─────────────────────────────────────────────
-- plans
-- ─────────────────────────────────────────────
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  task_id bigint references tasks(id) on delete cascade,
  employee_id bigint references employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  total_hours numeric not null,
  is_overdue boolean default false,
  days_overdue integer default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  completion_type varchar(10) check (completion_type in ('on_time', 'late')),
  last_updated timestamptz default now()
);

create index if not exists idx_plans_is_completed on plans(is_completed);
create index if not exists idx_plans_completion_type on plans(completion_type);

-- ─────────────────────────────────────────────
-- leaves
-- ─────────────────────────────────────────────
create table if not exists leaves (
  id bigint generated always as identity primary key,
  employee_id bigint references employees(id) on delete cascade,
  leave_date date not null,
  last_updated timestamptz default now()
);

-- ─────────────────────────────────────────────
-- plan_versions
-- ─────────────────────────────────────────────
create table if not exists plan_versions (
  id bigint generated always as identity primary key,
  plan_id uuid references plans(id) on delete set null,
  task_id bigint references tasks(id) on delete set null,
  employee_id bigint references employees(id) on delete set null,
  employee_name text,
  task_title text,
  old_start_date date not null,
  old_end_date date not null,
  new_start_date date not null,
  new_end_date date not null,
  delta_days integer not null,
  generation_id uuid,
  generation_timestamp timestamptz default now()
);

create index if not exists idx_plan_versions_generation_id on plan_versions(generation_id);
create index if not exists idx_plan_versions_generation_timestamp on plan_versions(generation_timestamp);

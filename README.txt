SMART PROJECT PLANNER - PROJECT DOCUMENTATION
===============================================

OVERVIEW
--------
A project-planning and resource-allocation tool for teams. It takes
employees, tasks, and employee leave dates, and automatically generates
a schedule: who works on what, and when, based on who is least busy and
who is actually available. It supports simulating "what-if" scenarios
(e.g. an employee going on leave mid-project) before committing to a
plan, and keeps a version history of every change between re-plans.


BUSINESS PROBLEM AND HOW IT IS SOLVED
--------------------------------------
Problem                                          | Solution
--------------------------------------------------|---------------------------------------------------------
Manual spreadsheet-based task assignment          | One click ("Generate Plan") auto-assigns every task to
                                                    the best-fit, least-busy employee
Hard to see who is overloaded vs idle             | Load-balancing algorithm always picks the employee with
                                                    the lowest total allocated hours
Leave days forgotten when scheduling              | Leave dates are first-class data; the scheduler skips
                                                    them automatically
Risky to test "what if X goes on leave" on the    | Simulator runs the same algorithm on hypothetical inputs
  real plan                                         without touching real data
No record of how/why a plan changed               | Version history logs every date shift and reassignment,
                                                    grouped by each "Generate Plan" run


TECH STACK
----------
Layer              | Technology                          | Purpose
--------------------|--------------------------------------|--------------------------------------------------------
Framework           | Next.js 16 (App Router)              | Co-locates server-side data fetching with pages;
                     |                                       Server Components keep DB logic off the client
Language             | TypeScript                           | Compile-time safety (e.g. employee designation is a
                     |                                       strict 'Developer' | 'QA' union)
UI library           | React 19                              | Required by Next 16 App Router's Server/Client model
Styling              | Tailwind CSS + Radix UI               | Utility-first CSS plus accessible, unstyled primitives
                     |                                       (dialogs, dropdowns, tabs)
Database & Auth      | Supabase (hosted Postgres + Auth)     | Relational DB, row-level security, built-in
                     |                                       email/password auth
Charts               | Recharts                              | Dashboard pie/bar charts (tasks per client, workload
                     |                                       distribution)
CSV / Excel          | PapaParse (import) + xlsx (export)    | Bulk-import employees/tasks from CSV; export version
                     |                                       history to Excel
Notifications        | Sonner                                | Toast messages on action success/failure
Dates                | date-fns                              | Weekend detection and date math used throughout the
                     |                                       scheduling algorithm


ARCHITECTURE: SERVER VS CLIENT SEPARATION
-------------------------------------------
Next.js App Router conventions enforce a strict split between server-only
and client-only code.

File pattern             | Runs where | Touches DB? | Uses React hooks? | Role
--------------------------|------------|-------------|--------------------|------------------------------------
app/**/page.tsx           | Server     | Yes         | No                 | Fetches data, renders initial HTML
app/**/*Client.tsx        | Browser    | No          | Yes                | All interactivity: forms, dialogs,
                          |            |             |                    | filters
app/**/actions.ts         | Server     | Yes         | No                 | Mutations (create/update/delete),
 ("use server")           |            |             |                    | invoked from the client
lib/**/server.ts          | Server     | Yes         | No                 | Reusable data-fetching functions
app/api/**/route.ts       | Server     | Yes         | No                 | REST-style endpoint (used for plan
                          |            |             |                    | generation)

Read path:
  Browser requests a page -> Server Component (page.tsx) calls a server
  utility (lib/.../server.ts) -> Supabase query runs on the server ->
  data passed down as props to the Client Component -> HTML streams to
  the browser.

Write path:
  User triggers an action in a Client Component -> it calls a Server
  Action ("use server") -> that function runs on the server, writes to
  Supabase, calls revalidatePath() -> client calls router.refresh() ->
  the page re-fetches fresh data.

The Supabase anon key and all query logic never ship to the browser
bundle. Every read and write happens server-side; the browser only ever
sees props and calls typed server functions.


CORE FEATURES BY PAGE
-----------------------
Page/Route            | What it does                                              | Key server actions
------------------------|------------------------------------------------------------|---------------------------------------------
/ (Dashboard)           | Stats cards (employees, tasks, overdue, completed) plus   | read-only, fetchDashboardAnalytics()
                        | two charts (tasks-per-client, workload-per-employee)       |
/employees              | CRUD for employees (name, designation, active flag);      | addEmployee, updateEmployee, deleteEmployee,
                        | bulk CSV import                                           | bulkImportEmployees
/tasks                  | CRUD for tasks (client, title, effort hours, required     | addTask, updateTask, deleteTask,
                        | designation, due date); bulk CSV import                   | bulkImportTasks
/leaves                 | Record which employee is on leave on which date           | addLeave, deleteLeave
/planner                | Core feature: "Generate Plan" auto-schedules every task;  | markPlanCompleted, plan generation via
                        | view by date/employee/task, filter overdue                | /api/generate-plan
/planner/simulator      | Run "what-if" scenarios (delay a task, block an           | runPlanSimulation, applySimulation
                        | employee) without saving                                   |
/planner/versions       | Audit trail of date/assignment changes across plan        | read-only
                        | regenerations, grouped by generation run                   |
/login                  | Supabase email/password auth                              | Supabase Auth, middleware-protected routes


SCHEDULING ALGORITHM
-----------------------
File: lib/planningEngine.ts, function generatePlan()

Step | What happens
------|---------------------------------------------------------------------
1    | Fetch all employees, tasks, and leave records from Postgres
2    | Sort tasks smallest effort first (greedy heuristic so small tasks
     | are not stuck behind one large task)
3    | For each task, filter employees to those whose designation matches
     | the task's designation_required (Developer vs QA)
4    | Among matching candidates, pick the one with the lowest total
     | allocated hours so far (greedy fairness rule)
5    | Walk day-by-day from the employee's next-available date, skipping
     | weekends and any date matching a leaves row for that employee
6    | Subtract 8 hours per working day until effort_hours is fully
     | consumed; this gives the start date and end date
7    | Compare the calculated end date to the task's due_date; if later,
     | mark is_overdue = true and compute days_overdue
8    | Repeat for the next task, using each employee's updated
     | next-available date and workload

Design note: this is a greedy, single-pass heuristic (O(n) over sorted
tasks), not a true optimizer - there is no backtracking or reassignment
to minimize total project duration. This is a deliberate
simplicity-over-optimality tradeoff. A production-grade optimizer would
use constraint programming or a bin-packing/ILP formulation.


SIMULATOR
-----------
Concept            | Explanation
---------------------|-----------------------------------------------------------
Purpose              | Test the impact of delays or employee unavailability
                     | before committing to a real plan
Inputs               | delayedTasks: [{task_id, delay_days}] and
                     | blockedEmployees: [{employee_id, from, to}]
How it works         | generatePlanSimulation() runs the same core algorithm as
                     | generatePlan(), but (a) merges blocked date ranges into a
                     | temporary in-memory copy of leaves, and (b) pushes a
                     | task's earliest start date forward by its delay_days
                     | before allocating
Key guarantee        | Never writes to the database unless the user explicitly
                     | clicks "Apply" (applySimulation)


VERSION HISTORY
------------------
Concept                      | Explanation
--------------------------------|---------------------------------------------------
Trigger                         | Every time savePlanToDB() runs (every "Generate
                                | Plan" click)
Comparison                      | Before overwriting, diffs the new plan against the
                                | existing plans table, task-by-task
What creates a version record   | Same task + same employee but dates changed, OR
                                | task reassigned to a different employee
What does not create a record   | Unchanged tasks, or brand-new tasks on their first
                                | generation (no prior state to diff against)
Grouping                        | All version records from one click share a
                                | generation_id (UUID) and generation_timestamp
delta_days                      | new_end_date - old_end_date: positive = delayed,
                                | negative = finished earlier, 0 = no change
Safety detail                   | Completed plans (is_completed = true) are
                                | explicitly protected from deletion/overwrite during
                                | regeneration


DATA MODEL
------------
Table            | Key columns                                                          | Purpose
-------------------|------------------------------------------------------------------------|------------------------------
employees          | id, name, designation (Developer/QA), active                          | Who can be assigned work
tasks              | id, client, title, effort_hours, designation_required, due_date       | What needs to be done
leaves             | id, employee_id, leave_date                                           | Days an employee is unavailable
plans              | task_id, employee_id, start_date, end_date, total_hours, is_overdue,  | The current, live schedule
                   | days_overdue, is_completed                                            |
plan_versions      | plan_id, task_id, employee_id, old/new start+end dates, delta_days,   | Historical diff log
                   | generation_id, generation_timestamp                                   |

Auth users live separately in Supabase's built-in auth.users table, not a
custom table in this schema. Row Level Security (RLS) policies scope
data access to authenticated users.


NOTABLE ENGINEERING DECISIONS AND FIXES
------------------------------------------
Issue                                   | Root cause                                  | Fix
------------------------------------------|-----------------------------------------------|---------------------------------------------
Suspense fallbacks not showing on hard    | Each page.tsx awaited its Supabase fetch      | Moved each page's data fetch into a separate
navigation                                 | directly before returning JSX, so the         | async child component inside the existing
                                           | Suspense boundary never got a chance to       | Suspense boundary, so the skeleton loader
                                           | render its fallback - the page was already    | renders immediately and content streams in
                                           | blocked before React reached the return       | once the query resolves
                                           | statement                                      |
Plan regeneration could silently wipe     | A blanket "delete non-completed plans" plus   | Reordered to insert new plans before deleting
completed task history                     | insert-new-plans sequence meant an insert     | stale ones (fail-safe ordering), and
                                           | failure left the table half-deleted, and      | explicitly protect any row with
                                           | unchecking "exclude completed" in the UI      | is_completed = true from deletion/overwrite
                                           | could overwrite completion flags              | regardless of UI toggle state
Missing RLS policies                      | Tables were reachable without proper          | Added RLS policies, Supabase Auth, and
                                           | row-level security scoping                     | route-level middleware protection


SECURITY MODEL
----------------
Layer                  | Mechanism
--------------------------|---------------------------------------------------------------
Authentication            | Supabase Auth, email + password (signInWithPassword)
Session handling          | @supabase/ssr reads/writes the session via cookies so
                          | server-side queries run as the authenticated user, not the
                          | anonymous role
Authorization             | Postgres Row Level Security (RLS) policies scoped to the
                          | authenticated role
Secrets                   | Only NEXT_PUBLIC_SUPABASE_URL and the anon key are exposed
                          | client-side; no service-role key anywhere in the app - all
                          | protection relies on RLS, not a hidden secret
Route protection          | Middleware redirects unauthenticated users to
                          | /login?redirectTo=...


ENVIRONMENT VARIABLES
------------------------
NEXT_PUBLIC_SUPABASE_URL        - Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   - Supabase anon/public key

Both are required at deploy time (e.g. in Vercel project settings). No
other secrets are read by the application.


GLOSSARY
----------
Term                        | Meaning here
-------------------------------|---------------------------------------------------------
Server Component               | React component that renders on the server, can await
                                | data directly, ships no JS to the browser
Client Component                | Marked "use client"; hydrates in the browser, can use
                                | hooks and handle events
Server Action                   | A function marked "use server" that the client calls
                                | like a normal function, but it runs on the server
RLS (Row Level Security)        | Postgres feature restricting which rows a query can
                                | see/modify based on the authenticated user
Greedy algorithm                | Makes the locally-best choice at each step (least-
                                | loaded employee) without looking ahead
Revalidation (revalidatePath)   | Tells Next.js to invalidate its cache for a route so
                                | the next fetch gets fresh data

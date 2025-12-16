# Application Scaffolding Structure
**Date**: 2025-01-27  
**Architecture**: Hybrid Server + Client (Next.js App Router)

---

## 🎯 Quick Reference: Server vs Client

| Location | Type | Directive | Can Use Hooks? | Can Query DB? | Renders Where? |
|----------|------|-----------|----------------|---------------|----------------|
| `app/**/page.tsx` | 🟢 SERVER | None | ❌ No | ✅ Yes | Server → HTML |
| `app/**/*Client.tsx` | 🔵 CLIENT | `"use client"` | ✅ Yes | ❌ No | Browser |
| `app/**/actions.ts` | 🟢 SERVER | `"use server"` | ❌ No | ✅ Yes | Server only |
| `lib/**/server.ts` | 🟢 SERVER | None | ❌ No | ✅ Yes | Server only |
| `app/api/**/route.ts` | 🟢 SERVER | None | ❌ No | ✅ Yes | Server only |
| `components/ui/*.tsx` | 🔵 CLIENT | `"use client"` | ✅ Yes | ❌ No | Browser |
| `components/dashboard/*.tsx` | Mixed | See file | Varies | Varies | Varies |

---

## 📁 Complete File Structure

```
smart-project-planner/
│
├── 📄 Configuration Files
│   ├── package.json                    # Dependencies & scripts
│   ├── package-lock.json               # Locked dependency versions
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── next.config.js                 # Next.js configuration (if exists)
│   ├── tailwind.config.js             # Tailwind CSS configuration (if exists)
│   ├── postcss.config.js              # PostCSS configuration (if exists)
│   └── .env.local                     # Environment variables (not in repo)
│
├── 📂 app/                            # Next.js App Router (ROOT)
│   │
│   ├── 📄 layout.tsx                  # 🟢 SERVER - Root layout (Server Component)
│   │   └── Renders: Sidebar, Toaster
│   │
│   ├── 📄 page.tsx                    # 🟢 SERVER - Dashboard home page
│   │   ├── Fetches: fetchDashboardAnalytics()
│   │   └── Renders: DashboardStats, DashboardCharts, DashboardCards
│   │
│   ├── 📂 employees/
│   │   ├── 📄 page.tsx                # 🟢 SERVER - Employees list page
│   │   │   ├── Fetches: fetchEmployees()
│   │   │   └── Renders: EmployeesClient
│   │   │
│   │   ├── 📄 EmployeesClient.tsx     # 🔵 CLIENT - All UI interactions
│   │   │   ├── State: useState, useTransition
│   │   │   ├── Calls: addEmployee, updateEmployee, deleteEmployee, bulkImportEmployees
│   │   │   └── Features: Table, search, filters, dialogs, CSV upload
│   │   │
│   │   └── 📄 actions.ts              # 🟢 SERVER - Server Actions ("use server")
│   │       ├── addEmployee()
│   │       ├── updateEmployee()
│   │       ├── deleteEmployee()
│   │       └── bulkImportEmployees()
│   │
│   ├── 📂 tasks/
│   │   ├── 📄 page.tsx                # 🟢 SERVER - Tasks list page
│   │   │   ├── Fetches: fetchTasks()
│   │   │   └── Renders: TasksClient
│   │   │
│   │   ├── 📄 TasksClient.tsx         # 🔵 CLIENT - All UI interactions
│   │   │   ├── State: useState, useTransition
│   │   │   ├── Calls: addTask, updateTask, deleteTask, bulkImportTasks
│   │   │   └── Features: Table, search, filters, dialogs, CSV upload, stats
│   │   │
│   │   └── 📄 actions.ts             # 🟢 SERVER - Server Actions ("use server")
│   │       ├── addTask()
│   │       ├── updateTask()
│   │       ├── deleteTask()
│   │       └── bulkImportTasks()
│   │
│   ├── 📂 leaves/
│   │   ├── 📄 page.tsx                # 🟢 SERVER - Leaves list page
│   │   │   ├── Fetches: fetchEmployees(), fetchLeaves() (parallel)
│   │   │   └── Renders: LeavesClient
│   │   │
│   │   ├── 📄 LeavesClient.tsx       # 🔵 CLIENT - All UI interactions
│   │   │   ├── State: useState, useTransition
│   │   │   ├── Calls: addLeave, deleteLeave
│   │   │   └── Features: Employee select, date input, table, delete dialog
│   │   │
│   │   └── 📄 actions.ts             # 🟢 SERVER - Server Actions ("use server")
│   │       ├── addLeave()
│   │       └── deleteLeave()
│   │
│   ├── 📂 planner/
│   │   ├── 📄 page.tsx                # 🟢 SERVER - Planner main page
│   │   │   ├── Fetches: fetchPlans(), checkRecalculationNeeded() (parallel)
│   │   │   └── Renders: PlannerClient
│   │   │
│   │   ├── 📄 PlannerClient.tsx       # 🔵 CLIENT - All UI interactions
│   │   │   ├── State: useState, useTransition, useMemo
│   │   │   ├── Calls: markPlanCompleted (Server Action)
│   │   │   ├── Calls: /api/generate-plan (API route - preserved)
│   │   │   └── Features: Tabs, filters, grouping, status badges, plan generation
│   │   │
│   │   ├── 📄 actions.ts              # 🟢 SERVER - Server Actions ("use server")
│   │   │   └── markPlanCompleted()
│   │   │
│   │   ├── 📂 simulator/
│   │   │   ├── 📄 page.tsx            # 🟢 SERVER - Simulator page
│   │   │   │   ├── Fetches: fetchTasksForSimulator(), fetchEmployeesForSimulator() (parallel)
│   │   │   │   └── Renders: SimulatorClient
│   │   │   │
│   │   │   ├── 📄 SimulatorClient.tsx # 🔵 CLIENT - All UI + simulation logic
│   │   │   │   ├── State: useState, useTransition
│   │   │   │   ├── Calls: runPlanSimulation (Server Action)
│   │   │   │   ├── Calls: applySimulation (Server Action)
│   │   │   │   ├── Logic: generatePlanSimulation (via Server Action)
│   │   │   │   └── Features: Delay tasks, block employees, simulation preview, apply changes
│   │   │   │
│   │   │   └── 📄 actions.ts          # 🟢 SERVER - Server Actions ("use server")
│   │   │       ├── runPlanSimulation()    # Calls generatePlanSimulation with server client
│   │   │       └── applySimulation()      # Saves simulated plans to DB
│   │   │
│   │   └── 📂 versions/
│   │       ├── 📄 page.tsx            # 🟢 SERVER - Version history page
│   │       │   ├── Fetches: fetchPlanVersions()
│   │       │   └── Renders: VersionsClient
│   │       │
│   │       └── 📄 VersionsClient.tsx  # 🔵 CLIENT - All UI interactions
│   │           ├── State: useState, useMemo
│   │           └── Features: Table, sorting, grouping by generation, delta badges
│   │
│   └── 📂 api/                        # API Routes (Server-side only)
│       └── 📂 generate-plan/
│           └── 📄 route.ts             # 🟢 SERVER - POST /api/generate-plan
│               ├── Uses: generatePlan(), savePlanToDB() from planningEngine
│               ├── Accepts: simulatedPlans (optional)
│               └── Returns: { success, plan }
│
├── 📂 lib/                            # Shared Libraries & Utilities
│   │
│   ├── 📂 supabase/
│   │   ├── 📄 server.ts               # 🟢 SERVER - Server Supabase client factory
│   │   │   └── createServerSupabaseClient()
│   │   │
│   │   └── 📄 supabaseClient.ts       # 🔵 CLIENT - Browser Supabase client (LEGACY)
│   │       └── ⚠️ Not used by server logic
│   │       └── Safe to remove once any remaining legacy client-side usage is eliminated
│   │
│   ├── 📂 analytics/
│   │   └── 📄 dashboard.ts            # 🟢 SERVER - Dashboard data aggregation
│   │       └── fetchDashboardAnalytics()
│   │           ├── 7 parallel Supabase queries
│   │           └── Returns: DashboardAnalytics
│   │
│   ├── 📂 employees/
│   │   └── 📄 server.ts               # 🟢 SERVER - Employee data fetching
│   │       └── fetchEmployees()
│   │
│   ├── 📂 tasks/
│   │   └── 📄 server.ts               # 🟢 SERVER - Task data fetching
│   │       └── fetchTasks()
│   │
│   ├── 📂 leaves/
│   │   └── 📄 server.ts               # 🟢 SERVER - Leave data fetching
│   │       ├── fetchEmployees()
│   │       └── fetchLeaves()          # Includes employee name join
│   │
│   ├── 📂 planner/
│   │   ├── 📄 server.ts               # 🟢 SERVER - Planner data fetching
│   │   │   ├── fetchPlans()           # Complex joins (tasks, employees)
│   │   │   └── checkRecalculationNeeded()
│   │   │
│   │   ├── 📄 simulator-server.ts    # 🟢 SERVER - Simulator data fetching
│   │   │   ├── fetchTasksForSimulator()
│   │   │   └── fetchEmployeesForSimulator()
│   │   │
│   │   └── 📄 versions-server.ts      # 🟢 SERVER - Version history fetching
│   │       └── fetchPlanVersions()    # Includes task/employee joins
│   │
│   ├── 📄 planningEngine.ts           # 🟢 SERVER - Plan generation algorithm
│   │   ├── generatePlan(supabase: SupabaseClient)    # Main plan generation
│   │   ├── generatePlanSimulation(supabase: SupabaseClient, options)  # Simulation with delays/blocks
│   │   └── savePlanToDB(supabase: SupabaseClient, plans)  # Save plans with version tracking
│   │   └── ✅ Accepts Supabase client as parameter (no direct import)
│   │
│   └── 📄 utils.ts                    # Shared utilities (cn function, etc.)
│
├── 📂 components/                     # React Components
│   │
│   ├── 📂 dashboard/
│   │   ├── 📄 DashboardStats.tsx     # 🟢 SERVER - Stats cards (no interactivity)
│   │   ├── 📄 DashboardCharts.tsx     # 🔵 CLIENT - Chart wrapper
│   │   ├── 📄 DashboardCards.tsx      # 🟢 SERVER - Navigation cards
│   │   ├── 📄 DashboardSkeleton.tsx   # 🟢 SERVER - Loading skeleton
│   │   ├── 📄 TasksPerClientChart.tsx # 🔵 CLIENT - PieChart (Recharts)
│   │   └── 📄 WorkloadChart.tsx       # 🔵 CLIENT - BarChart (Recharts)
│   │
│   ├── 📂 skeletons/
│   │   └── 📄 TableSkeleton.tsx      # 🟢 SERVER - Table loading skeleton
│   │
│   ├── 📂 ui/                         # ShadCN UI Components (all 🔵 CLIENT)
│   │   ├── 📄 button.tsx
│   │   ├── 📄 card.tsx
│   │   ├── 📄 dialog.tsx
│   │   ├── 📄 input.tsx
│   │   ├── 📄 label.tsx
│   │   ├── 📄 select.tsx
│   │   ├── 📄 table.tsx
│   │   ├── 📄 badge.tsx
│   │   ├── 📄 alert.tsx
│   │   ├── 📄 tabs.tsx
│   │   ├── 📄 skeleton.tsx
│   │   ├── 📄 checkbox.tsx
│   │   ├── 📄 textarea.tsx
│   │   ├── 📄 dropdown-menu.tsx
│   │   ├── 📄 sheet.tsx
│   │   └── 📄 tooltip.tsx
│   │
│   ├── 📄 Sidebar.tsx                 # 🔵 CLIENT - Navigation sidebar
│   ├── 📄 CSVUploadDialog.tsx         # 🔵 CLIENT - CSV import dialog
│   ├── 📄 HowItWorksModal.tsx         # 🔵 CLIENT - Planner help modal
│   └── 📄 SimulatorHowItWorksModal.tsx # 🔵 CLIENT - Simulator help modal
│
├── 📂 types/                          # TypeScript Type Definitions
│   └── 📄 database.ts                 # Database schema types
│       ├── Employee, EmployeeInsert, EmployeeUpdate
│       ├── Task, TaskInsert, TaskUpdate
│       └── Leave, LeaveInsert, LeaveUpdate
│
└── 📂 docs/                           # Documentation
    ├── 📄 ARCHITECTURE_AUDIT_REPORT.md
    ├── 📄 DEAD_CODE_AUDIT.md
    ├── 📄 APPLICATION_SCAFFOLDING.md (this file)
    ├── 📄 dashboard-refactor-analysis.md
    ├── 📄 employees-refactor-summary.md
    ├── 📄 tasks-refactor-summary.md
    ├── 📄 leaves-refactor-summary.md
    ├── 📄 planner-refactor-summary.md
    └── 📄 simulator-refactor-summary.md
```

---

## 🏗️ Architecture Overview

### Server Components (🟢 SERVER)
**Location**: `app/**/page.tsx`, `components/dashboard/*.tsx` (some)

**Characteristics**:
- No `"use client"` directive
- Can be `async` functions
- Can directly `await` database queries
- Cannot use React hooks (`useState`, `useEffect`, etc.)
- Cannot use browser APIs
- Render on server, HTML sent to browser

**Files**:
- All `app/**/page.tsx` files
- `app/layout.tsx`
- `components/dashboard/DashboardStats.tsx`
- `components/dashboard/DashboardCards.tsx`
- `components/dashboard/DashboardSkeleton.tsx`
- `components/skeletons/TableSkeleton.tsx`

---

### Client Components (🔵 CLIENT)
**Location**: `app/**/*Client.tsx`, `components/ui/*.tsx`, `components/*.tsx`

**Characteristics**:
- Must have `"use client"` directive
- Can use React hooks (`useState`, `useEffect`, `useTransition`, etc.)
- Can use browser APIs
- Can handle user interactions (clicks, forms, etc.)
- Cannot directly query database
- Must call Server Actions for mutations
- Receive data as props from Server Components

**Files**:
- `app/employees/EmployeesClient.tsx`
- `app/tasks/TasksClient.tsx`
- `app/leaves/LeavesClient.tsx`
- `app/planner/PlannerClient.tsx`
- `app/planner/simulator/SimulatorClient.tsx`
- `app/planner/versions/VersionsClient.tsx`
- All `components/ui/*.tsx` (ShadCN components)
- `components/Sidebar.tsx`
- `components/CSVUploadDialog.tsx`
- `components/HowItWorksModal.tsx`
- `components/SimulatorHowItWorksModal.tsx`
- `components/dashboard/DashboardCharts.tsx`
- `components/dashboard/TasksPerClientChart.tsx`
- `components/dashboard/WorkloadChart.tsx`

---

### Server Actions (🟢 SERVER)
**Location**: `app/**/actions.ts`

**Characteristics**:
- Must have `"use server"` directive
- Execute on server only
- Can use server Supabase client
- Called from Client Components via function calls
- Can call `revalidatePath()` to refresh data
- Return typed results

**Files**:
- `app/employees/actions.ts`
- `app/tasks/actions.ts`
- `app/leaves/actions.ts`
- `app/planner/actions.ts`
- `app/planner/simulator/actions.ts`

---

### Server Utilities (🟢 SERVER)
**Location**: `lib/**/server.ts`, `lib/**/*-server.ts`

**Characteristics**:
- No directives needed (server-only by location)
- Use `createServerSupabaseClient()` for database access
- Called from Server Components or Server Actions
- Perform data fetching and aggregation
- Return typed data structures

**Files**:
- `lib/supabase/server.ts`
- `lib/analytics/dashboard.ts`
- `lib/employees/server.ts`
- `lib/tasks/server.ts`
- `lib/leaves/server.ts`
- `lib/planner/server.ts`
- `lib/planner/simulator-server.ts`
- `lib/planner/versions-server.ts`

---

### API Routes (🟢 SERVER)
**Location**: `app/api/**/route.ts`

**Characteristics**:
- Server-side only (Route Handlers)
- Handle HTTP requests (GET, POST, etc.)
- Can use server Supabase client
- Return JSON responses
- Used for complex operations or when API endpoint is needed

**Files**:
- `app/api/generate-plan/route.ts` (POST) - Plan generation

---

## 🌐 Browser vs Server Execution

### Visual Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Client Components (🔵 CLIENT)                           │  │
│  │  - EmployeesClient.tsx                                   │  │
│  │  - TasksClient.tsx                                       │  │
│  │  - PlannerClient.tsx                                     │  │
│  │  - SimulatorClient.tsx                                   │  │
│  │  - All components/ui/*.tsx                               │  │
│  │                                                           │  │
│  │  ✅ Can Use:                                              │  │
│  │     - useState, useEffect, useTransition                 │  │
│  │     - Browser APIs (localStorage, etc.)                   │  │
│  │     - Event handlers (onClick, onChange)                 │  │
│  │     - Recharts (requires DOM)                            │  │
│  │                                                           │  │
│  │  ❌ Cannot Use:                                           │  │
│  │     - Direct Supabase queries                            │  │
│  │     - Server-only APIs                                   │  │
│  │     - File system access                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Actions (Called from Client)                     │  │
│  │  - addEmployee() → app/employees/actions.ts              │  │
│  │  - updateTask() → app/tasks/actions.ts                   │  │
│  │  - markPlanCompleted() → app/planner/actions.ts        │  │
│  │                                                           │  │
│  │  📡 Network Request → Server                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/Network
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER (Node.js)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Components (🟢 SERVER)                          │  │
│  │  - app/**/page.tsx                                       │  │
│  │  - app/layout.tsx                                        │  │
│  │  - components/dashboard/DashboardStats.tsx              │  │
│  │                                                           │  │
│  │  ✅ Can Use:                                              │  │
│  │     - async/await                                        │  │
│  │     - Direct database queries                           │  │
│  │     - Server utilities                                   │  │
│  │     - Environment variables                              │  │
│  │                                                           │  │
│  │  ❌ Cannot Use:                                           │  │
│  │     - React hooks (useState, useEffect)                 │  │
│  │     - Browser APIs                                       │  │
│  │     - "use client" directive                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Actions (🟢 SERVER)                              │  │
│  │  - app/**/actions.ts                                     │  │
│  │  - Execute when called from client                       │  │
│  │  - Use server Supabase client                            │  │
│  │  - Call revalidatePath()                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Server Utilities (🟢 SERVER)                            │  │
│  │  - lib/**/server.ts                                      │  │
│  │  - lib/analytics/dashboard.ts                            │  │
│  │  - lib/planningEngine.ts                                 │  │
│  │  - Use createServerSupabaseClient()                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (🟢 SERVER)                                  │  │
│  │  - app/api/**/route.ts                                   │  │
│  │  - Handle HTTP requests                                 │  │
│  │  - Return JSON responses                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database (Supabase)                                     │  │
│  │  - All queries use server client                         │  │
│  │  - Never accessed from browser                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Patterns

### Pattern 1: Initial Page Load (Read-Only)

```
Browser Request
    ↓
Server Component (page.tsx)
    ↓
Server Utility (lib/**/server.ts)
    ↓
Supabase Query (server client)
    ↓
Data Returned
    ↓
Server Component Renders HTML
    ↓
HTML + Client Component JS Sent to Browser
    ↓
Client Component Hydrates with Props
```

**Example**: `/employees` page load
1. Browser requests `/employees`
2. `app/employees/page.tsx` (Server Component) calls `fetchEmployees()`
3. `lib/employees/server.ts` queries Supabase
4. Data passed to `EmployeesClient.tsx` as props
5. HTML rendered on server, sent to browser
6. Client component hydrates with data

---

### Pattern 2: User Mutation (Create/Update/Delete)

```
User Action (Click, Submit)
    ↓
Client Component Event Handler
    ↓
Server Action Call (app/**/actions.ts)
    ↓
Server Action Executes (server-side)
    ↓
Supabase Mutation (server client)
    ↓
revalidatePath() Called
    ↓
Server Action Returns Result
    ↓
Client Component Receives Result
    ↓
router.refresh() Called
    ↓
Server Component Re-fetches Data
    ↓
Updated Data Sent to Client
```

**Example**: Adding an employee
1. User fills form in `EmployeesClient.tsx`
2. Clicks "Add Employee"
3. Calls `addEmployee()` Server Action
4. Server Action validates and inserts into Supabase
5. Calls `revalidatePath("/employees")`
6. Returns `{ success: true }`
7. Client calls `router.refresh()`
8. Server Component re-fetches data
9. Updated employee list rendered

---

### Pattern 3: Complex Operation (Plan Generation)

```
User Action (Click "Generate Plan")
    ↓
Client Component (PlannerClient.tsx)
    ↓
Fetch to /api/generate-plan
    ↓
API Route Handler (app/api/generate-plan/route.ts)
    ↓
Calls generatePlan(supabase) from planningEngine
    ↓
Planning Algorithm Executes (server-side)
    ↓
Calls savePlanToDB(supabase, plans)
    ↓
Database Updated with Version Tracking
    ↓
API Returns { success: true, plan: [...] }
    ↓
Client Receives Response
    ↓
router.refresh() Called
    ↓
Planner Page Re-fetches Updated Plans
```

---

## 🔐 Security Boundaries

### Server-Side (Secure)
- ✅ All Supabase queries
- ✅ All database mutations
- ✅ All data aggregation
- ✅ All business logic
- ✅ Environment variables (not exposed)

**Files**:
- All `lib/**/server.ts` files
- All `app/**/actions.ts` files
- All `app/api/**/route.ts` files
- All `app/**/page.tsx` files

### Client-Side (Public)
- ⚠️ UI components only
- ⚠️ User interactions
- ⚠️ Form validation (UX only)
- ⚠️ Local state management
- ❌ NO database access
- ❌ NO Supabase keys
- ❌ NO business logic

**Files**:
- All `app/**/*Client.tsx` files
- All `components/ui/*.tsx` files
- All `components/*.tsx` files (except skeletons)

---

## 📊 Component Hierarchy

### Dashboard Page (`/`)
```
app/page.tsx (SERVER)
├── DashboardStats (SERVER) - Stats cards
├── DashboardCharts (CLIENT)
│   ├── TasksPerClientChart (CLIENT) - PieChart
│   └── WorkloadChart (CLIENT) - BarChart
└── DashboardCards (SERVER) - Navigation cards
```

### Employees Page (`/employees`)
```
app/employees/page.tsx (SERVER)
└── EmployeesClient (CLIENT)
    ├── Search & Filters
    ├── Add/Edit Dialogs
    ├── CSV Upload Dialog
    └── Employee Table
```

### Tasks Page (`/tasks`)
```
app/tasks/page.tsx (SERVER)
└── TasksClient (CLIENT)
    ├── Statistics Cards
    ├── Search & Filters
    ├── Add/Edit Dialogs
    ├── CSV Upload Dialog
    └── Task Table
```

### Leaves Page (`/leaves`)
```
app/leaves/page.tsx (SERVER)
└── LeavesClient (CLIENT)
    ├── Add Leave Dialog
    ├── Delete Confirmation
    └── Leaves Table
```

### Planner Page (`/planner`)
```
app/planner/page.tsx (SERVER)
└── PlannerClient (CLIENT)
    ├── Tabs (Date/Employee/Task views)
    ├── Filters (Overdue toggle)
    ├── Grouping Logic (by client, by sprint)
    ├── Status Badges
    ├── Plan Generation Button
    └── Plans Table
```

### Simulator Page (`/planner/simulator`)
```
app/planner/simulator/page.tsx (SERVER)
└── SimulatorClient (CLIENT)
    ├── Delay Tasks Controls
    ├── Block Employees Controls
    ├── Run Simulation Button
    ├── Apply Changes Button
    └── Simulation Results Table
```

### Versions Page (`/planner/versions`)
```
app/planner/versions/page.tsx (SERVER)
└── VersionsClient (CLIENT)
    ├── Group by Generation Toggle
    └── Versions Table (with grouping)
```

---

## 🔌 Integration Points

### Server → Client Data Flow
1. **Server Component** fetches data via server utility
2. Data passed as **props** to Client Component
3. Client Component receives data in initial render
4. Client Component uses `useEffect` to sync props with local state

### Client → Server Mutation Flow
1. **Client Component** calls Server Action function
2. Server Action executes on server
3. Server Action performs database operation
4. Server Action calls `revalidatePath()`
5. Server Action returns result
6. Client Component calls `router.refresh()`
7. Server Component re-fetches data
8. Updated data flows back to Client Component

### API Route Usage
- `/api/generate-plan` - Called from `PlannerClient.tsx` via `fetch()`
- Used for complex plan generation that requires API endpoint
- Returns JSON response
- Client handles response and refreshes

---

## 📦 Key Dependencies

### Server-Side Only
- `@supabase/supabase-js` - Supabase client (server instance)
- `next/cache` - `revalidatePath()` for cache invalidation

### Client-Side Only
- `recharts` - Chart library (requires browser DOM)
- `sonner` - Toast notifications
- `papaparse` - CSV parsing (file uploads)
- `lucide-react` - Icons

### Shared
- `react` - React library
- `next` - Next.js framework
- `date-fns` - Date utilities (used in planningEngine)
- `@radix-ui/*` - UI primitives (via ShadCN)

---

## 🎯 Architecture Principles

1. **Server Components by Default** - Pages are Server Components unless they need interactivity
2. **Client Components for UI Only** - Client components handle interactions, not data fetching
3. **Server Actions for Mutations** - All database writes go through Server Actions
4. **Server Utilities for Reads** - All database reads happen in server utilities
5. **Props for Data Flow** - Server → Client via props, never client-side fetching
6. **Type Safety** - Shared types ensure consistency between server and client
7. **No Supabase in Browser** - Supabase client never imported in client components

---

## 🔍 File Count Summary

- **Total Pages**: 7 (all Server Components)
- **Total Client Components**: 6 main page clients + ~20 UI components
- **Total Server Actions**: 5 action files
- **Total Server Utilities**: 8 utility files
- **Total API Routes**: 1
- **Total Type Files**: 1
- **Total Component Files**: ~28

---

## ✅ Architecture Compliance

- ✅ **100%** of pages are Server Components
- ✅ **100%** of data fetching is server-side
- ✅ **100%** of mutations use Server Actions
- ✅ **0%** Supabase client usage in client components
- ✅ **0%** client-side data fetching for initial loads

**Status**: Production-ready hybrid architecture

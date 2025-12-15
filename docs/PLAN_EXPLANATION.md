# Smart Project Planner - How It Works

## 📋 Plan Generation

**Step 1: Gather Data**
The system collects all employees, tasks, and leave dates from your database.

**Step 2: Match & Assign**
For each task, it finds employees with matching skills (Developer/QA), selects the least-loaded employee for fairness, and skips weekends and leave days.

**Step 3: Calculate Schedule**
Tasks are allocated 8 hours per workday sequentially. The system calculates start and end dates, and checks if tasks will finish after their due date (marks as overdue).

**Step 4: Save Plan**
The new schedule replaces the old one and is saved to the database.

---

## 📊 Version History

**Purpose**
Version history tracks what changed between plan generations, showing delays, reassignments, and date shifts.

**How It Works**
Before saving new plans, the system compares them with existing plans. If a task's dates changed or it was reassigned to a different employee, a version record is created showing old dates, new dates, and the difference in days (delta).

**What Gets Tracked**
- ✅ Date changes (start/end dates moved)
- ✅ Employee reassignments (task moved to different person)
- ❌ New tasks (tracked on next generation if they change)
- ❌ Unchanged tasks (no version record)

**Generation Grouping**
All changes from a single "Generate Plan" click are grouped together with a timestamp, making it easy to see what changed in one regeneration.

---

## 🔄 Versioning Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAN GENERATION                          │
│                                                             │
│  Old Plans (Database)  ──compare──>  New Plans (Calculated) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │   For Each Task in New Plans:         │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌──────────────────────┐
│ Same Task +        │              │ Task Reassigned      │
│ Same Employee      │              │ (Different Employee) │
└───────────────────┘              └──────────────────────┘
        │                                       │
        ▼                                       ▼
┌───────────────────┐              ┌──────────────────────┐
│ Dates Changed?     │              │ Always Track          │
│ (start/end)        │              │ (Employee Change)     │
└───────────────────┘              └──────────────────────┘
        │                                       │
        ▼                                       ▼
    ┌───────┐                              ┌───────┐
    │  YES  │                              │  YES  │
    └───┬───┘                              └───┬───┘
        │                                       │
        └───────────┬───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Create Version Record │
        │  • Old dates           │
        │  • New dates           │
        │  • Delta days          │
        │  • Generation ID        │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Save to Database     │
        │  (plan_versions table) │
        └───────────────────────┘
```

---

## 📝 Quick Reference

**Version Record Created When:**
- ✅ Task dates change (same employee)
- ✅ Task reassigned (different employee)
- ❌ Task unchanged (no record)
- ❌ New task first time (no record until next generation)

**Delta Days Meaning:**
- `+5 days` = Task delayed by 5 days (red badge)
- `-3 days` = Task finished 3 days earlier (green badge)
- `0 days` = No change in end date (gray badge)


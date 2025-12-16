# Planner Journey Logging

## Overview

Strategic logging has been added to the Planner module, specifically for the "Mark Completed" action. The logging tracks both frontend (FE) and backend (BE) operations with completion behavior analysis.

## Log Prefixes

- `[PLANNER:FE]` - Frontend/Client Component logs
- `[PLANNER:ACTION]` - Server Actions (mutations)

## Completion Logic

The `markPlanCompleted()` action now includes intelligent completion tracking:

### Completion Type Determination

- **On Time**: When `endDate <= dueDate`
  - Status: `"completed"`
  - `completion_type`: `"on_time"`

- **Late**: When `endDate > dueDate`
  - Status: `"completed"`
  - `completion_type`: `"late"`

### Date Comparison

- `endDate`: Current date when marking completed (YYYY-MM-DD format)
- `dueDate`: Task due date from the tasks table
- Comparison is done at midnight (00:00:00) for accurate date-only comparison

## Backend Logs

### Server Action (`app/planner/actions.ts`)

#### `markPlanCompleted()`

**Action Called**
```
[PLANNER:ACTION] markPlanCompleted called { planId }
```

**Validation**
```
[PLANNER:ACTION] markPlanCompleted - Validation failed: missing planId
```

**Fetching Plan**
```
[PLANNER:ACTION] markPlanCompleted - Fetching plan with task details
[PLANNER:ACTION] markPlanCompleted - Error fetching plan: [error]
```

**Completion Analysis**
```
[PLANNER:ACTION] markPlanCompleted - Completion analysis {
  planId,
  dueDate,
  endDate,
  completionType
}
```

**Updating Plan**
```
[PLANNER:ACTION] markPlanCompleted - Updating plan with completion status
[PLANNER:ACTION] markPlanCompleted - Supabase error: [error]
```

**Success**
```
[PLANNER:ACTION] markPlanCompleted - Success, revalidated path {
  planId,
  completionType
}
```

**Unexpected Errors**
```
[PLANNER:ACTION] markPlanCompleted - Unexpected error: [error]
```

## Frontend Logs

### Client Component (`app/planner/PlannerClient.tsx`)

#### `markCompleted()`

**User Action**
```
[PLANNER:FE] markCompleted - Mark completed clicked {
  planId,
  dueDate,
  endDate,
  intent: "mark_completed_clicked"
}
```

**Server Action Response**
```
[PLANNER:FE] markCompleted - Server action failed { error }
[PLANNER:FE] markCompleted - Success
```

**Unexpected Errors**
```
[PLANNER:FE] markCompleted - Unexpected error: [error]
```

## Database Schema

### New Field: `completion_type`

- **Type**: `VARCHAR(10)`
- **Values**: `'on_time'` | `'late'` | `NULL`
- **Constraint**: CHECK constraint ensures only valid values
- **Index**: Created for faster queries

### Migration

Run the migration file: `migration_add_completion_type.sql`

```sql
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS completion_type VARCHAR(10) 
CHECK (completion_type IN ('on_time', 'late'));

CREATE INDEX IF NOT EXISTS idx_plans_completion_type ON plans(completion_type);
```

## How to Use Logs

### Filtering Logs in Browser Console

1. **View all planner logs**:
   ```
   Filter: [PLANNER
   ```

2. **View only frontend logs**:
   ```
   Filter: [PLANNER:FE]
   ```

3. **View only server actions**:
   ```
   Filter: [PLANNER:ACTION]
   ```

4. **View completion analysis**:
   ```
   Filter: Completion analysis
   ```

5. **View errors only**:
   ```
   Filter: error
   ```

### Tracking a User Journey

Example: Marking a plan as completed

1. `[PLANNER:FE] markCompleted - Mark completed clicked` - User clicks button
   - Logs: `planId`, `dueDate`, `endDate`, `intent: "mark_completed_clicked"`

2. `[PLANNER:ACTION] markPlanCompleted called` - Server action received
   - Logs: `planId`

3. `[PLANNER:ACTION] markPlanCompleted - Fetching plan with task details` - Fetching plan data

4. `[PLANNER:ACTION] markPlanCompleted - Completion analysis` - Analyzing completion
   - Logs: `planId`, `dueDate`, `endDate`, `completionType`

5. `[PLANNER:ACTION] markPlanCompleted - Updating plan with completion status` - Database update

6. `[PLANNER:ACTION] markPlanCompleted - Success, revalidated path` - Update successful
   - Logs: `planId`, `completionType`

7. `[PLANNER:FE] markCompleted - Success` - Frontend receives success

### Debugging Issues

**Issue: Completion type not being set correctly**
- Check: `[PLANNER:ACTION] markPlanCompleted - Completion analysis` log
- Verify `dueDate` and `endDate` values
- Check if `completionType` matches expected logic

**Issue: Plan not found**
- Check: `[PLANNER:ACTION] markPlanCompleted - Error fetching plan`
- Verify `planId` is correct
- Check if plan exists in database

**Issue: Database update failing**
- Check: `[PLANNER:ACTION] markPlanCompleted - Supabase error`
- Verify `completion_type` column exists (run migration)
- Check database constraints

**Issue: Frontend not receiving success**
- Check: `[PLANNER:FE] markCompleted - Server action failed`
- Verify server action returned success
- Check network tab for errors

## Log Levels

- **Info** (`console.log`): Normal operations, user actions, completion analysis
- **Error** (`console.error`): Failures, validation errors, unexpected errors

All logs include relevant context (planId, dates, completion type) to aid debugging without being overly verbose.

## Acceptance Criteria Verification

✅ **Client-side logging**: Logs when "Mark Completed" button is clicked with planId, dueDate, endDate, intent

✅ **Server-side logging**: Logs planId, dueDate, endDate, computed completion_type

✅ **On-time completion**: Records with `endDate <= dueDate` are marked as `completion_type: "on_time"`

✅ **Late completion**: Records with `endDate > dueDate` are marked as `completion_type: "late"`

✅ **Database persistence**: `completion_type` field is persisted in the database

✅ **No UI changes**: Button label and behavior remain unchanged

✅ **No architecture changes**: Only updated actions.ts and PlannerClient.tsx

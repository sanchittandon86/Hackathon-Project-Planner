# Tasks Journey Logging

## Overview

Strategic logging has been added throughout the `/tasks` journey to track both frontend (FE) and backend (BE) operations. All logs use consistent prefixes for easy filtering and monitoring.

## Log Prefixes

- `[TASKS:BE]` - Backend/Server Component logs
- `[TASKS:FETCH]` - Data fetching operations
- `[TASKS:ACTION]` - Server Actions (mutations)
- `[TASKS:FE]` - Frontend/Client Component logs

## Backend Logs

### Server Component (`app/tasks/page.tsx`)

- **Page Load**: Logs when page loads and how many tasks were fetched
  ```
  [TASKS:BE] Page load - Fetching tasks data
  [TASKS:BE] Page load - Fetched X tasks
  ```

### Server Utilities (`lib/tasks/server.ts`)

- **Fetch Start**: Logs when fetch operation starts
- **Fetch Success**: Logs count of tasks fetched
- **Fetch Error**: Logs Supabase errors
  ```
  [TASKS:FETCH] Starting fetchTasks()
  [TASKS:FETCH] Successfully fetched X tasks
  [TASKS:FETCH] Error fetching tasks: [error details]
  ```

### Server Actions (`app/tasks/actions.ts`)

#### `addTask()`
- Action called with task data (client, title, effort_hours, designation_required, due_date)
- Validation failures (empty client, empty title, invalid effort hours, past due date)
- Supabase errors
- Success with revalidation
  ```
  [TASKS:ACTION] addTask called { client, title, effort_hours, designation_required, due_date }
  [TASKS:ACTION] addTask - Validation failed: empty client name
  [TASKS:ACTION] addTask - Validation failed: empty title
  [TASKS:ACTION] addTask - Validation failed: invalid effort hours
  [TASKS:ACTION] addTask - Validation failed: due date in past
  [TASKS:ACTION] addTask - Supabase error: [error]
  [TASKS:ACTION] addTask - Success, revalidated path
  ```

#### `updateTask()`
- Action called with ID and task data
- Validation failures (same as addTask)
- Supabase errors
- Success with revalidation
  ```
  [TASKS:ACTION] updateTask called { id, client, title, effort_hours, designation_required, due_date }
  [TASKS:ACTION] updateTask - Validation failed: [reason]
  [TASKS:ACTION] updateTask - Supabase error: [error]
  [TASKS:ACTION] updateTask - Success, revalidated path
  ```

#### `deleteTask()`
- Action called with task ID
- Supabase errors
- Success with revalidation
  ```
  [TASKS:ACTION] deleteTask called { id }
  [TASKS:ACTION] deleteTask - Supabase error: [error]
  [TASKS:ACTION] deleteTask - Success, revalidated path
  ```

#### `bulkImportTasks()`
- Action called with count
- Validation failures
- Supabase errors
- Success with inserted count
  ```
  [TASKS:ACTION] bulkImportTasks called { count }
  [TASKS:ACTION] bulkImportTasks - Validation failed: empty array
  [TASKS:ACTION] bulkImportTasks - Supabase error: [error]
  [TASKS:ACTION] bulkImportTasks - Success, inserted X tasks, revalidated path
  ```

## Frontend Logs

### Client Component (`app/tasks/TasksClient.tsx`)

#### Component Lifecycle
- **Mount**: Logs when component mounts with initial task count
- **Data Refresh**: Logs when data is refreshed from server
  ```
  [TASKS:FE] Component mounted with X tasks
  [TASKS:FE] Data refreshed - received X tasks
  ```

#### User Interactions

**Add Task**
- Dialog open
- Validation failures (client, title, effort hours, due date)
- Server action call with data
- Success/failure responses
  ```
  [TASKS:FE] openAddDialog - Opening add task dialog
  [TASKS:FE] handleAddTask - Validation failed: empty client name
  [TASKS:FE] handleAddTask - Validation failed: empty title
  [TASKS:FE] handleAddTask - Validation failed: invalid effort hours
  [TASKS:FE] handleAddTask - Validation failed: due date in past
  [TASKS:FE] handleAddTask - Calling server action { client, title, effort_hours, designation_required, due_date }
  [TASKS:FE] handleAddTask - Success
  [TASKS:FE] handleAddTask - Server action failed { error }
  ```

**Update Task**
- Edit dialog open with task details
- Validation failures (same as addTask)
- Server action call with ID and data
- Success/failure responses
  ```
  [TASKS:FE] openEditDialog - Opening edit dialog { id, title, client }
  [TASKS:FE] handleUpdateTask - Validation failed: [reason]
  [TASKS:FE] handleUpdateTask - Calling server action { id, client, title, effort_hours, designation_required, due_date }
  [TASKS:FE] handleUpdateTask - Success
  [TASKS:FE] handleUpdateTask - Server action failed { error }
  ```

**Delete Task**
- Delete confirmation dialog open
- Server action call with ID
- Success/failure responses
  ```
  [TASKS:FE] openDeleteDialog - Opening delete confirmation { id }
  [TASKS:FE] handleDeleteTask - Calling server action { id }
  [TASKS:FE] handleDeleteTask - Success
  [TASKS:FE] handleDeleteTask - Server action failed { error }
  ```

**CSV Import**
- CSV processing start with row count
- Validation results (valid/invalid rows)
- Server action call
- Success/failure with inserted count
  ```
  [TASKS:FE] handleCSVImport - Processing CSV { rowCount }
  [TASKS:FE] handleCSVImport - No valid rows after validation { errors }
  [TASKS:FE] handleCSVImport - Calling server action { validCount, errorCount }
  [TASKS:FE] handleCSVImport - Success { inserted }
  [TASKS:FE] handleCSVImport - Server action failed { error }
  ```

**Search & Filters**
- Filter changes with current filter state and result counts
- Clear filters action
  ```
  [TASKS:FE] Filter changed { searchQuery, designationFilter, filteredCount, totalCount }
  [TASKS:FE] clearFilters - Clearing all filters
  ```

**Data Refresh**
- Manual refresh trigger
  ```
  [TASKS:FE] Refreshing tasks data
  ```

## How to Use Logs

### Filtering Logs in Browser Console

1. **View all task logs**:
   ```
   Filter: [TASKS
   ```

2. **View only frontend logs**:
   ```
   Filter: [TASKS:FE]
   ```

3. **View only backend logs**:
   ```
   Filter: [TASKS:BE] OR [TASKS:FETCH] OR [TASKS:ACTION]
   ```

4. **View only server actions**:
   ```
   Filter: [TASKS:ACTION]
   ```

5. **View errors only**:
   ```
   Filter: error
   ```

### Tracking a User Journey

Example: Adding a task
1. `[TASKS:FE] openAddDialog` - User clicks "Add Task"
2. `[TASKS:FE] handleAddTask - Calling server action` - Form submitted
3. `[TASKS:ACTION] addTask called` - Server action received
4. `[TASKS:ACTION] addTask - Success` - Database insert successful
5. `[TASKS:FE] handleAddTask - Success` - Frontend receives success
6. `[TASKS:FE] Refreshing tasks data` - Data refresh triggered
7. `[TASKS:BE] Page load - Fetching tasks data` - Server refetch
8. `[TASKS:FETCH] Successfully fetched X tasks` - Data fetched
9. `[TASKS:FE] Data refreshed - received X tasks` - UI updated

### Debugging Issues

**Issue: Task not appearing after add**
- Check: `[TASKS:ACTION] addTask - Success` (backend success)
- Check: `[TASKS:FE] handleAddTask - Success` (frontend received)
- Check: `[TASKS:FE] Refreshing tasks data` (refresh triggered)
- Check: `[TASKS:FETCH] Successfully fetched` (data refetched)

**Issue: Validation failing**
- Check validation logs: `[TASKS:FE] handleAddTask - Validation failed` or `[TASKS:ACTION] addTask - Validation failed`
- Verify which field is causing the issue (client, title, effort_hours, due_date)

**Issue: Delete failing**
- Check: `[TASKS:ACTION] deleteTask - Supabase error` for database errors
- Check: `[TASKS:FE] handleDeleteTask - Server action failed` for frontend error handling

**Issue: Filters not working**
- Check: `[TASKS:FE] Filter changed` logs show correct filter values
- Verify `filteredCount` vs `totalCount` makes sense

**Issue: CSV import issues**
- Check: `[TASKS:FE] handleCSVImport - Processing CSV` for row count
- Check: `[TASKS:FE] handleCSVImport - No valid rows after validation` for validation errors
- Check: `[TASKS:ACTION] bulkImportTasks` for server-side errors

## Log Levels

- **Info** (`console.log`): Normal operations, user actions, state changes
- **Error** (`console.error`): Failures, validation errors, unexpected errors

All logs include relevant context (IDs, counts, filter values, task data) to aid debugging without being overly verbose.

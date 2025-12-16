# Leaves Journey Logging

## Overview

Strategic logging has been added throughout the `/leaves` journey to track both frontend (FE) and backend (BE) operations. All logs use consistent prefixes for easy filtering and monitoring.

## Log Prefixes

- `[LEAVES:BE]` - Backend/Server Component logs
- `[LEAVES:FETCH]` - Data fetching operations
- `[LEAVES:ACTION]` - Server Actions (mutations)
- `[LEAVES:FE]` - Frontend/Client Component logs

## Backend Logs

### Server Component (`app/leaves/page.tsx`)

- **Page Load**: Logs when page loads and how many employees and leaves were fetched
  ```
  [LEAVES:BE] Page load - Fetching employees and leaves data
  [LEAVES:BE] Page load - Fetched X employees and Y leaves
  ```

### Server Utilities (`lib/leaves/server.ts`)

#### `fetchEmployees()`
- Fetch start
- Fetch success with count
- Fetch error
  ```
  [LEAVES:FETCH] Starting fetchEmployees()
  [LEAVES:FETCH] Successfully fetched X employees
  [LEAVES:FETCH] Error fetching employees: [error details]
  ```

#### `fetchLeaves()`
- Fetch start
- Fetch success with count
- Fetch error
  ```
  [LEAVES:FETCH] Starting fetchLeaves()
  [LEAVES:FETCH] Successfully fetched X leaves
  [LEAVES:FETCH] Error fetching leaves: [error details]
  ```

### Server Actions (`app/leaves/actions.ts`)

#### `addLeave()`
- Action called with employee ID and leave date
- Validation failures (empty employee ID, empty date, invalid date format)
- Duplicate check
- Supabase errors
- Success with revalidation
  ```
  [LEAVES:ACTION] addLeave called { employeeId, leaveDate }
  [LEAVES:ACTION] addLeave - Validation failed: empty employee ID
  [LEAVES:ACTION] addLeave - Validation failed: empty leave date
  [LEAVES:ACTION] addLeave - Validation failed: invalid date format
  [LEAVES:ACTION] addLeave - Checking for duplicate leave
  [LEAVES:ACTION] addLeave - Validation failed: duplicate leave found
  [LEAVES:ACTION] addLeave - Error checking duplicate: [error]
  [LEAVES:ACTION] addLeave - Inserting leave
  [LEAVES:ACTION] addLeave - Supabase error: [error]
  [LEAVES:ACTION] addLeave - Success, revalidated path
  ```

#### `deleteLeave()`
- Action called with leave ID
- Validation failures
- Supabase errors
- Success with revalidation
  ```
  [LEAVES:ACTION] deleteLeave called { id }
  [LEAVES:ACTION] deleteLeave - Validation failed: invalid ID
  [LEAVES:ACTION] deleteLeave - Supabase error: [error]
  [LEAVES:ACTION] deleteLeave - Success, revalidated path
  ```

## Frontend Logs

### Client Component (`app/leaves/LeavesClient.tsx`)

#### Component Lifecycle
- **Mount**: Logs when component mounts with initial employee and leave counts
- **Data Refresh**: Logs when data is refreshed from server
  ```
  [LEAVES:FE] Component mounted with X employees and Y leaves
  [LEAVES:FE] Data refreshed - received X employees and Y leaves
  ```

#### User Interactions

**Add Leave**
- Date selection change
- Validation failures (missing employee/date, invalid employee ID, employee not found, duplicate)
- Server action call with employee and date info
- Success/failure responses
  ```
  [LEAVES:FE] Leave date changed { selectedDate }
  [LEAVES:FE] handleAddLeave - Validation failed: missing employee or date
  [LEAVES:FE] handleAddLeave - Validation failed: invalid employee ID
  [LEAVES:FE] handleAddLeave - Employee not found in list: { employeeId, availableIds }
  [LEAVES:FE] handleAddLeave - Validation failed: duplicate leave detected
  [LEAVES:FE] handleAddLeave - Calling server action { employeeId, employeeName, leaveDate }
  [LEAVES:FE] handleAddLeave - Success
  [LEAVES:FE] handleAddLeave - Server action failed { error }
  ```

**Delete Leave**
- Delete dialog open with leave details
- Server action call with ID
- Success/failure responses
  ```
  [LEAVES:FE] handleDeleteClick - Opening delete confirmation { id, employeeName, leaveDate }
  [LEAVES:FE] handleDeleteConfirm - Calling server action { id }
  [LEAVES:FE] handleDeleteConfirm - Success
  [LEAVES:FE] handleDeleteConfirm - Server action failed { error }
  ```

**Data Refresh**
- Manual refresh trigger
  ```
  [LEAVES:FE] Refreshing leaves data
  ```

## Date Picker Configuration

The leave date picker has been configured to:
- **Disable past dates**: Only allows selection of today and future dates
- **Min date**: Set to current date using `min={new Date().toISOString().split('T')[0]}`
- **Logs date changes**: Tracks when users select different dates

## How to Use Logs

### Filtering Logs in Browser Console

1. **View all leave logs**:
   ```
   Filter: [LEAVES
   ```

2. **View only frontend logs**:
   ```
   Filter: [LEAVES:FE]
   ```

3. **View only backend logs**:
   ```
   Filter: [LEAVES:BE] OR [LEAVES:FETCH] OR [LEAVES:ACTION]
   ```

4. **View only server actions**:
   ```
   Filter: [LEAVES:ACTION]
   ```

5. **View errors only**:
   ```
   Filter: error
   ```

### Tracking a User Journey

Example: Adding a leave
1. `[LEAVES:FE] Leave date changed` - User selects a date
2. `[LEAVES:FE] handleAddLeave - Calling server action` - Form submitted
3. `[LEAVES:ACTION] addLeave called` - Server action received
4. `[LEAVES:ACTION] addLeave - Checking for duplicate leave` - Duplicate check
5. `[LEAVES:ACTION] addLeave - Inserting leave` - Database insert
6. `[LEAVES:ACTION] addLeave - Success` - Database insert successful
7. `[LEAVES:FE] handleAddLeave - Success` - Frontend receives success
8. `[LEAVES:FE] Refreshing leaves data` - Data refresh triggered
9. `[LEAVES:BE] Page load - Fetching employees and leaves data` - Server refetch
10. `[LEAVES:FETCH] Successfully fetched X leaves` - Data fetched
11. `[LEAVES:FE] Data refreshed - received X leaves` - UI updated

### Debugging Issues

**Issue: Leave not appearing after add**
- Check: `[LEAVES:ACTION] addLeave - Success` (backend success)
- Check: `[LEAVES:FE] handleAddLeave - Success` (frontend received)
- Check: `[LEAVES:FE] Refreshing leaves data` (refresh triggered)
- Check: `[LEAVES:FETCH] Successfully fetched` (data refetched)

**Issue: Duplicate leave error**
- Check: `[LEAVES:ACTION] addLeave - Validation failed: duplicate leave found` (server-side duplicate)
- Check: `[LEAVES:FE] handleAddLeave - Validation failed: duplicate leave detected` (client-side duplicate)
- Verify employee ID and date match existing leave

**Issue: Date picker allowing past dates**
- Verify `min` attribute is set on date input
- Check browser console for date change logs
- Ensure date format is correct (YYYY-MM-DD)

**Issue: Employee not found**
- Check: `[LEAVES:FE] handleAddLeave - Employee not found in list` (shows available IDs)
- Verify employee exists in employees list
- Check if employee was deleted after page load

**Issue: Delete failing**
- Check: `[LEAVES:ACTION] deleteLeave - Supabase error` for database errors
- Check: `[LEAVES:FE] handleDeleteConfirm - Server action failed` for frontend error handling

## Log Levels

- **Info** (`console.log`): Normal operations, user actions, state changes
- **Error** (`console.error`): Failures, validation errors, unexpected errors

All logs include relevant context (IDs, dates, employee names, counts) to aid debugging without being overly verbose.

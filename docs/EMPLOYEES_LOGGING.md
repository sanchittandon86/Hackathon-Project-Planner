# Employees Journey Logging

## Overview

Strategic logging has been added throughout the `/employees` journey to track both frontend (FE) and backend (BE) operations. All logs use consistent prefixes for easy filtering and monitoring.

## Log Prefixes

- `[EMPLOYEES:BE]` - Backend/Server Component logs
- `[EMPLOYEES:FETCH]` - Data fetching operations
- `[EMPLOYEES:ACTION]` - Server Actions (mutations)
- `[EMPLOYEES:FE]` - Frontend/Client Component logs

## Backend Logs

### Server Component (`app/employees/page.tsx`)

- **Page Load**: Logs when page loads and how many employees were fetched
  ```
  [EMPLOYEES:BE] Page load - Fetching employees data
  [EMPLOYEES:BE] Page load - Fetched X employees
  ```

### Server Utilities (`lib/employees/server.ts`)

- **Fetch Start**: Logs when fetch operation starts
- **Fetch Success**: Logs count of employees fetched
- **Fetch Error**: Logs Supabase errors
  ```
  [EMPLOYEES:FETCH] Starting fetchEmployees()
  [EMPLOYEES:FETCH] Successfully fetched X employees
  [EMPLOYEES:FETCH] Error fetching employees: [error details]
  ```

### Server Actions (`app/employees/actions.ts`)

#### `addEmployee()`
- Action called with employee data
- Validation failures
- Supabase errors
- Success with revalidation
  ```
  [EMPLOYEES:ACTION] addEmployee called { name, designation, active }
  [EMPLOYEES:ACTION] addEmployee - Validation failed: empty name
  [EMPLOYEES:ACTION] addEmployee - Supabase error: [error]
  [EMPLOYEES:ACTION] addEmployee - Success, revalidated path
  ```

#### `updateEmployee()`
- Action called with ID and employee data
- Validation failures
- Supabase errors
- Success with revalidation
  ```
  [EMPLOYEES:ACTION] updateEmployee called { id, name, designation, active }
  [EMPLOYEES:ACTION] updateEmployee - Validation failed: empty name
  [EMPLOYEES:ACTION] updateEmployee - Supabase error: [error]
  [EMPLOYEES:ACTION] updateEmployee - Success, revalidated path
  ```

#### `deleteEmployee()`
- Action called with employee ID
- Cascade deletion steps (plans, leaves, employee)
- Errors at each step
- Success with revalidation
  ```
  [EMPLOYEES:ACTION] deleteEmployee called { id }
  [EMPLOYEES:ACTION] deleteEmployee - Deleting associated plans
  [EMPLOYEES:ACTION] deleteEmployee - Deleting associated leaves
  [EMPLOYEES:ACTION] deleteEmployee - Deleting employee record
  [EMPLOYEES:ACTION] deleteEmployee - Success, revalidated path
  ```

#### `bulkImportEmployees()`
- Action called with count
- Validation failures
- Supabase errors
- Success with inserted count
  ```
  [EMPLOYEES:ACTION] bulkImportEmployees called { count }
  [EMPLOYEES:ACTION] bulkImportEmployees - Validation failed: empty array
  [EMPLOYEES:ACTION] bulkImportEmployees - Supabase error: [error]
  [EMPLOYEES:ACTION] bulkImportEmployees - Success, inserted X employees, revalidated path
  ```

## Frontend Logs

### Client Component (`app/employees/EmployeesClient.tsx`)

#### Component Lifecycle
- **Mount**: Logs when component mounts with initial employee count
- **Data Refresh**: Logs when data is refreshed from server
  ```
  [EMPLOYEES:FE] Component mounted with X employees
  [EMPLOYEES:FE] Data refreshed - received X employees
  ```

#### User Interactions

**Add Employee**
- Dialog open
- Validation failures
- Server action call with data
- Success/failure responses
  ```
  [EMPLOYEES:FE] openAddDialog - Opening add employee dialog
  [EMPLOYEES:FE] handleAddEmployee - Validation failed: empty name
  [EMPLOYEES:FE] handleAddEmployee - Calling server action { name, designation, active }
  [EMPLOYEES:FE] handleAddEmployee - Success
  [EMPLOYEES:FE] handleAddEmployee - Server action failed { error }
  ```

**Update Employee**
- Edit dialog open with employee details
- Validation failures
- Server action call with ID and data
- Success/failure responses
  ```
  [EMPLOYEES:FE] openEditDialog - Opening edit dialog { id, name }
  [EMPLOYEES:FE] handleUpdateEmployee - Calling server action { id, name, designation, active }
  [EMPLOYEES:FE] handleUpdateEmployee - Success
  [EMPLOYEES:FE] handleUpdateEmployee - Server action failed { error }
  ```

**Delete Employee**
- Delete confirmation dialog open
- Server action call with ID
- Success/failure responses
  ```
  [EMPLOYEES:FE] openDeleteDialog - Opening delete confirmation { id }
  [EMPLOYEES:FE] handleDeleteEmployee - Calling server action { id }
  [EMPLOYEES:FE] handleDeleteEmployee - Success
  [EMPLOYEES:FE] handleDeleteEmployee - Server action failed { error }
  ```

**CSV Import**
- CSV processing start with row count
- Validation results (valid/invalid rows)
- Server action call
- Success/failure with inserted count
  ```
  [EMPLOYEES:FE] handleCSVImport - Processing CSV { rowCount }
  [EMPLOYEES:FE] handleCSVImport - No valid rows after validation { errors }
  [EMPLOYEES:FE] handleCSVImport - Calling server action { validCount, errorCount }
  [EMPLOYEES:FE] handleCSVImport - Success { inserted }
  [EMPLOYEES:FE] handleCSVImport - Server action failed { error }
  ```

**Search & Filters**
- Filter changes with current filter state and result counts
- Clear filters action
  ```
  [EMPLOYEES:FE] Filter changed { searchQuery, designationFilter, statusFilter, filteredCount, totalCount }
  [EMPLOYEES:FE] clearFilters - Clearing all filters
  ```

**Data Refresh**
- Manual refresh trigger
  ```
  [EMPLOYEES:FE] Refreshing employees data
  ```

## How to Use Logs

### Filtering Logs in Browser Console

1. **View all employee logs**:
   ```
   Filter: [EMPLOYEES
   ```

2. **View only frontend logs**:
   ```
   Filter: [EMPLOYEES:FE]
   ```

3. **View only backend logs**:
   ```
   Filter: [EMPLOYEES:BE] OR [EMPLOYEES:FETCH] OR [EMPLOYEES:ACTION]
   ```

4. **View only server actions**:
   ```
   Filter: [EMPLOYEES:ACTION]
   ```

5. **View errors only**:
   ```
   Filter: error
   ```

### Tracking a User Journey

Example: Adding an employee
1. `[EMPLOYEES:FE] openAddDialog` - User clicks "Add Employee"
2. `[EMPLOYEES:FE] handleAddEmployee - Calling server action` - Form submitted
3. `[EMPLOYEES:ACTION] addEmployee called` - Server action received
4. `[EMPLOYEES:ACTION] addEmployee - Success` - Database insert successful
5. `[EMPLOYEES:FE] handleAddEmployee - Success` - Frontend receives success
6. `[EMPLOYEES:FE] Refreshing employees data` - Data refresh triggered
7. `[EMPLOYEES:BE] Page load - Fetching employees data` - Server refetch
8. `[EMPLOYEES:FETCH] Successfully fetched X employees` - Data fetched
9. `[EMPLOYEES:FE] Data refreshed - received X employees` - UI updated

### Debugging Issues

**Issue: Employee not appearing after add**
- Check: `[EMPLOYEES:ACTION] addEmployee - Success` (backend success)
- Check: `[EMPLOYEES:FE] handleAddEmployee - Success` (frontend received)
- Check: `[EMPLOYEES:FE] Refreshing employees data` (refresh triggered)
- Check: `[EMPLOYEES:FETCH] Successfully fetched` (data refetched)

**Issue: Delete failing**
- Check: `[EMPLOYEES:ACTION] deleteEmployee - Deleting associated plans` (cascade step 1)
- Check: `[EMPLOYEES:ACTION] deleteEmployee - Deleting associated leaves` (cascade step 2)
- Check: `[EMPLOYEES:ACTION] deleteEmployee - Deleting employee record` (final step)
- Look for error logs at any step

**Issue: Filters not working**
- Check: `[EMPLOYEES:FE] Filter changed` logs show correct filter values
- Verify `filteredCount` vs `totalCount` makes sense

## Log Levels

- **Info** (`console.log`): Normal operations, user actions, state changes
- **Error** (`console.error`): Failures, validation errors, unexpected errors

All logs include relevant context (IDs, counts, filter values) to aid debugging without being overly verbose.

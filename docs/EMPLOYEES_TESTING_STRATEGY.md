# Employees Module Testing Strategy

## PHASE 1 - ANALYSIS

### Architecture Overview

The `/employees` page follows a **Hybrid Server + Client architecture**:

1. **Server Component** (`app/employees/page.tsx`)
   - Fetches initial data using `fetchEmployees()` from `lib/employees/server.ts`
   - Passes data as props to client component
   - Handles Suspense boundaries
   - **No client-side code shipped**

2. **Client Component** (`app/employees/EmployeesClient.tsx`)
   - Receives `initialEmployees` as props
   - Manages all UI state (search, filters, dialogs, form state)
   - Handles user interactions (clicks, form submissions)
   - Calls Server Actions for mutations
   - Uses `useTransition` for loading states
   - Uses `router.refresh()` to refresh data after mutations
   - **NO Supabase client usage**

3. **Server Actions** (`app/employees/actions.ts`)
   - `addEmployee()` - Creates new employee
   - `updateEmployee()` - Updates existing employee
   - `deleteEmployee()` - Deletes employee and cascades (plans, leaves)
   - `bulkImportEmployees()` - Bulk CSV import
   - All use `createServerSupabaseClient()` for DB operations
   - All call `revalidatePath("/employees")` after mutations

4. **Server Utilities** (`lib/employees/server.ts`)
   - `fetchEmployees()` - Fetches all employees from Supabase
   - Uses `createServerSupabaseClient()`
   - Returns empty array on error (graceful degradation)

### What Can Be Tested

#### ✅ Client Component Tests (`EmployeesClient.tsx`)
- **Rendering**: Table with initialEmployees, statistics cards, empty states
- **Interactions**: Search filtering, designation/status filters, dialog open/close
- **Form Handling**: Add/edit employee form submission, validation
- **Server Action Calls**: Verify correct actions called with correct params
- **Loading States**: `useTransition` pending state, disabled buttons during submission
- **Toast Notifications**: Success/error toasts triggered correctly
- **State Management**: Local state updates, filter clearing

**Mocks Required:**
- Server Actions (`jest.mock('app/employees/actions')`)
- `next/navigation` (`useRouter`, `router.refresh`)
- `sonner` toast library

**DO NOT Mock:**
- Supabase (not used in client)
- Data fetching (data comes from props)

#### ✅ Server Action Tests (`app/employees/actions.ts`)
- **addEmployee()**: Success, validation failure, Supabase errors
- **updateEmployee()**: Success, validation failure, Supabase errors
- **deleteEmployee()**: Success, cascade deletion (plans, leaves), Supabase errors
- **bulkImportEmployees()**: Success, empty array, Supabase errors

**Mocks Required:**
- `createServerSupabaseClient()` from `lib/supabase/server`
- Supabase client methods (`.from()`, `.insert()`, `.update()`, `.delete()`, `.select()`)
- `revalidatePath` from `next/cache`

**Assertions:**
- Correct Supabase table/column calls
- Correct return values (`ActionResult` format)
- `revalidatePath("/employees")` called after successful mutations

#### ✅ Server Utility Tests (`lib/employees/server.ts`)
- **fetchEmployees()**: Successful fetch, empty result, Supabase error handling

**Mocks Required:**
- `createServerSupabaseClient()` from `lib/supabase/server`
- Supabase `.from().select().order()` chain

### What Should NOT Be Tested

- ❌ Server Component (`page.tsx`) - Next.js internals, Suspense boundaries
- ❌ Next.js routing internals
- ❌ Supabase client creation (just mock it)
- ❌ Layout components
- ❌ UI component library internals (shadcn/ui)

### Testing Tools

1. **Jest** - Test runner and mocking framework
2. **React Testing Library** - Client component rendering and interactions
3. **@testing-library/user-event** - Simulate user interactions
4. **@testing-library/jest-dom** - DOM matchers

### Test File Structure

```
app/employees/
  ├── __tests__/
  │   ├── EmployeesClient.test.tsx      # Client component tests
  │   └── actions.test.ts                # Server action tests
lib/employees/
  └── __tests__/
      └── server.test.ts                 # Server utility tests
```

### Mock Strategy

#### Supabase Mock Structure
```typescript
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
};
```

#### Server Action Mock
```typescript
jest.mock('app/employees/actions', () => ({
  addEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  bulkImportEmployees: jest.fn(),
}));
```

#### Next.js Router Mock
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));
```

### Test Coverage Goals

- **Client Component**: 80%+ coverage of user interactions and state management
- **Server Actions**: 100% coverage of all code paths (success, validation, errors)
- **Server Utilities**: 100% coverage (success, empty, error cases)

---

## PHASE 2 - IMPLEMENTATION

See test files in respective `__tests__` directories.

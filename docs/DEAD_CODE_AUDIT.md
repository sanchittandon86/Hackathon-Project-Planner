# Dead Code Audit Report
**Date**: 2025-01-27  
**Scope**: Full codebase scan for unused code, functions, imports, and files

---

## Executive Summary

Found **2 instances** of dead code that can be safely removed:
1. Unused function in `lib/planner/simulator-server.ts`
2. Unused component `components/skeletons/CardSkeleton.tsx`

---

## ❌ Dead Code Found

### 1. Unused Function: `fetchTaskAndEmployeeDetails`

**File**: `lib/planner/simulator-server.ts`  
**Lines**: 72-121

**Function Signature**:
```typescript
export async function fetchTaskAndEmployeeDetails(
  taskIds: string[],
  employeeIds: string[]
): Promise<{ tasks: Map<string, Task>; employees: Map<string, Employee> }>
```

**Status**: ❌ **UNUSED**

**Evidence**:
- Function is exported but never imported or called anywhere
- Originally created for simulator but replaced by using initial data from props
- Simulator now uses `initialTasks` and `initialEmployees` passed from server component

**Impact**: Low - Dead code, no functional impact

**Recommendation**: **DELETE** the function (lines 72-121)

---

### 2. Unused Component: `CardSkeleton`

**File**: `components/skeletons/CardSkeleton.tsx`

**Status**: ❌ **UNUSED**

**Evidence**:
- Component exists but is never imported or used
- No references found in codebase
- Likely created for dashboard but not used

**Impact**: Low - Dead code, no functional impact

**Recommendation**: **DELETE** the file

---

## ✅ Verified Active Code

### All Other Files Are Active

**Server Utilities** (All Used):
- ✅ `lib/analytics/dashboard.ts` - Used by `/app/page.tsx`
- ✅ `lib/employees/server.ts` - Used by `/app/employees/page.tsx`
- ✅ `lib/tasks/server.ts` - Used by `/app/tasks/page.tsx`
- ✅ `lib/leaves/server.ts` - Used by `/app/leaves/page.tsx`
- ✅ `lib/planner/server.ts` - Used by `/app/planner/page.tsx`
- ✅ `lib/planner/versions-server.ts` - Used by `/app/planner/versions/page.tsx`
- ✅ `lib/planner/simulator-server.ts` - Used by `/app/planner/simulator/page.tsx` (except `fetchTaskAndEmployeeDetails`)

**Components** (All Used):
- ✅ `components/CSVUploadDialog.tsx` - Used by `/app/tasks/TasksClient.tsx` and `/app/employees/EmployeesClient.tsx`
- ✅ `components/SimulatorHowItWorksModal.tsx` - Used by `/app/planner/simulator/SimulatorClient.tsx`
- ✅ `components/HowItWorksModal.tsx` - Used by `/app/planner/PlannerClient.tsx`
- ✅ `components/Sidebar.tsx` - Used by `/app/layout.tsx`
- ✅ All dashboard components - Used by `/app/page.tsx`
- ✅ All UI components (`components/ui/*`) - Used throughout the app
- ✅ `components/skeletons/TableSkeleton.tsx` - Used in multiple pages

**Planning Engine** (All Functions Used):
- ✅ `generatePlan()` - Used by `/app/api/generate-plan/route.ts`
- ✅ `generatePlanSimulation()` - Used by `/app/planner/simulator/actions.ts` (via `runPlanSimulation`)
- ✅ `savePlanToDB()` - Used by `/app/api/generate-plan/route.ts`

**Server Actions** (All Used):
- ✅ All actions in `/app/employees/actions.ts` - Used by `EmployeesClient.tsx`
- ✅ All actions in `/app/tasks/actions.ts` - Used by `TasksClient.tsx`
- ✅ All actions in `/app/leaves/actions.ts` - Used by `LeavesClient.tsx`
- ✅ All actions in `/app/planner/actions.ts` - Used by `PlannerClient.tsx`
- ✅ All actions in `/app/planner/simulator/actions.ts` - Used by `SimulatorClient.tsx`

**API Routes** (All Used):
- ✅ `/app/api/generate-plan/route.ts` - Used by `PlannerClient.tsx`

---

## Summary Statistics

- **Total Files Scanned**: ~50+ files
- **Dead Code Found**: 2 items
- **Dead Code Percentage**: ~4%
- **Impact**: Low (no functional impact)

---

## Recommendations

### Immediate Actions
1. **Delete** `fetchTaskAndEmployeeDetails` function from `lib/planner/simulator-server.ts`
2. **Delete** `components/skeletons/CardSkeleton.tsx` file

### Benefits of Cleanup
- Reduced codebase size
- Less confusion for developers
- Easier maintenance
- Cleaner architecture

---

## Notes

- No commented-out code blocks found
- No unused imports detected (all imports are used)
- No unused exports detected (except the two items above)
- All utility functions are actively used
- All components are actively used (except CardSkeleton)

**Overall Code Health**: Excellent (96% active code)

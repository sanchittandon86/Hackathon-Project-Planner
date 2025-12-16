"use client";

/**
 * Client component for leaves page UI
 * 
 * This component handles all interactive UI elements:
 * - Forms and dialogs
 * - Employee selection
 * - Date inputs
 * - Table rendering
 * - Local UI state
 * 
 * It does NOT perform direct database operations.
 * All mutations go through Server Actions.
 */

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { toast } from "sonner";
import { addLeave, deleteLeave } from "./actions";
import type {
  Employee,
  LeaveWithEmployee,
} from "@/lib/leaves/server";

type LeavesClientProps = {
  initialEmployees: Employee[];
  initialLeaves: LeaveWithEmployee[];
};

export default function LeavesClient({
  initialEmployees,
  initialLeaves,
}: LeavesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>(initialLeaves);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveWithEmployee | null>(
    null
  );

  // Get today's date in local timezone (YYYY-MM-DD format)
  const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Log component mount and initial data
  useEffect(() => {
    console.log(`[LEAVES:FE] Component mounted with ${initialEmployees.length} employees and ${initialLeaves.length} leaves`);
  }, []);

  // Update local state when initial data changes (after refresh)
  useEffect(() => {
    console.log(`[LEAVES:FE] Data refreshed - received ${initialEmployees.length} employees and ${initialLeaves.length} leaves`);
    setEmployees(initialEmployees);
    setLeaves(initialLeaves);
  }, [initialEmployees, initialLeaves]);

  // Refresh leaves data after mutations
  const refreshLeaves = () => {
    console.log("[LEAVES:FE] Refreshing leaves data");
    startTransition(() => {
      router.refresh();
    });
  };

  // Get today's date in YYYY-MM-DD format for date picker min attribute
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const handleAddLeave = async () => {
    if (!selectedEmployee || !leaveDate) {
      console.log("[LEAVES:FE] handleAddLeave - Validation failed: missing employee or date");
      toast.error("Please select an employee and a date");
      return;
    }

    // Validate employee ID (should be a UUID string)
    const employeeId = selectedEmployee.trim();
    
    if (!employeeId || employeeId === '') {
      console.log("[LEAVES:FE] handleAddLeave - Validation failed: invalid employee ID");
      toast.error("Invalid employee selection. Please try again.");
      return;
    }

    // Verify the employee exists in the employees list
    const employeeExists = employees.some(emp => emp.id === employeeId);
    if (!employeeExists) {
      console.error("[LEAVES:FE] handleAddLeave - Employee not found in list:", { 
        employeeId, 
        availableIds: employees.map(e => e.id) 
      });
      toast.error("Selected employee not found. Please refresh and try again.");
      return;
    }

    // Check for duplicate leave (client-side check for UX)
    const isDuplicate = leaves.some(
      (leave) =>
        leave.employee_id === employeeId &&
        leave.leave_date === leaveDate
    );

    if (isDuplicate) {
      console.log("[LEAVES:FE] handleAddLeave - Validation failed: duplicate leave detected");
      toast.error("This employee already has a leave on this date");
      return;
    }

    const selectedEmployeeName = employees.find(emp => emp.id === employeeId)?.name || "Unknown";
    console.log("[LEAVES:FE] handleAddLeave - Calling server action", { employeeId, employeeName: selectedEmployeeName, leaveDate });
    try {
      const result = await addLeave(employeeId, leaveDate);

      if (!result.success) {
        console.error("[LEAVES:FE] handleAddLeave - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to add leave");
      } else {
        console.log("[LEAVES:FE] handleAddLeave - Success");
        // Reset form
        setSelectedEmployee("");
        setLeaveDate("");
        toast.success("Leave added successfully!");
        refreshLeaves();
      }
    } catch (error) {
      console.error("[LEAVES:FE] handleAddLeave - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const handleDeleteClick = (leave: LeaveWithEmployee) => {
    console.log("[LEAVES:FE] handleDeleteClick - Opening delete confirmation", { id: leave.id, employeeName: leave.employee_name, leaveDate: leave.leave_date });
    setLeaveToDelete(leave);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leaveToDelete) return;

    console.log("[LEAVES:FE] handleDeleteConfirm - Calling server action", { id: leaveToDelete.id });
    try {
      const result = await deleteLeave(leaveToDelete.id);

      if (!result.success) {
        console.error("[LEAVES:FE] handleDeleteConfirm - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to delete leave");
      } else {
        console.log("[LEAVES:FE] handleDeleteConfirm - Success");
        // Close dialog and refresh
        setDeleteDialogOpen(false);
        setLeaveToDelete(null);
        toast.success("Leave deleted successfully!");
        refreshLeaves();
      }
    } catch (error) {
      console.error("[LEAVES:FE] handleDeleteConfirm - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Leave Calendar Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Leave Form */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg font-semibold">Add Leave</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.name} ({employee.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveDate">Leave Date</Label>
                <Input
                  id="leaveDate"
                  type="date"
                  value={leaveDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    console.log("[LEAVES:FE] Leave date changed", { selectedDate });
                    setLeaveDate(selectedDate);
                  }}
                  min={getTodayLocal()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddLeave} className="w-full">
                  Add Leave
                </Button>
              </div>
            </div>
          </div>

          {/* Leaves Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Leaves</h3>
            {isPending ? (
              <TableSkeleton rows={5} columns={3} />
            ) : leaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leaves recorded yet. Add a leave using the form above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">
                        {leave.employee_name}
                      </TableCell>
                      <TableCell>{formatDate(leave.leave_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(leave)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the leave for{" "}
              <strong>
                {leaveToDelete?.employee_name || "this employee"}
              </strong>{" "}
              on{" "}
              <strong>
                {leaveToDelete
                  ? formatDate(leaveToDelete.leave_date)
                  : ""}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

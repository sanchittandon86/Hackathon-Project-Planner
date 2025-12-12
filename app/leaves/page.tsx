"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  designation: string;
};

type Leave = {
  id: string;
  employee_id: string;
  leave_date: string;
  employees?: {
    name: string;
  };
};

type LeaveWithEmployee = Leave & {
  employee_name: string;
};

export default function LeavesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveWithEmployee | null>(
    null
  );

  useEffect(() => {
    loadEmployees();
    loadLeaves();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error loading employees:", error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadLeaves = async () => {
    setLoading(true);
    try {
      // Fetch leaves with employee names using join
      const { data, error } = await supabase
        .from("leaves")
        .select("*, employees(name)")
        .order("leave_date", { ascending: false });

      if (error) {
        console.error("Error loading leaves:", error);
        setLoading(false);
        return;
      }

      // Transform data to include employee_name
      const leavesWithNames: LeaveWithEmployee[] = (data || []).map(
        (leave: any) => ({
          ...leave,
          employee_name: leave.employees?.name || "Unknown Employee",
        })
      );

      setLeaves(leavesWithNames);
    } catch (error) {
      console.error("Error loading leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async () => {
    if (!selectedEmployee || !leaveDate) {
      alert("Please select an employee and a date");
      return;
    }

    // Check for duplicate leave (same employee, same date)
    const isDuplicate = leaves.some(
      (leave) =>
        leave.employee_id === selectedEmployee &&
        leave.leave_date === leaveDate
    );

    if (isDuplicate) {
      alert("This employee already has a leave on this date");
      return;
    }

    try {
      const { error } = await supabase.from("leaves").insert({
        employee_id: selectedEmployee,
        leave_date: leaveDate,
      });

      if (error) {
        console.error("Error adding leave:", error);
        alert("Failed to add leave. Please try again.");
        return;
      }

      // Reset form
      setSelectedEmployee("");
      setLeaveDate("");

      // Refresh leaves list
      await loadLeaves();
    } catch (error) {
      console.error("Error adding leave:", error);
      alert("Failed to add leave. Please try again.");
    }
  };

  const handleDeleteClick = (leave: LeaveWithEmployee) => {
    setLeaveToDelete(leave);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!leaveToDelete) return;

    try {
      const { error } = await supabase
        .from("leaves")
        .delete()
        .eq("id", leaveToDelete.id);

      if (error) {
        console.error("Error deleting leave:", error);
        alert("Failed to delete leave. Please try again.");
        return;
      }

      // Close dialog and refresh
      setDeleteDialogOpen(false);
      setLeaveToDelete(null);
      await loadLeaves();
    } catch (error) {
      console.error("Error deleting leave:", error);
      alert("Failed to delete leave. Please try again.");
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

  const getSelectedEmployeeName = () => {
    const employee = employees.find((emp) => emp.id === selectedEmployee);
    return employee?.name || "";
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
                      <SelectItem key={employee.id} value={employee.id}>
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
                  onChange={(e) => setLeaveDate(e.target.value)}
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
            {loading ? (
              <div className="text-center py-8">Loading leaves...</div>
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
              <strong>{leaveToDelete?.employee_name}</strong> on{" "}
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


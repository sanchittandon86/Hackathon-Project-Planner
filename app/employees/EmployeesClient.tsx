"use client";

/**
 * Client component for employees page UI
 * 
 * This component handles all interactive UI elements:
 * - Forms and dialogs
 * - Search and filters
 * - Table rendering
 * - Local UI state
 * 
 * It does NOT perform direct database operations.
 * All mutations go through Server Actions.
 */

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Employee, EmployeeInsert } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Search,
  X,
  Users,
  UserCheck,
  Code,
  Bug,
  Upload,
} from "lucide-react";
import { CSVUploadDialog } from "@/components/CSVUploadDialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
  bulkImportEmployees,
} from "./actions";

type EmployeesClientProps = {
  initialEmployees: Employee[];
};

export default function EmployeesClient({
  initialEmployees,
}: EmployeesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [designationFilter, setDesignationFilter] = useState<
    "all" | "Developer" | "QA"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Form state
  const [formData, setFormData] = useState<EmployeeInsert>({
    name: "",
    designation: "Developer",
    active: true,
  });

  // Refresh employees data after mutations
  const refreshEmployees = () => {
    console.log("[EMPLOYEES:FE] Refreshing employees data");
    startTransition(() => {
      router.refresh();
    });
  };

  // Add new employee
  const handleAddEmployee = async () => {
    if (!formData.name.trim()) {
      console.log("[EMPLOYEES:FE] handleAddEmployee - Validation failed: empty name");
      toast.error("Please enter employee name");
      return;
    }

    console.log("[EMPLOYEES:FE] handleAddEmployee - Calling server action", { name: formData.name, designation: formData.designation, active: formData.active });
    try {
      setSubmitting(true);
      const result = await addEmployee(formData);

      if (!result.success) {
        console.error("[EMPLOYEES:FE] handleAddEmployee - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to add employee");
      } else {
        console.log("[EMPLOYEES:FE] handleAddEmployee - Success");
        setIsDialogOpen(false);
        resetForm();
        toast.success("Employee added successfully!");
        refreshEmployees();
      }
    } catch (error) {
      console.error("[EMPLOYEES:FE] handleAddEmployee - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing employee
  const handleUpdateEmployee = async () => {
    if (!selectedEmployee || !formData.name.trim()) {
      console.log("[EMPLOYEES:FE] handleUpdateEmployee - Validation failed");
      toast.error("Please enter employee name");
      return;
    }

    console.log("[EMPLOYEES:FE] handleUpdateEmployee - Calling server action", { id: selectedEmployee.id, name: formData.name, designation: formData.designation, active: formData.active });
    try {
      setSubmitting(true);
      const result = await updateEmployee(selectedEmployee.id, formData);

      if (!result.success) {
        console.error("[EMPLOYEES:FE] handleUpdateEmployee - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to update employee");
      } else {
        console.log("[EMPLOYEES:FE] handleUpdateEmployee - Success");
        setIsDialogOpen(false);
        resetForm();
        toast.success("Employee updated successfully!");
        refreshEmployees();
      }
    } catch (error) {
      console.error("[EMPLOYEES:FE] handleUpdateEmployee - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete employee
  const handleDeleteEmployee = async () => {
    if (!deleteEmployeeId) return;

    console.log("[EMPLOYEES:FE] handleDeleteEmployee - Calling server action", { id: deleteEmployeeId });
    try {
      setSubmitting(true);
      const result = await deleteEmployee(deleteEmployeeId);

      if (!result.success) {
        console.error("[EMPLOYEES:FE] handleDeleteEmployee - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to delete employee");
      } else {
        console.log("[EMPLOYEES:FE] handleDeleteEmployee - Success");
        setIsDeleteDialogOpen(false);
        setDeleteEmployeeId(null);
        toast.success("Employee deleted successfully!");
        refreshEmployees();
      }
    } catch (error) {
      console.error("[EMPLOYEES:FE] handleDeleteEmployee - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open dialog for adding new employee
  const openAddDialog = () => {
    console.log("[EMPLOYEES:FE] openAddDialog - Opening add employee dialog");
    resetForm();
    setSelectedEmployee(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing employee
  const openEditDialog = (employee: Employee) => {
    console.log("[EMPLOYEES:FE] openEditDialog - Opening edit dialog", { id: employee.id, name: employee.name });
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      designation: employee.designation,
      active: employee.active,
    });
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: number) => {
    console.log("[EMPLOYEES:FE] openDeleteDialog - Opening delete confirmation", { id });
    setDeleteEmployeeId(id);
    setIsDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      designation: "Developer",
      active: true,
    });
    setSelectedEmployee(null);
  };

  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Handle CSV import
  const handleCSVImport = async (rows: Array<Record<string, string>>) => {
    console.log("[EMPLOYEES:FE] handleCSVImport - Processing CSV", { rowCount: rows.length });
    const validRows: EmployeeInsert[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const employee: EmployeeInsert = {
          name: row.name?.trim() || "",
          designation:
            (row.designation?.trim() as "Developer" | "QA") || "Developer",
          active: true,
        };

        // Validate
        if (!employee.name) {
          errors.push(`Row missing name`);
          continue;
        }

        if (
          employee.designation !== "Developer" &&
          employee.designation !== "QA"
        ) {
          errors.push(
            `Row "${employee.name}": Invalid designation. Must be Developer or QA`
          );
          continue;
        }

        validRows.push(employee);
      } catch (error: any) {
        errors.push(`Row parsing error: ${error.message}`);
      }
    }

    if (validRows.length === 0) {
      console.log("[EMPLOYEES:FE] handleCSVImport - No valid rows after validation", { errors });
      return { success: false, inserted: 0, errors };
    }

    console.log("[EMPLOYEES:FE] handleCSVImport - Calling server action", { validCount: validRows.length, errorCount: errors.length });
    try {
      const result = await bulkImportEmployees(validRows);

      if (!result.success) {
        console.error("[EMPLOYEES:FE] handleCSVImport - Server action failed", { error: result.error });
        return {
          success: false,
          inserted: 0,
          errors: [result.error || "Failed to import employees"],
        };
      }

      console.log("[EMPLOYEES:FE] handleCSVImport - Success", { inserted: result.data?.inserted });
      refreshEmployees();
      return {
        success: true,
        inserted: result.data?.inserted || validRows.length,
        errors,
      };
    } catch (error: any) {
      console.error("[EMPLOYEES:FE] handleCSVImport - Unexpected error:", error);
      return {
        success: false,
        inserted: 0,
        errors: [error.message || "An unexpected error occurred"],
      };
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesDesignation =
      designationFilter === "all" ||
      employee.designation === designationFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.active) ||
      (statusFilter === "inactive" && !employee.active);

    return matchesSearch && matchesDesignation && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    console.log("[EMPLOYEES:FE] clearFilters - Clearing all filters");
    setSearchQuery("");
    setDesignationFilter("all");
    setStatusFilter("all");
  };

  // Log filter changes
  useEffect(() => {
    if (searchQuery || designationFilter !== "all" || statusFilter !== "all") {
      const filteredCount = employees.filter((employee) => {
        const matchesSearch = employee.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesDesignation =
          designationFilter === "all" ||
          employee.designation === designationFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && employee.active) ||
          (statusFilter === "inactive" && !employee.active);
        return matchesSearch && matchesDesignation && matchesStatus;
      }).length;
      console.log("[EMPLOYEES:FE] Filter changed", { searchQuery, designationFilter, statusFilter, filteredCount, totalCount: employees.length });
    }
  }, [searchQuery, designationFilter, statusFilter, employees]);

  const hasActiveFilters =
    searchQuery !== "" ||
    designationFilter !== "all" ||
    statusFilter !== "all";

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp) => emp.active).length;
  const developerCount = employees.filter(
    (emp) => emp.designation === "Developer"
  ).length;
  const qaCount = employees.filter((emp) => emp.designation === "QA").length;

  // Log component mount and initial data
  useEffect(() => {
    console.log(`[EMPLOYEES:FE] Component mounted with ${initialEmployees.length} employees`);
  }, []);

  // Update local state when initialEmployees changes (after refresh)
  useEffect(() => {
    console.log(`[EMPLOYEES:FE] Data refreshed - received ${initialEmployees.length} employees`);
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              All registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {totalEmployees > 0
                ? `${Math.round((activeEmployees / totalEmployees) * 100)}%`
                : "0%"}{" "}
              of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developers</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{developerCount}</div>
            <p className="text-xs text-muted-foreground">
              Development team size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Engineers</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaCount}</div>
            <p className="text-xs text-muted-foreground">
              Quality assurance team
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Employee Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Employee Master</CardTitle>
              <CardDescription className="mt-2">
                Manage your organization's employee records
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button onClick={openAddDialog} size="lg" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedEmployee ? "Edit Employee" : "Add New Employee"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedEmployee
                        ? "Update employee information below"
                        : "Fill in the details to add a new employee"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter employee name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled={submitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="designation">Designation *</Label>
                      <Select
                        value={formData.designation}
                        onValueChange={(value: "Developer" | "QA") =>
                          setFormData({ ...formData, designation: value })
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger id="designation">
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Developer">Developer</SelectItem>
                          <SelectItem value="QA">QA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            active: checked === true,
                          })
                        }
                        disabled={submitting}
                      />
                      <Label
                        htmlFor="active"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Active Employee
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      onClick={
                        selectedEmployee
                          ? handleUpdateEmployee
                          : handleAddEmployee
                      }
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {selectedEmployee ? "Update" : "Add"} Employee
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => setCsvDialogOpen(true)}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Designation Filter */}
              <Select
                value={designationFilter}
                onValueChange={(value: "all" | "Developer" | "QA") =>
                  setDesignationFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designations</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value: "all" | "active" | "inactive") =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredEmployees.length} of {employees.length} employees
            </div>
          </div>

          {isPending ? (
            <div className="rounded-lg border overflow-hidden">
              <TableSkeleton rows={6} columns={4} />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No employees found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Employee" button to create your first employee
                record
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No employees match your filters
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[80px] font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Designation</TableHead>
                    <TableHead className="w-[120px] font-semibold">Status</TableHead>
                    <TableHead className="w-[150px] text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      className={`
                        transition-colors duration-150 hover:bg-muted/50
                        ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                      `}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        #{employee.id}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {employee.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {employee.designation === "Developer" ? (
                            <Code className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bug className="h-4 w-4 text-purple-600" />
                          )}
                          <span className="text-sm font-medium">
                            {employee.designation}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            employee.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {employee.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(employee)}
                            className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                            title="Edit employee"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(employee.id)}
                            className="h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                            title="Delete employee"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteEmployeeId(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmployee}
              disabled={submitting}
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <CSVUploadDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        title="Upload Employees CSV"
        description="Upload or paste CSV data to bulk import employees. Expected columns: name, designation"
        columns={[
          {
            key: "name",
            label: "Name",
            required: true,
          },
          {
            key: "designation",
            label: "Designation",
            required: true,
            validator: (value) => {
              if (value !== "Developer" && value !== "QA") {
                return "Must be 'Developer' or 'QA'";
              }
              return null;
            },
          },
        ]}
        onImport={handleCSVImport}
        sampleData="John Doe,Developer\nSarah Lee,QA\nMike Smith,Developer"
      />
    </div>
  );
}

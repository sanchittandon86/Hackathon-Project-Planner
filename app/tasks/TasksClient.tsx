"use client";

/**
 * Client component for tasks page UI
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
import { Task, TaskInsert } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Clock,
  Search,
  X,
  ListTodo,
  Code,
  Bug,
  TrendingUp,
  Upload,
} from "lucide-react";
import { CSVUploadDialog } from "@/components/CSVUploadDialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { addTask, updateTask, deleteTask, bulkImportTasks } from "./actions";
import { formatDateLocal } from "@/lib/utils";

type TasksClientProps = {
  initialTasks: Task[];
};

export default function TasksClient({ initialTasks }: TasksClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [designationFilter, setDesignationFilter] = useState<
    "all" | "Developer" | "QA"
  >("all");

  // Form state
  const [formData, setFormData] = useState<
    TaskInsert & { due_date?: string | null }
  >({
    client: "",
    title: "",
    effort_hours: 0,
    designation_required: "Developer",
    due_date: null,
  });

  // Log component mount and initial data
  useEffect(() => {
    console.log(`[TASKS:FE] Component mounted with ${initialTasks.length} tasks`);
  }, []);

  // Update local state when initialTasks changes (after refresh)
  useEffect(() => {
    console.log(`[TASKS:FE] Data refreshed - received ${initialTasks.length} tasks`);
    setTasks(initialTasks);
  }, [initialTasks]);

  // Refresh tasks data after mutations
  const refreshTasks = () => {
    console.log("[TASKS:FE] Refreshing tasks data");
    startTransition(() => {
      router.refresh();
    });
  };

  // Add new task
  const handleAddTask = async () => {
    if (!formData.client.trim()) {
      console.log("[TASKS:FE] handleAddTask - Validation failed: empty client name");
      toast.error("Please enter client name");
      return;
    }
    if (!formData.title.trim()) {
      console.log("[TASKS:FE] handleAddTask - Validation failed: empty title");
      toast.error("Please enter task title");
      return;
    }
    if (formData.effort_hours <= 0) {
      console.log("[TASKS:FE] handleAddTask - Validation failed: invalid effort hours");
      toast.error("Please enter valid effort hours (greater than 0)");
      return;
    }
    // Validate due_date if provided
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        console.log("[TASKS:FE] handleAddTask - Validation failed: due date in past");
        toast.error("Due date must be today or in the future");
        return;
      }
    }

    console.log("[TASKS:FE] handleAddTask - Calling server action", { client: formData.client, title: formData.title, effort_hours: formData.effort_hours, designation_required: formData.designation_required, due_date: formData.due_date });
    try {
      setSubmitting(true);
      const result = await addTask(formData);

      if (!result.success) {
        console.error("[TASKS:FE] handleAddTask - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to add task");
      } else {
        console.log("[TASKS:FE] handleAddTask - Success");
        setIsDialogOpen(false);
        resetForm();
        toast.success("Task added successfully!");
        refreshTasks();
      }
    } catch (error) {
      console.error("[TASKS:FE] handleAddTask - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing task
  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (!formData.client.trim()) {
      console.log("[TASKS:FE] handleUpdateTask - Validation failed: empty client name");
      toast.error("Please enter client name");
      return;
    }
    if (!formData.title.trim()) {
      console.log("[TASKS:FE] handleUpdateTask - Validation failed: empty title");
      toast.error("Please enter task title");
      return;
    }
    if (formData.effort_hours <= 0) {
      console.log("[TASKS:FE] handleUpdateTask - Validation failed: invalid effort hours");
      toast.error("Please enter valid effort hours (greater than 0)");
      return;
    }
    // Validate due_date if provided
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        console.log("[TASKS:FE] handleUpdateTask - Validation failed: due date in past");
        toast.error("Due date must be today or in the future");
        return;
      }
    }

    console.log("[TASKS:FE] handleUpdateTask - Calling server action", { id: selectedTask.id, client: formData.client, title: formData.title, effort_hours: formData.effort_hours, designation_required: formData.designation_required, due_date: formData.due_date });
    try {
      setSubmitting(true);
      const result = await updateTask(selectedTask.id, formData);

      if (!result.success) {
        console.error("[TASKS:FE] handleUpdateTask - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to update task");
      } else {
        console.log("[TASKS:FE] handleUpdateTask - Success");
        setIsDialogOpen(false);
        resetForm();
        toast.success("Task updated successfully!");
        refreshTasks();
      }
    } catch (error) {
      console.error("[TASKS:FE] handleUpdateTask - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    console.log("[TASKS:FE] handleDeleteTask - Calling server action", { id: deleteTaskId });
    try {
      setSubmitting(true);
      const result = await deleteTask(deleteTaskId);

      if (!result.success) {
        console.error("[TASKS:FE] handleDeleteTask - Server action failed", { error: result.error });
        toast.error(result.error || "Failed to delete task");
      } else {
        console.log("[TASKS:FE] handleDeleteTask - Success");
        setIsDeleteDialogOpen(false);
        setDeleteTaskId(null);
        toast.success("Task deleted successfully!");
        refreshTasks();
      }
    } catch (error) {
      console.error("[TASKS:FE] handleDeleteTask - Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open dialog for adding new task
  const openAddDialog = () => {
    console.log("[TASKS:FE] openAddDialog - Opening add task dialog");
    resetForm();
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing task
  const openEditDialog = (task: Task) => {
    console.log("[TASKS:FE] openEditDialog - Opening edit dialog", { id: task.id, title: task.title, client: task.client });
    setSelectedTask(task);
    setFormData({
      client: task.client,
      title: task.title,
      effort_hours: task.effort_hours,
      designation_required: task.designation_required,
      due_date: (task as any).due_date || null,
    });
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: number) => {
    console.log("[TASKS:FE] openDeleteDialog - Opening delete confirmation", { id });
    setDeleteTaskId(id);
    setIsDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      client: "",
      title: "",
      effort_hours: 0,
      designation_required: "Developer",
      due_date: null,
    });
    setSelectedTask(null);
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
    console.log("[TASKS:FE] handleCSVImport - Processing CSV", { rowCount: rows.length });
    const validRows: TaskInsert[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const task: TaskInsert = {
          title: row.title?.trim() || "",
          client: row.client?.trim() || "",
          effort_hours: parseInt(row.effort_hours || "0", 10),
          designation_required:
            (row.designation_required?.trim() as "Developer" | "QA") ||
            "Developer",
          due_date: row.due_date?.trim() || null,
        };

        // Validate
        if (!task.title) {
          errors.push(`Row missing title`);
          continue;
        }

        if (!task.client) {
          errors.push(`Row "${task.title}": Missing client`);
          continue;
        }

        if (isNaN(task.effort_hours) || task.effort_hours <= 0) {
          errors.push(
            `Row "${task.title}": Invalid effort_hours. Must be a positive number`
          );
          continue;
        }

        if (
          task.designation_required !== "Developer" &&
          task.designation_required !== "QA"
        ) {
          errors.push(
            `Row "${task.title}": Invalid designation_required. Must be Developer or QA`
          );
          continue;
        }

        validRows.push(task);
      } catch (error: any) {
        errors.push(`Row parsing error: ${error.message}`);
      }
    }

    if (validRows.length === 0) {
      console.log("[TASKS:FE] handleCSVImport - No valid rows after validation", { errors });
      return { success: false, inserted: 0, errors };
    }

    console.log("[TASKS:FE] handleCSVImport - Calling server action", { validCount: validRows.length, errorCount: errors.length });
    try {
      const result = await bulkImportTasks(validRows);

      if (!result.success) {
        console.error("[TASKS:FE] handleCSVImport - Server action failed", { error: result.error });
        return {
          success: false,
          inserted: 0,
          errors: [result.error || "Failed to import tasks"],
        };
      }

      console.log("[TASKS:FE] handleCSVImport - Success", { inserted: result.data?.inserted });
      refreshTasks();
      return {
        success: true,
        inserted: result.data?.inserted || validRows.length,
        errors,
      };
    } catch (error: any) {
      console.error("[TASKS:FE] handleCSVImport - Unexpected error:", error);
      return {
        success: false,
        inserted: 0,
        errors: [error.message || "An unexpected error occurred"],
      };
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesignation =
      designationFilter === "all" ||
      task.designation_required === designationFilter;

    return matchesSearch && matchesDesignation;
  });

  // Clear all filters
  const clearFilters = () => {
    console.log("[TASKS:FE] clearFilters - Clearing all filters");
    setSearchQuery("");
    setDesignationFilter("all");
  };

  // Log filter changes
  useEffect(() => {
    if (searchQuery || designationFilter !== "all") {
      const filteredCount = tasks.filter((task) => {
        const matchesSearch =
          task.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDesignation =
          designationFilter === "all" ||
          task.designation_required === designationFilter;
        return matchesSearch && matchesDesignation;
      }).length;
      console.log("[TASKS:FE] Filter changed", { searchQuery, designationFilter, filteredCount, totalCount: tasks.length });
    }
  }, [searchQuery, designationFilter, tasks]);

  const hasActiveFilters =
    searchQuery !== "" || designationFilter !== "all";

  // Calculate statistics
  const totalTasks = tasks.length;
  const totalEffortHours = tasks.reduce(
    (sum, task) => sum + task.effort_hours,
    0
  );
  const developerTasks = tasks.filter(
    (task) => task.designation_required === "Developer"
  ).length;
  const qaTasks = tasks.filter(
    (task) => task.designation_required === "QA"
  ).length;

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">All project tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Effort</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEffortHours}</div>
            <p className="text-xs text-muted-foreground">Hours estimated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developer Tasks</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{developerTasks}</div>
            <p className="text-xs text-muted-foreground">Development work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QA Tasks</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaTasks}</div>
            <p className="text-xs text-muted-foreground">Testing work</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tasks Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">Tasks Master</CardTitle>
              <CardDescription className="mt-2">
                Manage project tasks and client requirements
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button onClick={openAddDialog} size="lg" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedTask ? "Edit Task" : "Add New Task"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedTask
                        ? "Update task information below"
                        : "Fill in the details to add a new task"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">Client Name *</Label>
                      <Input
                        id="client"
                        placeholder="Enter client name"
                        value={formData.client}
                        onChange={(e) =>
                          setFormData({ ...formData, client: e.target.value })
                        }
                        disabled={submitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Task Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter task title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        disabled={submitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="effort_hours">Effort (Hours) *</Label>
                      <Input
                        id="effort_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Enter effort in hours"
                        value={formData.effort_hours || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            effort_hours: parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={submitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="designation">Designation Required *</Label>
                      <Select
                        value={formData.designation_required}
                        onValueChange={(value: "Developer" | "QA") =>
                          setFormData({
                            ...formData,
                            designation_required: value,
                          })
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
                    <div className="grid gap-2">
                      <Label htmlFor="due_date">Due Date (Optional)</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date || ""}
                        min={formatDateLocal(new Date())}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            due_date: e.target.value || null,
                          })
                        }
                        disabled={submitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Task must be completed by this date
                      </p>
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
                      onClick={selectedTask ? handleUpdateTask : handleAddTask}
                      disabled={submitting}
                    >
                      {submitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {selectedTask ? "Update" : "Add"} Task
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
                  placeholder="Search by client or task title..."
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
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>

          {isPending ? (
            <div className="rounded-lg border overflow-hidden">
              <TableSkeleton rows={6} columns={6} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Task" button to create your first task
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No tasks match your filters
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
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="w-[140px] font-semibold">
                      Effort
                    </TableHead>
                    <TableHead className="w-[160px] font-semibold">
                      Designation
                    </TableHead>
                    <TableHead className="w-[150px] text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task, index) => (
                    <TableRow
                      key={task.id}
                      className={`
                        transition-colors duration-150 hover:bg-muted/50
                        ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                      `}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        #{task.id}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {task.client}
                      </TableCell>
                      <TableCell className="text-sm">{task.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-sm">
                            {task.effort_hours}{" "}
                            {task.effort_hours === 1 ? "hr" : "hrs"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {task.designation_required === "Developer" ? (
                            <Code className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Bug className="h-4 w-4 text-purple-600" />
                          )}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              task.designation_required === "Developer"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            }`}
                          >
                            {task.designation_required}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(task)}
                            className="h-8 w-8 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                            title="Edit task"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(task.id)}
                            className="h-8 w-8 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                            title="Delete task"
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
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteTaskId(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
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
        title="Upload Tasks CSV"
        description="Upload or paste CSV data to bulk import tasks. Expected columns: title, client, effort_hours, designation_required, due_date (optional)"
        columns={[
          {
            key: "title",
            label: "Title",
            required: true,
          },
          {
            key: "client",
            label: "Client",
            required: true,
          },
          {
            key: "effort_hours",
            label: "Effort Hours",
            required: true,
            validator: (value) => {
              const num = parseInt(value, 10);
              if (isNaN(num) || num <= 0) {
                return "Must be a positive number";
              }
              return null;
            },
          },
          {
            key: "designation_required",
            label: "Designation Required",
            required: true,
            validator: (value) => {
              if (value !== "Developer" && value !== "QA") {
                return "Must be 'Developer' or 'QA'";
              }
              return null;
            },
          },
          {
            key: "due_date",
            label: "Due Date (Optional)",
            required: false,
          },
        ]}
        onImport={handleCSVImport}
        sampleData="Build API,Client A,24,Developer,2024-12-31\nUI Testing,Client B,16,QA,2024-12-15"
      />
    </div>
  );
}

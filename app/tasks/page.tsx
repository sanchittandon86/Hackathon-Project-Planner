"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Task, TaskInsert } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Pencil, Trash2, Plus, Loader2, Clock } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TaskInsert>({
    client: "",
    title: "",
    effort_hours: 0,
    designation_required: "Developer",
  });

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
        alert("Failed to fetch tasks. Please try again.");
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Add new task
  const handleAddTask = async () => {
    if (!formData.client.trim()) {
      alert("Please enter client name");
      return;
    }
    if (!formData.title.trim()) {
      alert("Please enter task title");
      return;
    }
    if (formData.effort_hours <= 0) {
      alert("Please enter valid effort hours (greater than 0)");
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from("tasks")
        .insert([formData])
        .select();

      if (error) {
        console.error("Error adding task:", error);
        alert("Failed to add task. Please try again.");
      } else {
        await fetchTasks();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Update existing task
  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    if (!formData.client.trim()) {
      alert("Please enter client name");
      return;
    }
    if (!formData.title.trim()) {
      alert("Please enter task title");
      return;
    }
    if (formData.effort_hours <= 0) {
      alert("Please enter valid effort hours (greater than 0)");
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("tasks")
        .update(formData)
        .eq("id", selectedTask.id);

      if (error) {
        console.error("Error updating task:", error);
        alert("Failed to update task. Please try again.");
      } else {
        await fetchTasks();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", deleteTaskId);

      if (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      } else {
        await fetchTasks();
        setIsDeleteDialogOpen(false);
        setDeleteTaskId(null);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open dialog for adding new task
  const openAddDialog = () => {
    resetForm();
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing task
  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      client: task.client,
      title: task.title,
      effort_hours: task.effort_hours,
      designation_required: task.designation_required,
    });
    setIsDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (id: number) => {
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

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">Tasks Master</CardTitle>
              <CardDescription className="mt-2">
                Manage project tasks and client requirements
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} size="lg">
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
                        setFormData({ ...formData, designation_required: value })
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
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selectedTask ? "Update" : "Add"} Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No tasks found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click the "Add Task" button to create your first task
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[130px]">Effort</TableHead>
                    <TableHead className="w-[150px]">Designation</TableHead>
                    <TableHead className="w-[150px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id}</TableCell>
                      <TableCell className="font-medium">{task.client}</TableCell>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {task.effort_hours} {task.effort_hours === 1 ? 'hr' : 'hrs'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.designation_required === "Developer"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {task.designation_required}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
              Are you sure you want to delete this task? This action cannot be undone.
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
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Shared TypeScript types for dashboard analytics
 */

export type TasksPerClient = {
  name: string;
  value: number;
};

export type WorkloadDistribution = {
  name: string;
  hours: number;
};

export type DashboardAnalytics = {
  totalEmployees: number;
  totalTasks: number;
  tasksPerClient: TasksPerClient[];
  upcomingLeaves: number;
  workloadDistribution: WorkloadDistribution[];
  overdueTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
};

export interface Employee {
  id: number;
  name: string;
  designation: 'Developer' | 'QA';
  active: boolean;
  created_at?: string;
}

export interface EmployeeBasic {
  id: number;
  name: string;
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at'>;
export type EmployeeUpdate = Partial<EmployeeInsert> & { id: number };

export interface Task {
  id: number;
  client: string;
  title: string;
  effort_hours: number;
  designation_required: 'Developer' | 'QA';
  due_date?: string | null;
  created_at?: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at'>;
export type TaskUpdate = Partial<TaskInsert> & { id: number };

export type Priority = 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'High',
  2: 'Normal',
  3: 'Low',
};

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  priority: Priority;
  /** YYYY-MM-DD, or null when the task has no due date. */
  dueDate: string | null;
  /** YYYY-MM-DD of completion, or null while the task is open. */
  completedOn: string | null;
};

export type Habit = {
  id: number;
  name: string;
  /** Whether it has been checked off for the current day. */
  doneToday: boolean;
  /** Consecutive days completed, counting back from today. */
  streak: number;
  /** Days completed in the last 30. */
  last30: number;
};

export type DayCount = {
  /** YYYY-MM-DD */
  date: string;
  count: number;
};

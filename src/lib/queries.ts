import { getSql } from '@/lib/db';
import { TIMEZONE, addDays, dateRange, todayISO } from '@/lib/dates';
import type { DayCount, Habit, Priority, Task } from '@/lib/types';

/**
 * Two rules hold across every query here.
 *
 * 1. Date columns are formatted with to_char rather than returned raw. The
 *    driver would otherwise hand back JS Date objects, reintroducing exactly
 *    the timezone ambiguity that storing calendar dates avoids.
 *
 * 2. `completed_at` is an instant (timestamptz), so it is converted to
 *    TIMEZONE before being reduced to a day. Postgres runs in UTC on Vercel,
 *    and a task finished at 21:30 in New York is already tomorrow in UTC —
 *    bucketing it without converting would file it under the wrong day and
 *    never agree with todayISO().
 */

export type TaskFilter = 'open' | 'done' | 'all';

export async function listTasks(filter: TaskFilter): Promise<Task[]> {
  const sql = getSql();

  const rows = await sql`
    select
      id,
      title,
      notes,
      priority,
      to_char(due_date, 'YYYY-MM-DD')                as due_date,
      to_char(completed_at at time zone ${TIMEZONE}, 'YYYY-MM-DD') as completed_on
    from tasks
    where
      case ${filter}
        when 'open' then completed_at is null
        when 'done' then completed_at is not null
        else true
      end
    order by
      completed_at desc nulls first,
      due_date asc nulls last,
      priority asc,
      created_at desc
    limit 500
  `;

  return rows.map(toTask);
}

/** Open tasks that are due today or already overdue, most urgent first. */
export async function listTodayTasks(today: string): Promise<Task[]> {
  const sql = getSql();

  const rows = await sql`
    select
      id,
      title,
      notes,
      priority,
      to_char(due_date, 'YYYY-MM-DD')     as due_date,
      to_char(completed_at at time zone ${TIMEZONE}, 'YYYY-MM-DD') as completed_on
    from tasks
    where completed_at is null
      and due_date is not null
      and due_date <= ${today}::date
    order by due_date asc, priority asc
    limit 25
  `;

  return rows.map(toTask);
}

export type TaskCounts = {
  open: number;
  dueToday: number;
  overdue: number;
  completedThisWeek: number;
};

export async function getTaskCounts(today: string): Promise<TaskCounts> {
  const sql = getSql();
  const weekStart = addDays(today, -6);

  const [row] = await sql`
    select
      count(*) filter (where completed_at is null)                          as open,
      count(*) filter (where completed_at is null and due_date = ${today}::date) as due_today,
      count(*) filter (where completed_at is null and due_date < ${today}::date) as overdue,
      count(*) filter (
        where completed_at is not null
          and completed_at >= (${weekStart}::date::timestamp at time zone ${TIMEZONE})
      )                                                                     as completed_this_week
    from tasks
  `;

  return {
    open: Number(row.open),
    dueToday: Number(row.due_today),
    overdue: Number(row.overdue),
    completedThisWeek: Number(row.completed_this_week),
  };
}

/** Tasks completed on each of the `days` calendar days ending today. */
export async function getCompletionsByDay(today: string, days: number): Promise<DayCount[]> {
  const sql = getSql();
  const start = addDays(today, -(days - 1));

  const rows = await sql`
    select
      to_char(completed_at at time zone ${TIMEZONE}, 'YYYY-MM-DD') as date,
      count(*)                                                     as count
    from tasks
    where completed_at >= (${start}::date::timestamp at time zone ${TIMEZONE})
    group by 1
  `;

  const counts = new Map(rows.map((row) => [String(row.date), Number(row.count)]));
  return dateRange(today, days).map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

/** Active habits, with today's status and streak computed from their entries. */
export async function listHabits(today: string): Promise<Habit[]> {
  const sql = getSql();

  const habitRows = await sql`
    select id, name
    from habits
    where archived_at is null
    order by created_at asc
  `;

  if (habitRows.length === 0) return [];

  // One year of history is far more than any streak display needs, and small
  // enough to compute over in memory rather than in a recursive CTE.
  const entries = await getHabitEntries(addDays(today, -364));

  const byHabit = new Map<number, Set<string>>();
  for (const entry of entries) {
    const dates = byHabit.get(entry.habitId) ?? new Set<string>();
    dates.add(entry.date);
    byHabit.set(entry.habitId, dates);
  }

  const last30 = new Set(dateRange(today, 30));

  return habitRows.map((row) => {
    const id = Number(row.id);
    const dates = byHabit.get(id) ?? new Set<string>();

    return {
      id,
      name: String(row.name),
      doneToday: dates.has(today),
      streak: currentStreak(dates, today),
      last30: [...dates].filter((date) => last30.has(date)).length,
    };
  });
}

export type HabitEntry = { habitId: number; date: string };

export async function getHabitEntries(sinceISO: string): Promise<HabitEntry[]> {
  const sql = getSql();

  const rows = await sql`
    select habit_id, to_char(entry_date, 'YYYY-MM-DD') as entry_date
    from habit_entries
    where entry_date >= ${sinceISO}::date
  `;

  return rows.map((row) => ({ habitId: Number(row.habit_id), date: String(row.entry_date) }));
}

/**
 * Consecutive completed days counting back from today.
 *
 * Today not being done yet does not break the streak — the day is still in
 * progress — so counting starts at yesterday in that case.
 */
function currentStreak(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function toTask(row: Record<string, unknown>): Task {
  return {
    id: Number(row.id),
    title: String(row.title),
    notes: row.notes === null ? null : String(row.notes),
    priority: Number(row.priority) as Priority,
    dueDate: row.due_date === null ? null : String(row.due_date),
    completedOn: row.completed_on === null ? null : String(row.completed_on),
  };
}

export { todayISO };

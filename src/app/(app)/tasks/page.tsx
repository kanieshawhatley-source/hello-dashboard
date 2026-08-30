import Link from 'next/link';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { todayISO } from '@/lib/dates';
import { listTasks, type TaskFilter } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
];

function parseFilter(value: string | undefined): TaskFilter {
  return FILTERS.some((filter) => filter.value === value) ? (value as TaskFilter) : 'open';
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = parseFilter(searchParams.filter);
  const today = todayISO();
  const tasks = await listTasks(filter);

  return (
    <div className="stack">
      <h1>Tasks</h1>

      <section className="card">
        <div className="card-head">
          <h2>Add a task</h2>
        </div>
        <TaskForm defaultDueDate={today} />
      </section>

      <section className="card">
        <div className="card-head">
          <h2>
            {FILTERS.find((f) => f.value === filter)?.label} tasks
            <span className="tile-sub"> {tasks.length} shown</span>
          </h2>
          {/* Filters sit in one row above the list. */}
          <nav className="nav" aria-label="Filter tasks">
            {FILTERS.map((option) => (
              <Link
                key={option.value}
                href={`/tasks?filter=${option.value}`}
                aria-current={option.value === filter ? 'page' : undefined}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        <TaskList
          tasks={tasks}
          today={today}
          emptyMessage={
            filter === 'done' ? 'Nothing completed yet.' : 'No tasks here. Add one above.'
          }
        />
      </section>
    </div>
  );
}

import { deleteTask, setTaskCompletion } from '@/app/actions';
import { describeDueDate, formatShort } from '@/lib/dates';
import { PRIORITY_LABELS, type Task } from '@/lib/types';

export function TaskList({
  tasks,
  today,
  emptyMessage,
  showDelete = true,
}: {
  tasks: Task[];
  today: string;
  emptyMessage: string;
  showDelete?: boolean;
}) {
  if (tasks.length === 0) return <p className="empty">{emptyMessage}</p>;

  return (
    <ul className="item-list">
      {tasks.map((task) => {
        const done = task.completedOn !== null;
        const due = task.dueDate ? describeDueDate(task.dueDate, today) : null;

        return (
          <li className={`item${done ? ' is-done' : ''}`} key={task.id}>
            {/* Each action is its own form — forms cannot nest. */}
            <form action={setTaskCompletion}>
              <input type="hidden" name="id" value={task.id} />
              <input type="hidden" name="completed" value={done ? 'false' : 'true'} />
              <button
                className="check"
                data-checked={done}
                type="submit"
                aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
              >
                ✓
              </button>
            </form>

            <div className="item-main">
              <span className="item-title">{task.title}</span>
              <div className="item-meta">
                {task.priority !== 2 ? <span>{PRIORITY_LABELS[task.priority]}</span> : null}
                {due && !done ? (
                  <span
                    className={`badge${due.tone === 'overdue' ? ' is-overdue' : ''}${
                      due.tone === 'today' ? ' is-today' : ''
                    }`}
                  >
                    {due.tone !== 'upcoming' ? <span className="dot" /> : null}
                    {due.label}
                  </span>
                ) : null}
                {done ? <span>Done {formatShort(task.completedOn as string)}</span> : null}
                {task.notes ? <span>{task.notes}</span> : null}
              </div>
            </div>

            {showDelete ? (
              <form action={deleteTask}>
                <input type="hidden" name="id" value={task.id} />
                <button className="ghost" type="submit" aria-label={`Delete ${task.title}`}>
                  Delete
                </button>
              </form>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

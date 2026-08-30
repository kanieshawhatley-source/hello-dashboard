import { deleteHabit, toggleHabitToday } from '@/app/actions';
import type { Habit } from '@/lib/types';

export function HabitList({
  habits,
  emptyMessage,
  showDelete = true,
}: {
  habits: Habit[];
  emptyMessage: string;
  showDelete?: boolean;
}) {
  if (habits.length === 0) return <p className="empty">{emptyMessage}</p>;

  return (
    <ul className="item-list">
      {habits.map((habit) => (
        <li className={`item${habit.doneToday ? ' is-checked' : ''}`} key={habit.id}>
          <form action={toggleHabitToday}>
            <input type="hidden" name="id" value={habit.id} />
            <input type="hidden" name="done" value={habit.doneToday ? 'false' : 'true'} />
            <button
              className="check"
              data-checked={habit.doneToday}
              type="submit"
              aria-label={
                habit.doneToday ? `Undo ${habit.name} for today` : `Mark ${habit.name} done today`
              }
            >
              ✓
            </button>
          </form>

          <div className="item-main">
            <span className="item-title">{habit.name}</span>
            <div className="item-meta">
              <span>
                {habit.streak > 0
                  ? `${habit.streak} day streak`
                  : 'No streak yet'}
              </span>
              <span>{habit.last30} of the last 30 days</span>
            </div>
          </div>

          {showDelete ? (
            <form action={deleteHabit}>
              <input type="hidden" name="id" value={habit.id} />
              <button className="ghost" type="submit" aria-label={`Delete ${habit.name}`}>
                Delete
              </button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

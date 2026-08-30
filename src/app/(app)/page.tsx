import { CompletionsChart } from '@/components/CompletionsChart';
import { HabitHeatmap } from '@/components/HabitHeatmap';
import { HabitList } from '@/components/HabitList';
import { StatTile } from '@/components/StatTile';
import { TaskList } from '@/components/TaskList';
import { addDays, todayISO } from '@/lib/dates';
import {
  getCompletionsByDay,
  getHabitEntries,
  getTaskCounts,
  listHabits,
  listTodayTasks,
} from '@/lib/queries';

// The dashboard is a live read of the database, never a build-time snapshot.
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const today = todayISO();

  const [counts, completions, todayTasks, habits, entries] = await Promise.all([
    getTaskCounts(today),
    getCompletionsByDay(today, 14),
    listTodayTasks(today),
    listHabits(today),
    getHabitEntries(addDays(today, -120)),
  ]);

  const bestStreak = habits.reduce((best, habit) => Math.max(best, habit.streak), 0);
  const doneToday = habits.filter((habit) => habit.doneToday).length;

  return (
    <div className="stack">
      <h1>Overview</h1>

      <section className="grid grid-kpi" aria-label="Summary">
        <StatTile
          label="Open tasks"
          value={counts.open}
          sub={counts.overdue > 0 ? `${counts.overdue} overdue` : 'Nothing overdue'}
          tone={counts.overdue > 0 ? 'critical' : 'good'}
        />
        <StatTile label="Due today" value={counts.dueToday} sub="Tasks dated today" />
        <StatTile
          label="Done this week"
          value={counts.completedThisWeek}
          sub="Completed in the last 7 days"
        />
        <StatTile
          label="Best streak"
          value={bestStreak}
          sub={habits.length > 0 ? `${doneToday} of ${habits.length} habits done today` : 'No habits yet'}
        />
      </section>

      <section className="grid grid-charts">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Tasks completed</h2>
              <p>Last 14 days</p>
            </div>
          </div>
          <CompletionsChart data={completions} />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Habit consistency</h2>
              <p>Last 16 weeks</p>
            </div>
          </div>
          <HabitHeatmap entries={entries} habitCount={habits.length} today={today} />
        </div>
      </section>

      <section className="grid grid-charts">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Due now</h2>
              <p>Today and anything overdue</p>
            </div>
          </div>
          <TaskList
            tasks={todayTasks}
            today={today}
            emptyMessage="Nothing due. Enjoy it."
            showDelete={false}
          />
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Today&rsquo;s habits</h2>
              <p>Check them off as you go</p>
            </div>
          </div>
          <HabitList habits={habits} emptyMessage="No habits yet." showDelete={false} />
        </div>
      </section>
    </div>
  );
}

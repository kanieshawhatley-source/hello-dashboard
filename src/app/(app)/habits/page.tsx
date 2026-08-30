import { HabitForm } from '@/components/HabitForm';
import { HabitHeatmap } from '@/components/HabitHeatmap';
import { HabitList } from '@/components/HabitList';
import { addDays, todayISO } from '@/lib/dates';
import { getHabitEntries, listHabits } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HabitsPage() {
  const today = todayISO();
  const [habits, entries] = await Promise.all([
    listHabits(today),
    getHabitEntries(addDays(today, -120)),
  ]);

  return (
    <div className="stack">
      <h1>Habits</h1>

      <section className="card">
        <div className="card-head">
          <h2>Add a habit</h2>
        </div>
        <HabitForm />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Your habits</h2>
            <p>Checking one off logs it for today</p>
          </div>
        </div>
        <HabitList habits={habits} emptyMessage="No habits yet. Add one above." />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Consistency</h2>
            <p>Last 16 weeks across all habits</p>
          </div>
        </div>
        <HabitHeatmap entries={entries} habitCount={habits.length} today={today} />
      </section>
    </div>
  );
}

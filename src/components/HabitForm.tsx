import { createHabit } from '@/app/actions';

export function HabitForm() {
  return (
    <form action={createHabit} className="field-row">
      <label className="field field-grow">
        <span>Habit</span>
        <input
          type="text"
          name="name"
          placeholder="Something to do every day"
          required
          maxLength={200}
        />
      </label>
      <button className="primary" type="submit">
        Add
      </button>
    </form>
  );
}

import { createTask } from '@/app/actions';

export function TaskForm({ defaultDueDate }: { defaultDueDate?: string }) {
  return (
    <form action={createTask} className="field-row">
      <label className="field field-grow">
        <span>Task</span>
        <input type="text" name="title" placeholder="What needs doing?" required maxLength={200} />
      </label>

      <label className="field">
        <span>Priority</span>
        <select name="priority" defaultValue="2">
          <option value="1">High</option>
          <option value="2">Normal</option>
          <option value="3">Low</option>
        </select>
      </label>

      <label className="field">
        <span>Due</span>
        <input type="date" name="dueDate" defaultValue={defaultDueDate} />
      </label>

      <button className="primary" type="submit">
        Add
      </button>
    </form>
  );
}

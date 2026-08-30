import { addDays, formatShort, weekdayIndex } from '@/lib/dates';
import type { HabitEntry } from '@/lib/queries';

const WEEKS = 16;
const CELL = 20;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 30;
const TOP = 40;

const LEVEL_LABELS = ['None', 'A quarter', 'Half', 'Most', 'All'];

/**
 * Habit consistency over the last ~4 months.
 *
 * A grid comparing magnitude, so the color job is sequential: one hue, more is
 * darker. The four steps are the validated ordinal ramp in globals.css.
 */
export function HabitHeatmap({
  entries,
  habitCount,
  today,
}: {
  entries: HabitEntry[];
  habitCount: number;
  today: string;
}) {
  // Start on the Sunday on or before the first day of the window, so each
  // column is a whole calendar week and rows line up by weekday.
  const windowStart = addDays(today, -(WEEKS * 7 - 1));
  const start = addDays(windowStart, -weekdayIndex(windowStart));

  const dayCount = new Map<string, number>();
  for (const entry of entries) {
    dayCount.set(entry.date, (dayCount.get(entry.date) ?? 0) + 1);
  }

  const columns = Math.ceil((daysBetween(start, today) + 1) / 7);
  const width = LEFT + columns * STEP;
  const height = TOP + 7 * STEP;

  const cells: { date: string; count: number; level: number; column: number; row: number }[] = [];
  const monthLabels: { label: string; x: number }[] = [];

  for (let index = 0; index < columns * 7; index += 1) {
    const date = addDays(start, index);
    if (date > today) break;

    const column = Math.floor(index / 7);
    const row = index % 7;
    const count = dayCount.get(date) ?? 0;

    cells.push({ date, count, level: levelFor(count, habitCount), column, row });

    // One label per month, at the column where that month first appears.
    if (row === 0 && date.slice(8) <= '07') {
      monthLabels.push({
        label: new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
          month: 'short',
          timeZone: 'UTC',
        }),
        x: LEFT + column * STEP,
      });
    }
  }

  const activeDays = cells.filter((cell) => cell.count > 0).length;

  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Habit completions per day over the last ${WEEKS} weeks. ${activeDays} days with at least one habit completed.`}
      >
        {monthLabels.map((month) => (
          <text className="axis-label" key={`${month.label}-${month.x}`} x={month.x} y={TOP - 8}>
            {month.label}
          </text>
        ))}

        {[1, 3, 5].map((row) => (
          <text
            className="axis-label"
            key={row}
            x={LEFT - 7}
            y={TOP + row * STEP + CELL / 2 + 3}
            textAnchor="end"
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][row]}
          </text>
        ))}

        {cells.map((cell) => {
          const x = LEFT + cell.column * STEP;
          const y = TOP + cell.row * STEP;
          const tipX = Math.min(Math.max(x + CELL / 2, LEFT + 52), width - 52);

          return (
            <g className="bar-group" key={cell.date} tabIndex={0}>
              <rect
                className="cell"
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={`var(--level-${cell.level})`}
              />
              <g className="tip">
                <rect className="tip-box" x={tipX - 52} y={2} width={104} height={19} />
                <text className="tip-text" x={tipX} y={15.5}>
                  {formatShort(cell.date)} · {cell.count} of {habitCount}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <div className="legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            className="swatch"
            style={{ background: `var(--level-${level})` }}
            title={LEVEL_LABELS[level]}
          />
        ))}
        <span>More</span>
      </div>

      <details className="table-view">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Habits completed</th>
            </tr>
          </thead>
          <tbody>
            {cells
              .filter((cell) => cell.count > 0)
              .reverse()
              .map((cell) => (
                <tr key={cell.date}>
                  <td>{formatShort(cell.date)}</td>
                  <td>
                    {cell.count} of {habitCount}
                  </td>
                </tr>
              ))}
            {activeDays === 0 ? (
              <tr>
                <td colSpan={2}>No habits logged yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </details>
    </>
  );
}

/** Bucket a day's completions into the four ramp steps, 0 meaning none. */
function levelFor(count: number, habitCount: number): number {
  if (count === 0 || habitCount === 0) return 0;

  const ratio = count / habitCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio < 1) return 3;
  return 4;
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round(
    (Date.parse(`${toISO}T12:00:00Z`) - Date.parse(`${fromISO}T12:00:00Z`)) / 86_400_000,
  );
}

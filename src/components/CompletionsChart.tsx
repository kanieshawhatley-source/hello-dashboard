import { formatShort } from '@/lib/dates';
import type { DayCount } from '@/lib/types';

const WIDTH = 560;
const HEIGHT = 250;
const PAD = { top: 26, right: 6, bottom: 24, left: 26 };

/**
 * Tasks completed per day. One series, so it takes the sequential accent hue
 * and needs no legend — the card title names it.
 */
export function CompletionsChart({ data }: { data: DayCount[] }) {
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotHeight;

  const peak = Math.max(...data.map((d) => d.count), 1);
  const slot = plotWidth / data.length;
  // A 2px surface gap between adjacent bars, per the mark spec.
  const barWidth = Math.max(6, Math.min(26, slot - 6));

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Tasks completed per day over the last ${data.length} days. ${total} in total.`}
      >
        {/* Recessive axis: just the baseline and the peak. */}
        <line className="grid-line" x1={PAD.left} y1={baseline} x2={WIDTH - PAD.right} y2={baseline} />
        <line
          className="grid-line"
          x1={PAD.left}
          y1={PAD.top}
          x2={WIDTH - PAD.right}
          y2={PAD.top}
          strokeDasharray="2 3"
        />
        <text className="axis-label" x={PAD.left - 6} y={PAD.top + 4} textAnchor="end">
          {peak}
        </text>
        <text className="axis-label" x={PAD.left - 6} y={baseline + 4} textAnchor="end">
          0
        </text>

        {data.map((day, index) => {
          const center = PAD.left + slot * index + slot / 2;
          const height = (day.count / peak) * plotHeight;
          const x = center - barWidth / 2;
          const tipX = Math.min(Math.max(center, PAD.left + 44), WIDTH - PAD.right - 44);
          const isFirst = index === 0;
          const isLast = index === data.length - 1;

          return (
            <g className="bar-group" key={day.date} tabIndex={0}>
              {day.count > 0 ? (
                <path className="bar" d={roundedTopBar(x, baseline, barWidth, height, 4)} />
              ) : null}

              {/* Full-height target so the hover area is larger than the mark. */}
              <rect className="hit" x={center - slot / 2} y={PAD.top} width={slot} height={plotHeight} />

              {/* Direct labels only at the ends — never a number on every bar. */}
              {isFirst || isLast ? (
                <text className="axis-label" x={center} y={HEIGHT - 8} textAnchor="middle">
                  {formatShort(day.date)}
                </text>
              ) : null}

              <g className="tip">
                <rect className="tip-box" x={tipX - 44} y={2} width={88} height={19} />
                <text className="tip-text" x={tipX} y={15.5}>
                  {formatShort(day.date)} · {day.count}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <details className="table-view">
        <summary>View as table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Completed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date}>
                <td>{formatShort(day.date)}</td>
                <td>{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

/** A bar with only its top corners rounded, anchored to the baseline. */
function roundedTopBar(x: number, baseline: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height);
  const top = baseline - height;

  return [
    `M ${x} ${baseline}`,
    `L ${x} ${top + r}`,
    `Q ${x} ${top} ${x + r} ${top}`,
    `L ${x + width - r} ${top}`,
    `Q ${x + width} ${top} ${x + width} ${top + r}`,
    `L ${x + width} ${baseline}`,
    'Z',
  ].join(' ');
}

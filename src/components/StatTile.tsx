/**
 * A single headline number. A one-bar chart would say less than this does —
 * a lone current value is a stat tile, not a plot.
 */
export function StatTile({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'critical';
}) {
  return (
    <div className="card">
      <div className="tile-label">{label}</div>
      <div className="tile-value">{value}</div>
      {sub ? (
        <div className={`tile-sub${tone === 'neutral' ? '' : ` is-${tone}`}`}>{sub}</div>
      ) : null}
    </div>
  );
}

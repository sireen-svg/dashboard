export default function DocsStatsRow({ stats }) {
  return (
    <div className="docs-stats-row">
      {stats.map((stat) => (
        <div className="docs-stat-box" key={stat.label}>
          <div className="docs-stat-value">
            {stat.value}
            {stat.suffix && <span>{stat.suffix}</span>}
          </div>
          <div className="docs-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
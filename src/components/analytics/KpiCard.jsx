// Reusable KPI card for analytics sections. Built directly on the existing
// .stat-card / .stat-icon / .stat-value / .stat-label classes (index.css) so it
// looks identical to the stat cards already used on ProjectOverview.jsx — no new
// visual pattern is introduced, only a reusable wrapper around the existing one.
export default function KpiCard({
  icon,
  label,
  value,
  bg = "#e8f0fe",
  color = "#1a73e8",
  sub = null,
}) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body d-flex align-items-center gap-3 py-3 px-4">
        <div className="stat-icon" style={{ background: bg, color }}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {sub != null && <div className="analytics-kpi-sub">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

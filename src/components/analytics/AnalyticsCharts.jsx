import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Every recharts usage in the dashboard lives in this one file so the charting
// library is never imported anywhere else — keeps it easy to swap later if needed.

const CHART_TYPES = [
  { key: "line", icon: "bi-graph-up", title: "Line" },
  { key: "area", icon: "bi-bar-chart-steps", title: "Area" },
  { key: "bar", icon: "bi-bar-chart", title: "Bar" },
];

// Line / Area / Bar trend chart with a small toggle to switch between the three,
// as requested for Projects Growth and Content Growth.
export function TrendChart({
  data,
  height = 280,
  color = "#1a73e8",
  defaultType = "area",
  dataKey = "count",
}) {
  const [type, setType] = useState(defaultType);
  const rows = Array.isArray(data) ? data : [];

  return (
    <div>
      <div className="d-flex justify-content-end gap-1 mb-2">
        {CHART_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`analytics-chart-toggle ${type === t.key ? "active" : ""}`}
            onClick={() => setType(t.key)}
            title={t.title}
          >
            <i className={`bi ${t.icon}`}></i>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="analytics-chart-empty">
          No growth data for this range.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          {type === "line" ? (
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}

// Uses the project's own semantic palette (--fb-green/blue/yellow/orange/red) for
// the 5/4/3/2/1-star slices so it matches field-badge colors used elsewhere.
const DONUT_COLORS = ["#34a853", "#1a73e8", "#fbbc04", "#ff9800", "#ea4335"];

export function DonutDistribution({ rows, height = 220 }) {
  const data = (rows || []).filter((r) => r.count > 0);
  if (data.length === 0) {
    return <div className="analytics-chart-empty">No ratings yet.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="star"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {data.map((row, i) => (
            <Cell key={row.star} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => [
            value,
            `${item?.payload?.star} star`,
          ]}
        />
        <Legend formatter={(_value, entry) => `${entry?.payload?.star} star`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarDistribution({ rows }) {
  const list = rows || [];
  const max = Math.max(1, ...list.map((r) => r.count));
  return (
    <div className="d-flex flex-column gap-2">
      {list.map((r) => (
        <div key={r.star} className="d-flex align-items-center gap-2">
          <span className="analytics-star-label">
            {r.star} <i className="bi bi-star-fill"></i>
          </span>
          <div className="analytics-bar-track">
            <div
              className="analytics-bar-fill"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
          <span className="analytics-bar-count">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

import { Card, Form, Badge } from "react-bootstrap";
import { PERIODS } from "../../lib/analytics";

// Dashboard-level filters: date range, period, and a section picker. The section
// picker reuses the exact "clickable Badge as a toggle" pattern already used for
// languages/modules in ProjectSettings.jsx, instead of introducing a new
// multi-select dropdown component.
export default function AnalyticsFilters({
  filters,
  onChange,
  availableSections,
  disabled,
}) {
  const allSelected = filters.sections.length === 0;

  function toggleSection(key) {
    if (filters.sections.includes(key)) {
      onChange({ sections: filters.sections.filter((s) => s !== key) });
    } else {
      onChange({ sections: [...filters.sections, key] });
    }
  }

  return (
    <Card className="mb-4">
      <Card.Body className="p-3">
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <Form.Group>
            <Form.Label className="mb-1" style={{ fontSize: 12 }}>
              From
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => onChange({ from: e.target.value })}
              disabled={disabled}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="mb-1" style={{ fontSize: 12 }}>
              To
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => onChange({ to: e.target.value })}
              disabled={disabled}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="mb-1" style={{ fontSize: 12 }}>
              Period
            </Form.Label>
            <Form.Select
              size="sm"
              style={{ width: 160 }}
              value={filters.period}
              onChange={(e) => onChange({ period: e.target.value })}
              disabled={disabled}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>

        <div className="mt-3">
          <Form.Label className="mb-2 d-block" style={{ fontSize: 12 }}>
            Sections
          </Form.Label>
          <div className="d-flex flex-wrap gap-2">
            <Badge
              bg={allSelected ? "primary" : "light"}
              className={`analytics-section-badge ${allSelected ? "" : "text-dark border"} px-3 py-2`}
              style={{ cursor: "pointer" }}
              onClick={() => onChange({ sections: [] })}
            >
              All
            </Badge>
            {availableSections.map((s) => {
              const selected = filters.sections.includes(s.key);
              return (
                <Badge
                  key={s.key}
                  bg={selected ? "primary" : "light"}
                  className={`analytics-section-badge ${selected ? "" : "text-dark border"} px-3 py-2`}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSection(s.key)}
                >
                  {s.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

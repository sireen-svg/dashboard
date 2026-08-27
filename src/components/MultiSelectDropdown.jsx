import { useMemo, useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';

// Show a filter box only once the list is long enough that scanning it is work.
const FILTER_THRESHOLD = 8;

/**
 * A closed dropdown that toggles many options at once.
 *
 * react-bootstrap has no multi-select, and a native <select multiple> renders as
 * an always-open list box rather than a dropdown. So this is Dropdown with
 * autoClose="outside": clicking an option toggles it and the menu stays open,
 * which is what makes picking several in a row bearable.
 *
 * @param {{id:number|string,label:string}[]} options
 * @param {(number|string)[]} selected
 * @param {(next:(number|string)[]) => void} onChange
 */
export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  emptyText = 'Nothing to pick from yet.',
  disabled = false,
}) {
  const [filter, setFilter] = useState('');

  // Compare as strings: ids arrive as numbers today, but a Set lookup is
  // type-strict and would silently stop matching if an endpoint ever returned
  // them as strings. Values handed back to onChange keep their original type.
  const selectedSet = useMemo(() => new Set(selected.map(String)), [selected]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;

    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, filter]);

  // Name the picks while they still fit, then fall back to a count — a long
  // comma list would blow the toggle's width apart.
  const summary = useMemo(() => {
    const picked = options.filter((o) => selectedSet.has(String(o.id)));
    if (picked.length === 0) return placeholder;
    if (picked.length <= 2) return picked.map((o) => o.label).join(', ');

    return `${picked.length} selected`;
  }, [options, selectedSet, placeholder]);

  function toggle(id) {
    onChange(
      selectedSet.has(String(id))
        ? selected.filter((s) => String(s) !== String(id))
        : [...selected, id]
    );
  }

  return (
    <Dropdown autoClose="outside" className="w-100">
      <Dropdown.Toggle
        variant="outline-secondary"
        disabled={disabled}
        className="w-100 d-flex justify-content-between align-items-center text-start"
        style={{
          background: '#fff',
          borderColor: '#ced4da',
          color: selectedSet.size ? '#202124' : '#6c757d',
          fontWeight: 400,
        }}
      >
        <span className="text-truncate">{summary}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="w-100 p-0" style={{ maxHeight: 280, overflowY: 'auto' }}>
        {options.length >= FILTER_THRESHOLD && (
          <div className="p-2 border-bottom position-sticky top-0 bg-white" style={{ zIndex: 1 }}>
            <Form.Control
              size="sm"
              autoFocus
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}

        {options.length === 0 ? (
          <div className="px-3 py-2" style={{ fontSize: 13, color: '#5f6368' }}>
            {emptyText}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-3 py-2" style={{ fontSize: 13, color: '#5f6368' }}>
            No match for “{filter}”.
          </div>
        ) : (
          visible.map((opt) => (
            <div key={opt.id} className="px-3 py-1">
              <Form.Check
                type="checkbox"
                id={`msd-${opt.id}`}
                label={opt.label}
                checked={selectedSet.has(String(opt.id))}
                onChange={() => toggle(opt.id)}
              />
            </div>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}

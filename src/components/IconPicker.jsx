import { useMemo, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';

// The clinic renders these through lucide's DynamicIcon, so the stored value is just
// the lucide name ("heart-pulse"). Showing all ~2000 at once is unusable and would
// trigger a lazy chunk fetch each, so results are capped until the search narrows them.
const RESULT_LIMIT = 60;

// Reserve the glyph's space while its chunk loads, so the grid doesn't reflow.
function IconSkeleton() {
  return <span style={{ display: 'inline-block', width: 22, height: 22 }} />;
}

function rankMatches(names, query) {
  const q = query.trim().toLowerCase().replace(/\s+/g, '-');
  if (!q) return names;

  const starts = [];
  const contains = [];
  for (const name of names) {
    if (name === q || name.startsWith(q)) starts.push(name);
    else if (name.includes(q)) contains.push(name);
  }
  return starts.concat(contains);
}

export default function IconPicker({ value, onChange, name, options }) {
  const [query, setQuery] = useState('');

  // The field stores its own option list, so an existing field keeps offering exactly
  // the icons it was created with. Falls back to the installed lucide set.
  const names = useMemo(
    () => (Array.isArray(options) && options.length > 0 ? options : iconNames),
    [options],
  );

  const matches = useMemo(() => rankMatches(names, query), [names, query]);
  const shown = matches.slice(0, RESULT_LIMIT);

  const selected = typeof value === 'string' ? value : '';
  const isKnown = selected !== '' && names.includes(selected);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-2">
        <Form.Control
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${names.length} icons — try "heart", "calendar"`}
        />
        {selected && (
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            onClick={() => onChange('')}
            title="Clear the selected icon"
          >
            Clear
          </Button>
        )}
      </div>

      {selected && (
        <div
          className="d-flex align-items-center gap-2 p-2 rounded mb-2"
          style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}
        >
          {isKnown ? (
            <DynamicIcon name={selected} size={22} fallback={IconSkeleton} />
          ) : (
            <span style={{ fontSize: 18 }}>⚠️</span>
          )}
          <code style={{ fontSize: 13 }}>{selected}</code>
          {!isKnown && (
            <span style={{ fontSize: 12, color: '#d93025' }}>
              not a lucide icon — the site will fall back to its default
            </span>
          )}
        </div>
      )}

      <div
        className="d-flex flex-wrap gap-1 p-2 rounded"
        style={{ border: '1px solid #e8eaed', maxHeight: 220, overflowY: 'auto' }}
      >
        {shown.length === 0 && (
          <span style={{ fontSize: 13, color: '#5f6368' }}>
            No icon matches “{query}”.
          </span>
        )}
        {shown.map((iconName) => {
          const active = iconName === selected;
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              title={iconName}
              aria-label={iconName}
              aria-pressed={active}
              className="d-flex align-items-center justify-content-center rounded"
              style={{
                width: 38,
                height: 38,
                background: active ? '#e8f0fe' : '#fff',
                border: `1px solid ${active ? '#1a73e8' : '#e8eaed'}`,
                color: active ? '#1a73e8' : '#3c4043',
                cursor: 'pointer',
              }}
            >
              <DynamicIcon name={iconName} size={20} fallback={IconSkeleton} />
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: '#5f6368' }} className="mt-1">
        {matches.length > shown.length
          ? `Showing ${shown.length} of ${matches.length} — keep typing to narrow.`
          : `${matches.length} icon${matches.length === 1 ? '' : 's'}`}
        {name ? ` · stored in "${name}" as the icon name` : ''}
      </div>
    </div>
  );
}

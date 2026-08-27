import { useState, useEffect } from 'react';
import { Card, Spinner, Table } from 'react-bootstrap';
import { getPlatformAuditLogs } from '../../api/platform';
import { getApiError } from '../../lib/utils';

function fmt(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleString('en', { dateStyle: 'short', timeStyle: 'medium' });
}

function jsonPreview(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * old_values → new_values for one audited change. Rendered as a stacked pair
 * rather than a per-field diff: the payloads are free-form JSON, so their keys
 * are not guaranteed to line up.
 */
function ChangeCell({ oldValues, newValues }) {
  const before = jsonPreview(oldValues);
  const after = jsonPreview(newValues);

  if (!before && !after) {
    return <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>—</span>;
  }

  return (
    <div className="d-flex flex-column gap-1" style={{ maxWidth: 420 }}>
      {before && (
        <pre
          className="mb-0"
          style={{
            fontSize: 11,
            padding: '6px 8px',
            borderRadius: 4,
            background: 'var(--fb-red-bg)',
            color: 'var(--fb-red)',
            maxHeight: 120,
            overflow: 'auto',
          }}
        >
          {before}
        </pre>
      )}
      {after && (
        <pre
          className="mb-0"
          style={{
            fontSize: 11,
            padding: '6px 8px',
            borderRadius: 4,
            background: 'var(--fb-green-bg)',
            color: 'var(--fb-green)',
            maxHeight: 120,
            overflow: 'auto',
          }}
        >
          {after}
        </pre>
      )}
    </div>
  );
}

export default function AuditTrailPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlatformAuditLogs();
      setPayload(res.data);
    } catch (e) {
      setError(getApiError(e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }

  // The loading flag is flipped inside load(), which the rule sees as a
  // synchronous setState. That is the intended shape for a data fetch (and what
  // every other list page here does) — the advisory is about derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const unavailable = payload && payload.available === false;
  // /audit-logs answers with a bare array, not a paginator.
  const rows = Array.isArray(payload?.result)
    ? payload.result
    : (payload?.result?.data ?? []);

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Audit trail</h2>
          <p className="page-subtitle">
            The 50 most recent audited changes, with the before and after payload.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {unavailable && (
        <div
          className="alert d-flex align-items-start gap-3 search-enter"
          style={{
            background: 'var(--fb-red-bg)',
            border: '1px solid var(--fb-red)',
            borderRadius: 'var(--fb-radius)',
            padding: '16px 20px',
          }}
        >
          <i className="bi bi-plug-fill fs-4 flex-shrink-0" style={{ color: 'var(--fb-red)', marginTop: 2 }}></i>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fb-red)' }}>
              The Logging Service is not responding
            </div>
            {payload.error && (
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--fb-red)', marginTop: 8 }}>
                {payload.error}
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && !unavailable && (
        <Card className="search-enter">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: 'var(--fb-body-bg)' }}>
                <tr>
                  {['Occurred', 'Module', 'Entity', 'By', 'Change'].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 11,
                        color: 'var(--fb-text-secondary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                        padding: '10px 16px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No audited changes recorded yet.
                    </td>
                  </tr>
                ) : rows.map((row) => (
                  <tr key={row.event_id ?? row.id}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmt(row.occurred_at)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: 'var(--fb-body-bg)',
                          color: 'var(--fb-text-secondary)',
                        }}
                      >
                        {row.module}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 500 }}>
                      {row.entity_type}
                      {row.entity_id ? ` #${row.entity_id}` : ''}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {row.user_id ?? 'system'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <ChangeCell oldValues={row.old_values} newValues={row.new_values} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

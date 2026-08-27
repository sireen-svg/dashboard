import { useState, useEffect } from 'react';
import { Card, Spinner, Row, Col, Table, Form, InputGroup } from 'react-bootstrap';
import { getPlatformLogs } from '../../api/platform';
import { getApiError } from '../../lib/utils';

const MODULES = ['auth', 'cms', 'ecommerce', 'booking', 'notification'];

const MODULE_COLOR = {
  auth: { bg: 'var(--fb-purple-bg)', color: 'var(--fb-purple)' },
  cms: { bg: 'var(--fb-blue-bg)', color: 'var(--fb-blue)' },
  ecommerce: { bg: 'var(--fb-green-bg)', color: 'var(--fb-green)' },
  booking: { bg: 'var(--fb-orange-bg)', color: 'var(--fb-orange)' },
  notification: { bg: 'var(--fb-yellow-bg)', color: 'var(--fb-yellow)' },
};

function fmt(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleString('en', { dateStyle: 'short', timeStyle: 'medium' });
}

function Badge({ text, palette }) {
  const p = palette ?? { bg: 'var(--fb-body-bg)', color: 'var(--fb-text-secondary)' };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 100,
        background: p.bg,
        color: p.color,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

// metadata is a JSON column; render it as compact JSON rather than [object Object].
function metaPreview(metadata) {
  if (metadata === null || metadata === undefined) return '—';
  if (typeof metadata === 'string') return metadata;
  try {
    return JSON.stringify(metadata);
  } catch {
    return String(metadata);
  }
}

export default function PlatformLogsPage() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);

  const [module, setModule] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventTypeInput, setEventTypeInput] = useState('');
  const [userId, setUserId] = useState('');
  const [appliedUserId, setAppliedUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (module) params.module = module;
      if (eventType) params.event_type = eventType;
      if (appliedUserId) params.user_id = appliedUserId;
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await getPlatformLogs(params);
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
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, module, eventType, appliedUserId, from, to]);

  // The CMS reports an unreachable Logging Service as available:false rather
  // than failing the request, so that case is rendered, not thrown.
  const unavailable = payload && payload.available === false;
  const result = payload?.result;
  const logs = result?.data ?? [];

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Event logs</h2>
          <p className="page-subtitle">
            The platform-wide event stream collected by the Logging Service.
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
            <div style={{ fontSize: 13, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
              Events are still being produced — they just cannot be read right now.
            </div>
            {payload.error && (
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--fb-red)', marginTop: 8 }}>
                {payload.error}
              </div>
            )}
          </div>
        </div>
      )}

      {!unavailable && result && (
        <Row className="g-3 mb-4">
          {[
            { label: 'Total events', value: result.total ?? '—', accent: 'accent-blue', icon: 'bi-journals' },
            { label: 'Per page', value: result.per_page ?? '—', accent: 'accent-cyan', icon: 'bi-file-earmark' },
            {
              label: 'Page',
              value: result.last_page ? `${result.current_page} / ${result.last_page}` : '—',
              accent: 'accent-purple',
              icon: 'bi-layers',
            },
          ].map((s, i) => (
            <Col key={s.label} xs={6} md={3}>
              <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 40}ms` }}>
                <Card.Body className={`p-3 ${s.accent}`}>
                  <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                  <div className="search-stat-value">{s.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card className="mb-3 search-enter">
        <Card.Body className="p-3">
          <div className="d-flex gap-2 flex-wrap align-items-end">
            <Form.Select
              size="sm"
              value={module}
              onChange={(e) => { setModule(e.target.value); setPage(1); }}
              style={{ width: 160 }}
            >
              <option value="">All modules</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </Form.Select>
            <InputGroup size="sm" style={{ flex: '1 1 180px', maxWidth: 220 }}>
              <InputGroup.Text style={{ background: 'transparent' }}>
                <i className="bi bi-lightning" style={{ fontSize: 12 }}></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Event type…"
                value={eventTypeInput}
                onChange={(e) => setEventTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setPage(1); setEventType(eventTypeInput.trim()); }
                }}
              />
            </InputGroup>
            <InputGroup size="sm" style={{ flex: '0 1 150px' }}>
              <InputGroup.Text style={{ background: 'transparent' }}>
                <i className="bi bi-person" style={{ fontSize: 12 }}></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="User ID…"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setPage(1); setAppliedUserId(userId.trim()); }
                }}
              />
            </InputGroup>
            <div>
              <Form.Label style={{ fontSize: 11, marginBottom: 2, color: 'var(--fb-text-secondary)' }}>From</Form.Label>
              <Form.Control
                size="sm" type="date" value={from}
                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                style={{ width: 150 }}
              />
            </div>
            <div>
              <Form.Label style={{ fontSize: 11, marginBottom: 2, color: 'var(--fb-text-secondary)' }}>To</Form.Label>
              <Form.Control
                size="sm" type="date" value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                style={{ width: 150 }}
              />
            </div>
            {(module || eventType || appliedUserId || from || to) && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setModule(''); setEventType(''); setEventTypeInput('');
                  setUserId(''); setAppliedUserId(''); setFrom(''); setTo(''); setPage(1);
                }}
              >
                <i className="bi bi-x-lg me-1"></i>Clear
              </button>
            )}
          </div>
        </Card.Body>
      </Card>

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
                  {['Occurred', 'Module', 'Event', 'User', 'Entity', 'Project', 'Metadata'].map((h) => (
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
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No events match this filter.
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log.event_id ?? log.id}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmt(log.occurred_at)}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Badge text={log.module} palette={MODULE_COLOR[log.module]} />
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 500 }}>
                      {log.event_type}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {log.user_id ?? 'system'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {log.entity_type ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ''}` : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {log.project_id ? `#${log.project_id}` : '—'}
                    </td>
                    <td
                      style={{
                        padding: '10px 16px',
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: 'var(--fb-text-secondary)',
                        maxWidth: 260,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={metaPreview(log.metadata)}
                    >
                      {metaPreview(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
          {result && result.last_page > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--fb-text-secondary)' }}>{result.total} total events</span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left me-1"></i>Prev
                </button>
                <span className="btn btn-sm btn-light disabled" style={{ fontFamily: 'monospace' }}>
                  {result.current_page} / {result.last_page}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page >= result.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next<i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
            </Card.Footer>
          )}
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, Spinner, Row, Col, Table } from 'react-bootstrap';
import { getSystemHealth } from '../../api/platform';
import { getApiError } from '../../lib/utils';
import { statusStyle } from '../../lib/health';

function ComponentTable({ title, icon, rows, emptyText, showHttp }) {
  return (
    <Card className="h-100 search-enter">
      <Card.Body className="p-0">
        <div className="config-card-title p-3 mb-0">
          <i className={`bi ${icon}`}></i>{title}
        </div>
        <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
          <thead style={{ background: 'var(--fb-body-bg)' }}>
            <tr>
              {['Component', 'Status', showHttp ? 'HTTP' : null, 'Latency', 'Detail']
                .filter(Boolean)
                .map((h) => (
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
                <td colSpan={showHttp ? 5 : 4} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                  {emptyText}
                </td>
              </tr>
            ) : rows.map((c) => {
              const s = statusStyle(c.status);
              return (
                <tr key={c.key}>
                  <td style={{ padding: '10px 16px', fontWeight: 500 }}>{c.label}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 100,
                        background: s.bg,
                        color: s.color,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <i className={`bi ${s.icon} me-1`} style={{ fontSize: 10 }}></i>
                      {s.label}
                    </span>
                  </td>
                  {showHttp && (
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {c.http_status ?? '—'}
                    </td>
                  )}
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                    {c.latency_ms != null ? `${c.latency_ms} ms` : '—'}
                  </td>
                  <td
                    style={{
                      padding: '10px 16px',
                      fontSize: 12,
                      color: c.error ? 'var(--fb-red)' : 'var(--fb-text-secondary)',
                      maxWidth: 320,
                    }}
                  >
                    {c.error || 'Responding normally'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getSystemHealth();
      setHealth(res.data?.data ?? res.data);
      setCheckedAt(new Date());
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  // The loading flag is flipped inside load(), which the rule sees as a
  // synchronous setState. That is the intended shape for a data fetch (and what
  // every other list page here does) — the advisory is about derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const summary = health?.summary;

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>System health</h2>
          <p className="page-subtitle">
            Live probe of every HyperCore service and this service's backing stores.
            {checkedAt && ` Last checked ${checkedAt.toLocaleTimeString('en')}.`}
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Re-check
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && health && (
        <>
          <Row className="g-3 mb-4">
            {[
              { label: 'Components', value: summary?.total ?? 0, accent: 'accent-blue', icon: 'bi-diagram-3' },
              {
                label: 'Healthy', value: summary?.up ?? 0, accent: 'accent-green',
                icon: 'bi-check-circle', color: 'var(--fb-green)',
              },
              {
                label: 'Failing', value: summary?.down ?? 0, accent: 'accent-red',
                icon: 'bi-exclamation-octagon',
                color: (summary?.down ?? 0) > 0 ? 'var(--fb-red)' : 'var(--fb-green)',
              },
            ].map((s, i) => (
              <Col key={s.label} xs={6} md={3}>
                <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 40}ms` }}>
                  <Card.Body className={`p-3 ${s.accent}`}>
                    <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                    <div className="search-stat-value" style={{ color: s.color }}>{s.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-3">
            <Col xs={12}>
              <ComponentTable
                title="Services"
                icon="bi-hdd-network"
                rows={health.services ?? []}
                emptyText="No services are configured for health probing."
                showHttp
              />
            </Col>
            <Col xs={12}>
              <ComponentTable
                title="CMS dependencies"
                icon="bi-database"
                rows={health.dependencies ?? []}
                emptyText="No dependency probes ran."
              />
            </Col>
          </Row>

          <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginTop: 16 }}>
            <i className="bi bi-info-circle me-1"></i>
            The CMS is not in this list — the probe runs inside it, so it is
            necessarily reachable. Its database, cache and Redis are checked
            under dependencies. Service latency is the shared elapsed time of
            the pooled probe, not a per-service round trip.
          </div>
        </>
      )}
    </div>
  );
}

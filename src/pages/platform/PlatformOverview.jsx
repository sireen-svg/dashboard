import { useState, useEffect } from 'react';
import { Card, Spinner, Row, Col, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getPlatformOverview, getSystemHealth } from '../../api/platform';
import { getApiError } from '../../lib/utils';
import HealthPill from './HealthPill';

function num(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en');
}

export default function PlatformOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Health is fetched alongside but must not sink the page: a probe that
      // times out is information, not a failure of the overview.
      const [overviewRes, healthRes] = await Promise.allSettled([
        getPlatformOverview(),
        getSystemHealth(),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setData(overviewRes.value.data?.data ?? overviewRes.value.data);
      } else {
        setError(getApiError(overviewRes.reason));
      }

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value.data?.data ?? healthRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  }

  // The loading flag is flipped inside load(), which the rule sees as a
  // synchronous setState. That is the intended shape for a data fetch (and what
  // every other list page here does) — the advisory is about derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const projects = data?.projects;
  const content = data?.content;
  const subs = data?.subscriptions;
  const revenue = data?.revenue;
  const components = [
    ...(health?.services ?? []),
    ...(health?.dependencies ?? []),
  ];
  const down = components.filter((c) => c.status !== 'up');

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Platform overview</h2>
          <p className="page-subtitle">
            Every project, tenant and service on this HyperCore installation.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* Anything unhealthy leads, before the vanity numbers. */}
          {health && (
            <div
              className="alert d-flex align-items-start gap-3 mb-4 search-enter"
              style={{
                background: down.length === 0 ? 'var(--fb-green-bg)' : 'var(--fb-red-bg)',
                border: `1px solid ${down.length === 0 ? 'var(--fb-green)' : 'var(--fb-red)'}`,
                borderRadius: 'var(--fb-radius)',
                padding: '16px 20px',
              }}
            >
              <i
                className={`bi ${down.length === 0 ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill'} fs-4 flex-shrink-0`}
                style={{ color: down.length === 0 ? 'var(--fb-green)' : 'var(--fb-red)', marginTop: 2 }}
              ></i>
              <div className="flex-grow-1">
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: down.length === 0 ? 'var(--fb-green)' : 'var(--fb-red)',
                  }}
                >
                  {down.length === 0
                    ? `All ${health.summary?.total ?? components.length} components healthy`
                    : `${down.length} of ${health.summary?.total ?? components.length} components need attention`}
                </div>
                {down.length > 0 && (
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {down.map((c) => <HealthPill key={c.key} component={c} />)}
                  </div>
                )}
                <Link to="/platform/health" style={{ fontSize: 12 }} className="d-inline-block mt-2">
                  Open system health<i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          )}

          <Row className="g-3 mb-4">
            {[
              { label: 'Projects', value: num(projects?.total), accent: 'accent-blue', icon: 'bi-folder' },
              { label: 'Project owners', value: num(projects?.owners), accent: 'accent-cyan', icon: 'bi-person-badge' },
              { label: 'New (30d)', value: num(projects?.created_last_30_days), accent: 'accent-green', icon: 'bi-graph-up-arrow' },
              { label: 'Data types', value: num(content?.data_types), accent: 'accent-purple', icon: 'bi-table' },
              { label: 'Entries', value: num(content?.entries), accent: 'accent-orange', icon: 'bi-file-earmark-text' },
            ].map((s, i) => (
              <Col key={s.label} xs={6} md>
                <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 35}ms` }}>
                  <Card.Body className={`p-3 ${s.accent}`}>
                    <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                    <div className="search-stat-value">{s.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="g-3">
            <Col md={4}>
              <Card className="h-100 search-enter">
                <Card.Body className="p-3">
                  <div className="config-card-title"><i className="bi bi-puzzle"></i>Modules in use</div>
                  {Object.keys(projects?.by_module ?? {}).length === 0 ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      No project has enabled a module yet.
                    </div>
                  ) : (
                    <Table borderless size="sm" className="mb-0" style={{ fontSize: 13 }}>
                      <tbody>
                        {Object.entries(projects.by_module).map(([module, count]) => (
                          <tr key={module}>
                            <td style={{ padding: '4px 0', textTransform: 'capitalize' }}>{module}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                              {num(count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                  {projects?.trashed > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginTop: 10 }}>
                      <i className="bi bi-trash me-1"></i>
                      {num(projects.trashed)} project(s) in the trash
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 search-enter">
                <Card.Body className="p-3">
                  <div className="config-card-title"><i className="bi bi-credit-card"></i>Subscriptions</div>
                  <div className="d-flex align-items-baseline gap-2 mb-2">
                    <span className="search-stat-value">{num(subs?.total)}</span>
                    <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      across {num(subs?.plans)} plan(s)
                    </span>
                  </div>
                  {Object.keys(subs?.by_status ?? {}).length === 0 ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      Nobody has subscribed on this platform yet.
                    </div>
                  ) : (
                    <Table borderless size="sm" className="mb-0" style={{ fontSize: 13 }}>
                      <tbody>
                        {Object.entries(subs.by_status).map(([status, count]) => (
                          <tr key={status}>
                            <td style={{ padding: '4px 0' }}>{status.replace('_', ' ')}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                              {num(count)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 search-enter">
                <Card.Body className="p-3">
                  <div className="config-card-title"><i className="bi bi-cash-coin"></i>Paid revenue</div>
                  {revenue?.available === false ? (
                    <div style={{ fontSize: 13, color: 'var(--fb-orange)' }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Payment data could not be read.
                    </div>
                  ) : (revenue?.by_currency ?? []).length === 0 ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      No settled payments yet.
                    </div>
                  ) : (
                    <Table borderless size="sm" className="mb-0" style={{ fontSize: 13 }}>
                      <tbody>
                        {revenue.by_currency.map((row) => (
                          <tr key={row.currency}>
                            <td style={{ padding: '4px 0', fontFamily: 'monospace' }}>{row.currency}</td>
                            <td style={{ padding: '4px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                              {Number(row.total).toFixed(2)}
                            </td>
                            <td style={{ padding: '4px 0', textAlign: 'right', fontSize: 11, color: 'var(--fb-text-secondary)' }}>
                              ×{num(row.payments)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

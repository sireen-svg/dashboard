import { useState, useEffect } from 'react';
import { Card, Spinner, Row, Col, Table, Form, InputGroup } from 'react-bootstrap';
import { getAllProjects } from '../../api/platform';
import { getApiError } from '../../lib/utils';

const MODULES = ['booking', 'ecommerce'];

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString('en', { dateStyle: 'medium' });
}

export default function AllProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [includeTrashed, setIncludeTrashed] = useState(false);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25 };
      if (search) params.search = search;
      if (module) params.module = module;
      if (includeTrashed) params.include_trashed = true;
      const res = await getAllProjects(params);
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  // The loading flag is flipped inside load(), which the rule sees as a
  // synchronous setState. That is the intended shape for a data fetch (and what
  // every other list page here does) — the advisory is about derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, search, module, includeTrashed]);

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>All projects</h2>
          <p className="page-subtitle">
            Every project on the platform, across all owners — the operator view.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {meta && (
        <Row className="g-3 mb-4">
          {[
            { label: 'Projects', value: meta.total, accent: 'accent-blue', icon: 'bi-folder' },
            {
              label: 'On this page', value: rows.length, accent: 'accent-cyan', icon: 'bi-list-ul',
            },
            {
              label: 'Entries (page)',
              value: rows.reduce((sum, p) => sum + (p.entries_count ?? 0), 0),
              accent: 'accent-orange',
              icon: 'bi-file-earmark-text',
            },
            {
              label: 'Subscribers (page)',
              value: rows.reduce((sum, p) => sum + (p.subscriptions_count ?? 0), 0),
              accent: 'accent-purple',
              icon: 'bi-credit-card',
            },
          ].map((s, i) => (
            <Col key={s.label} xs={6} md={3}>
              <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 40}ms` }}>
                <Card.Body className={`p-3 ${s.accent}`}>
                  <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                  <div className="search-stat-value">{Number(s.value).toLocaleString('en')}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card className="mb-3 search-enter">
        <Card.Body className="p-3">
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <InputGroup size="sm" style={{ flex: '1 1 220px', maxWidth: 320 }}>
              <InputGroup.Text style={{ background: 'transparent' }}>
                <i className="bi bi-search" style={{ fontSize: 12 }}></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Name, slug or project key…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setPage(1); setSearch(searchInput.trim()); }
                }}
              />
            </InputGroup>
            <Form.Select
              size="sm"
              value={module}
              onChange={(e) => { setModule(e.target.value); setPage(1); }}
              style={{ width: 175 }}
            >
              <option value="">All modules</option>
              {MODULES.map((m) => (
                <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m}</option>
              ))}
            </Form.Select>
            <Form.Check
              type="switch"
              id="include-trashed"
              label="Include trashed"
              checked={includeTrashed}
              onChange={(e) => { setIncludeTrashed(e.target.checked); setPage(1); }}
              style={{ fontSize: 13 }}
            />
            {(search || module || includeTrashed) && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setSearchInput(''); setSearch(''); setModule('');
                  setIncludeTrashed(false); setPage(1);
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

      {!loading && (
        <Card className="search-enter">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: 'var(--fb-body-bg)' }}>
                <tr>
                  {['Project', 'Owner', 'Modules', 'Types', 'Entries', 'Subs', 'Created'].map((h) => (
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
                    <td colSpan={7} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No projects match this filter.
                    </td>
                  </tr>
                ) : rows.map((p) => (
                  <tr key={p.id} style={{ opacity: p.deleted_at ? 0.55 : 1 }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 500 }}>
                        {p.name}
                        {p.deleted_at && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 100,
                              background: 'var(--fb-red-bg)',
                              color: 'var(--fb-red)',
                              marginLeft: 8,
                            }}
                          >
                            trashed
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--fb-text-secondary)' }}>
                        {p.slug}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      #{p.owner_id}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {(p.enabled_modules ?? []).length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>—</span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1">
                          {p.enabled_modules.map((m) => (
                            <span
                              key={m}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 100,
                                background: 'var(--fb-blue-bg)',
                                color: 'var(--fb-blue)',
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{p.data_types_count ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{p.entries_count ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{p.subscriptions_count ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtDate(p.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
          {meta && meta.last_page > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--fb-text-secondary)' }}>{meta.total} total projects</span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left me-1"></i>Prev
                </button>
                <span className="btn btn-sm btn-light disabled" style={{ fontFamily: 'monospace' }}>
                  {meta.current_page} / {meta.last_page}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page >= meta.last_page}
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

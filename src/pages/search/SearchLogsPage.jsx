import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Table, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { getSearchLogs } from '../../api/search';

const INTENT_CLASS = { transactional: 'intent-transactional', informational: 'intent-informational', service: 'intent-service' };

function fmt(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' });
}

export default function SearchLogsPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [intent, setIntent]   = useState('');
  const [lang, setLang]       = useState('');
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);

  useEffect(() => { load(); }, [filter, intent, lang, page]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: 50, filter };
      if (search) params.search = search;
      if (intent) params.intent = intent;
      if (lang)   params.language = lang;
      const res = await getSearchLogs(params);
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load logs.');
    } finally { setLoading(false); }
  }

  const logs       = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Search logs</h2>
          <p className="page-subtitle">Full history of search queries with intent and result data.</p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {/* Stats */}
      {data && (
        <Row className="g-3 mb-4">
          {[
            { label: 'Total logs',      value: pagination?.total ?? '—',              accent: 'accent-blue',   icon: 'bi-journals' },
            { label: 'Execution time',  value: `${data.execution_time_ms ?? 0} ms`,
              accent: 'accent-green', icon: 'bi-lightning',
              color: (data.execution_time_ms ?? 0) < 500 ? 'var(--fb-green)' : (data.execution_time_ms ?? 0) < 1500 ? 'var(--fb-orange)' : 'var(--fb-red)' },
            { label: 'Current page',    value: pagination ? `${pagination.page} / ${pagination.pages}` : '—', accent: 'accent-cyan',   icon: 'bi-file-earmark' },
          ].map((s, i) => (
            <Col key={s.label} xs={6} md={3}>
              <Card className={`search-stat-card search-enter h-100`} style={{ animationDelay: `${i * 40}ms` }}>
                <Card.Body className={`p-3 ${s.accent}`}>
                  <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                  <div className="search-stat-value" style={{ color: s.color }}>{s.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filter bar */}
      <Card className="mb-3 search-enter">
        <Card.Body className="p-3">
          <div className="d-flex gap-2 flex-wrap align-items-end">
            <InputGroup size="sm" style={{ flex: '1 1 200px', maxWidth: 280 }}>
              <InputGroup.Text style={{ background: 'transparent' }}><i className="bi bi-search" style={{ fontSize: 12 }}></i></InputGroup.Text>
              <Form.Control placeholder="Search keyword..." value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (setPage(1), load())} />
            </InputGroup>
            <Form.Select size="sm" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} style={{ width: 170 }}>
              <option value="all">All results</option>
              <option value="zero_results">Zero results only</option>
            </Form.Select>
            <Form.Select size="sm" value={intent} onChange={e => { setIntent(e.target.value); setPage(1); }} style={{ width: 165 }}>
              <option value="">All intents</option>
              <option value="transactional">Transactional</option>
              <option value="informational">Informational</option>
              <option value="service">Service</option>
            </Form.Select>
            <Form.Select size="sm" value={lang} onChange={e => { setLang(e.target.value); setPage(1); }} style={{ width: 130 }}>
              <option value="">All languages</option>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {loading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>}

      {!loading && (
        <Card className="search-enter">
          <Card.Body className="p-0">
            <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: 'var(--fb-body-bg)' }}>
                <tr>
                  {['Keyword', 'Lang', 'Results', 'Intent', 'Confidence', 'User', 'Searched at'].map(h => (
                    <th key={h} style={{ fontSize: 11, color: 'var(--fb-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 16px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-5" style={{ fontSize: 13 }}>No logs found for this filter.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>{log.keyword}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>{log.language}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: log.results_count === 0 ? 'var(--fb-red)' : 'var(--fb-text-primary)' }}>
                      {log.results_count}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={`intent-badge ${INTENT_CLASS[log.detected_intent] ?? 'intent-unknown'}`}>{log.detected_intent}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>{log.intent_confidence}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)' }}>{log.user_id ?? 'Guest'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>{fmt(log.searched_at)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
          {pagination && pagination.pages > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--fb-text-secondary)' }}>{pagination.total} total entries</span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <i className="bi bi-chevron-left me-1"></i>Prev
                </button>
                <span className="btn btn-sm btn-light disabled" style={{ fontFamily: 'monospace' }}>{page} / {pagination.pages}</span>
                <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
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

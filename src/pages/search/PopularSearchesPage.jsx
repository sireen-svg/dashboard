import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table, Form } from 'react-bootstrap';
import { getPopularSearches } from '../../api/search';

const INTENT_CLASS = {
  transactional: 'intent-transactional',
  informational: 'intent-informational',
  service:       'intent-service',
};

export default function PopularSearchesPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [lang, setLang]       = useState('en');
  const [window_, setWindow_] = useState('30d');
  const [type, setType]       = useState('both');

  useEffect(() => { load(); }, [lang, window_, type]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await getPopularSearches({ lang, window: window_, type, limit: 10 });
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load popular searches.');
    } finally { setLoading(false); }
  }

  const keywords = data?.keywords ?? [];
  const maxCount = Math.max(...keywords.map(k => k.count), 1);

  const stats = [
    { label: 'Total searches',  value: data?.total_searches ?? '—', accent: 'accent-blue',   icon: 'bi-search' },
    { label: 'Unique keywords', value: keywords.length,              accent: 'accent-cyan',   icon: 'bi-tag' },
    { label: 'Top keyword',     value: keywords[0]?.keyword ?? '—', accent: 'accent-green',  icon: 'bi-fire',
      hint: keywords[0] ? `${keywords[0].count} searches` : null },
    { label: 'Top trend',
      value: keywords[0] ? `${keywords[0].trend >= 0 ? '+' : ''}${keywords[0].trend}%` : '—',
      accent: 'accent-purple', icon: 'bi-graph-up',
      color: keywords[0]?.trend >= 0 ? 'var(--fb-green)' : 'var(--fb-red)' },
  ];

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Popular searches</h2>
          <p className="page-subtitle">Top keywords searched by users — ranked by volume.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <Form.Select size="sm" value={lang} onChange={e => setLang(e.target.value)} style={{ width: 120 }}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </Form.Select>
          <Form.Select size="sm" value={window_} onChange={e => setWindow_(e.target.value)} style={{ width: 130 }}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </Form.Select>
          <Form.Select size="sm" value={type} onChange={e => setType(e.target.value)} style={{ width: 120 }}>
            <option value="both">All types</option>
            <option value="keyword">Keyword</option>
            <option value="voice">Voice</option>
          </Form.Select>
          <button className="btn btn-sm btn-outline-primary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI row */}
          <Row className="g-3 mb-4">
            {stats.map((s, i) => (
              <Col key={s.label} xs={6} md={3}>
                <Card className={`search-stat-card search-enter search-enter-${i + 1} h-100`} style={{ animationDelay: `${i * 40}ms` }}>
                  <Card.Body className={`p-3 ${s.accent}`}>
                    <div className="search-stat-label">
                      <i className={`bi ${s.icon}`}></i>{s.label}
                    </div>
                    <div className="search-stat-value" style={{ color: s.color }}>{s.value}</div>
                    {s.hint && <div className="search-stat-hint">{s.hint}</div>}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Bar chart */}
          <Card className="mb-4 search-enter search-enter-3">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>Search volume</h6>
                <span style={{ fontSize: 12, color: 'var(--fb-text-disabled)' }}>
                  {window_ === '7d' ? '7 days' : window_ === '30d' ? '30 days' : '90 days'} · {lang === 'en' ? 'English' : 'Arabic'}
                </span>
              </div>
              {keywords.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No data yet for this filter.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {keywords.map((kw, i) => (
                    <div key={kw.keyword} className="d-flex align-items-center gap-3" style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="search-bar-label">{kw.keyword}</div>
                      <div className="search-bar-track">
                        <div className="search-bar-fill" style={{ width: `${(kw.count / maxCount) * 100}%` }} />
                      </div>
                      <div className="search-bar-count">{kw.count}</div>
                      <div className="search-bar-trend" style={{ color: kw.trend >= 0 ? 'var(--fb-green)' : 'var(--fb-red)' }}>
                        {kw.trend >= 0 ? '↑' : '↓'}{Math.abs(kw.trend)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Table */}
          <Card className="search-enter search-enter-4">
            <Card.Body className="p-0">
              <div className="px-4 pt-3 pb-2">
                <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>Keywords breakdown</h6>
              </div>
              <Table hover responsive className="mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: 'var(--fb-body-bg)' }}>
                  <tr>
                    {['#', 'Keyword', 'Searches', 'Avg results', 'Trend', 'Intent'].map(h => (
                      <th key={h} style={{ fontSize: 11, color: 'var(--fb-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: '10px 16px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw, i) => (
                    <tr key={kw.keyword}>
                      <td style={{ padding: '11px 16px', color: 'var(--fb-text-disabled)', fontFamily: 'monospace' }}>{i + 1}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 500 }}>{kw.keyword}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace' }}>{kw.count}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: 'var(--fb-text-secondary)' }}>{kw.avg_results ?? '—'}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 600, color: kw.trend >= 0 ? 'var(--fb-green)' : 'var(--fb-red)' }}>
                        {kw.trend >= 0 ? '↑' : '↓'}{Math.abs(kw.trend)}%
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        {kw.intent
                          ? <span className={`intent-badge ${INTENT_CLASS[kw.intent] ?? 'intent-unknown'}`}>{kw.intent}</span>
                          : <span style={{ color: 'var(--fb-text-disabled)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}

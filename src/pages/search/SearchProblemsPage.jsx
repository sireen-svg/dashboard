import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col } from 'react-bootstrap';
import { getSearchProblems } from '../../api/search';

const SEVERITY_STYLE = {
  high:   { bg: 'var(--fb-red-bg)',    color: 'var(--fb-red)',    icon: 'bi-exclamation-circle-fill' },
  medium: { bg: 'var(--fb-orange-bg)', color: 'var(--fb-orange)', icon: 'bi-exclamation-triangle-fill' },
  low:    { bg: 'var(--fb-yellow-bg)', color: 'var(--fb-yellow)', icon: 'bi-info-circle-fill' },
};

function IssueList({ title, icon, issues, emptyText }) {
  return (
    <Card className="h-100 search-enter">
      <Card.Body className="p-3">
        <div className="config-card-title">
          <i className={`bi ${icon}`}></i>{title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginBottom: 12 }}>{emptyText}</div>

        {issues.length === 0 ? (
          <div className="d-flex align-items-center gap-2" style={{ fontSize: 13, color: 'var(--fb-green)', fontWeight: 500 }}>
            <i className="bi bi-check-circle-fill"></i>All clear
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {issues.map((item, i) => {
              const sev = SEVERITY_STYLE[item.severity] ?? SEVERITY_STYLE.low;
              return (
                <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: 'var(--fb-body-bg)' }}>
                  <span style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.keyword ?? item.query ?? '—'}
                  </span>
                  <div className="d-flex align-items-center gap-2 ms-2 flex-shrink-0">
                    {item.count != null && (
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>×{item.count}</span>
                    )}
                    {item.severity && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: sev.bg, color: sev.color }}>
                        <i className={`bi ${sev.icon} me-1`} style={{ fontSize: 10 }}></i>{item.severity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function SearchProblemsPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await getSearchProblems();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load problems.');
    } finally { setLoading(false); }
  }

  const isHealthy = data && !data.zero_results?.length && !data.low_results?.length
    && !data.high_ai_usage?.length && !data.suspicious_queries?.length;

  const totalIssues = data
    ? (data.zero_results?.length ?? 0) + (data.low_results?.length ?? 0)
      + (data.high_ai_usage?.length ?? 0) + (data.suspicious_queries?.length ?? 0)
    : 0;

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Search problems</h2>
          <p className="page-subtitle">
            Automatic detection of problematic queries over the last {data?.period_days ?? 7} days.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {loading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>}

      {!loading && data && (
        <>
          {/* KPI row */}
          <Row className="g-3 mb-4">
            {[
              { label: 'Total searches',     value: data.overview?.total_searches ?? '—',    accent: 'accent-blue',   icon: 'bi-search' },
              { label: 'Zero-result rate',   value: data.overview?.zero_result_rate ?? '—',
                accent: 'accent-green', icon: 'bi-slash-circle',
                color: data.overview?.zero_result_count === 0 ? 'var(--fb-green)' : 'var(--fb-red)' },
              { label: 'Avg results',        value: data.overview?.avg_results ?? '—',       accent: 'accent-cyan',   icon: 'bi-bar-chart' },
              { label: 'Unique queries',     value: data.overview?.unique_queries ?? '—',    accent: 'accent-purple', icon: 'bi-collection' },
              { label: 'Issues detected',    value: totalIssues,
                accent: 'accent-orange', icon: 'bi-exclamation-triangle',
                color: totalIssues === 0 ? 'var(--fb-green)' : 'var(--fb-red)' },
            ].map((s, i) => (
              <Col key={s.label} xs={6} md>
                <Card className={`search-stat-card search-enter h-100`} style={{ animationDelay: `${i * 35}ms` }}>
                  <Card.Body className={`p-3 ${s.accent}`}>
                    <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                    <div className="search-stat-value" style={{ color: s.color }}>{s.value}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Healthy state */}
          {isHealthy && (
            <div className="alert d-flex align-items-start gap-3 mb-4 search-enter"
              style={{ background: 'var(--fb-green-bg)', border: '1px solid var(--fb-green)', borderRadius: 'var(--fb-radius)', padding: '16px 20px' }}>
              <i className="bi bi-check-circle-fill fs-4 flex-shrink-0" style={{ color: 'var(--fb-green)', marginTop: 2 }}></i>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--fb-green)' }}>Everything looks healthy</div>
                <div style={{ fontSize: 13, color: '#1e7e34', marginTop: 2 }}>
                  No problematic queries detected in the past {data.period_days} days.
                  Zero-result rate is {data.overview.zero_result_rate}.
                </div>
              </div>
            </div>
          )}

          {/* Issue groups grid */}
          <Row className="g-3">
            <Col md={6}>
              <IssueList title="Zero-result queries" icon="bi-slash-circle"
                issues={data.zero_results ?? []}
                emptyText="Searches that returned no results at all." />
            </Col>
            <Col md={6}>
              <IssueList title="Low-result queries" icon="bi-bar-chart"
                issues={data.low_results ?? []}
                emptyText="Fewer than 3 results — index may need expanding." />
            </Col>
            <Col md={6}>
              <IssueList title="High AI usage" icon="bi-cpu"
                issues={data.high_ai_usage ?? []}
                emptyText="Queries relying excessively on AI correction." />
            </Col>
            <Col md={6}>
              <IssueList title="Suspicious queries" icon="bi-shield-exclamation"
                issues={data.suspicious_queries ?? []}
                emptyText="Unusual patterns that may need manual review." />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

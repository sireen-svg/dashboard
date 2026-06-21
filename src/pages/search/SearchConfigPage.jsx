import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col } from 'react-bootstrap';
import { getSearchConfig } from '../../api/search';

function ConfigCard({ title, icon, rows }) {
  return (
    <Card className="h-100 search-enter">
      <Card.Body className="p-3">
        <div className="config-card-title"><i className={`bi ${icon}`}></i>{title}</div>
        {rows.map(([k, v, color]) => (
          <div key={k} className="config-row">
            <span className="config-key">{k}</span>
            <span className="config-val" style={{ color }}>{String(v)}</span>
          </div>
        ))}
      </Card.Body>
    </Card>
  );
}

export default function SearchConfigPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await getSearchConfig();
      setData(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load config.');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Search config</h2>
          <p className="page-subtitle">
            Server-wide infrastructure settings — read-only.
            <span className="ms-2" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: 'var(--fb-yellow-bg)', color: '#865400' }}>Developer only</span>
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div className="dev-tools-banner mb-4">
        <i className="bi bi-shield-exclamation fs-5 flex-shrink-0"></i>
        <span>This page exposes server-wide infrastructure settings (cache driver, queue, AI model config). Do not share with regular project owners.</span>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}
      {loading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>}

      {!loading && data && (
        <Row className="g-3">
          <Col md={6}>
            <ConfigCard title="Search engine" icon="bi-search" rows={[
              ['ai_enabled',                    data.search.ai_enabled ? '✓ true' : 'false', data.search.ai_enabled ? 'var(--fb-green)' : 'var(--fb-red)'],
              ['ai_trigger_threshold',           data.search.ai_trigger_threshold],
              ['keyboard_confidence_threshold',  data.search.keyboard_confidence_threshold],
            ]} />
          </Col>
          <Col md={6}>
            <ConfigCard title="Queue" icon="bi-layers" rows={[
              ['connection',   data.queue.connection],
              ['search_queue', data.queue.search_queue],
            ]} />
          </Col>
          <Col md={6}>
            <ConfigCard title="Cache" icon="bi-lightning" rows={[
              ['driver', data.cache.driver],
              ['ai_ttl', `${data.cache.ai_ttl}s (${data.cache.ai_ttl / 60} min)`],
            ]} />
          </Col>
          <Col md={6}>
            <ConfigCard title="Environment" icon="bi-server" rows={[
              ['environment', data.environment,
                data.environment === 'production' ? 'var(--fb-green)' : 'var(--fb-orange)'],
            ]} />
          </Col>
        </Row>
      )}
    </div>
  );
}

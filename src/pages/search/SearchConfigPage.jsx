import { useState, useEffect } from 'react';
import { Card, Spinner, Row, Col } from 'react-bootstrap';
import { getSearchConfig } from '../../api/search';

function ConfigCard({ title, icon, hint, rows }) {
  return (
    <Card className="h-100 search-enter">
      <Card.Body className="p-3">
        <div className="config-card-title"><i className={`bi ${icon}`}></i>{title}</div>
        {hint && (
          <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginBottom: 10 }}>{hint}</div>
        )}
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

  const bool = v => (v ? '✓ true' : 'false');
  const boolColor = v => (v ? 'var(--fb-green)' : 'var(--fb-text-disabled)');

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Search config</h2>
          <p className="page-subtitle">
            Effective ranking and retrieval parameters — read-only.
            <span className="ms-2" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: 'var(--fb-yellow-bg)', color: '#865400' }}>Developer only</span>
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div className="dev-tools-banner mb-4">
        <i className="bi bi-shield-exclamation fs-5 flex-shrink-0"></i>
        <span>
          These values are read from <code>config/search.php</code> and are changed through <code>.env</code> only.
          There is deliberately no write endpoint: a runtime override would live for one request and die with it,
          telling the operator a change took effect when nothing changed for anyone else.
        </span>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}
      {loading && <div className="d-flex justify-content-center py-5"><Spinner animation="border" variant="primary" /></div>}

      {!loading && data && (
        <Row className="g-3">
          <Col md={6}>
            <ConfigCard
              title="Relevance — BM25F"
              icon="bi-bar-chart-steps"
              hint="k1 saturates term repetition; b normalises document length."
              rows={[
                ['k1', data.ranking?.bm25?.k1],
                ['b',  data.ranking?.bm25?.b],
                ['title weight',   data.ranking?.field_weights?.title],
                ['content weight', data.ranking?.field_weights?.content],
                ['meta weight',    data.ranking?.field_weights?.meta],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Behavioural signals"
              icon="bi-graph-up"
              hint="Added on top of relevance. Their sum is the ceiling of how far popularity can move a result."
              rows={[
                ['click-through',    data.ranking?.signals?.ctr],
                ['popularity',       data.ranking?.signals?.popularity],
                ['freshness',        data.ranking?.signals?.freshness],
                ['exact phrase',     data.ranking?.signals?.exact_phrase],
                ['attribute match',  data.ranking?.signals?.attribute_match],
                ['intent match',     data.ranking?.signals?.intent_match],
                ['freshness half-life', `${data.ranking?.freshness_half_life_days} days`],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Personalisation"
              icon="bi-person-gear"
              hint="Applied as a bounded multiplier, never as an open-ended bonus — so it can only break ties, not decide relevance."
              rows={[
                ['enabled',        bool(data.ranking?.personalization?.enabled), boolColor(data.ranking?.personalization?.enabled)],
                ['max boost',      `×${(1 + Number(data.ranking?.personalization?.max_boost ?? 0)).toFixed(2)} (+${Math.round(Number(data.ranking?.personalization?.max_boost ?? 0) * 100)}%)`],
                ['half-life',      `${data.ranking?.personalization?.half_life_days} days`],
                ['history window', `${data.ranking?.personalization?.history_days} days`],
                ['cache TTL',      `${data.ranking?.personalization?.cache_ttl_minutes} min`],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Query understanding"
              icon="bi-lightbulb"
              hint="Above the confidence threshold a detected condition excludes non-matches; below it, it only boosts."
              rows={[
                ['filter confidence threshold', data.understanding?.filter_confidence_threshold],
                ['max terms',   data.understanding?.max_terms],
                ['max filters', data.understanding?.max_filters],
                ['year range',  `${data.understanding?.min_year}–${data.understanding?.max_year}`],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Retrieval window"
              icon="bi-window-stack"
              hint="How many candidates are pulled before PHP re-ranks them. Requests past the cap fall back to database order."
              rows={[
                ['candidate multiplier', data.retrieval?.candidate_multiplier],
                ['min candidates',       data.retrieval?.min_candidates],
                ['max candidates',       data.retrieval?.max_candidates],
                ['count cap',            data.retrieval?.count_cap],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Indexing"
              icon="bi-hdd-stack"
              hint="n-gram size must equal ngram_token_size on the MySQL server, or Asian-language queries silently match nothing."
              rows={[
                ['n-gram token size',  data.indexing?.ngram_token_size],
                ['chunk size',         data.indexing?.chunk_size],
                ['max content length', data.indexing?.max_content_length],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="AI fallback"
              icon="bi-cpu"
              hint="Runs only when the local pipeline and local rescue both return nothing."
              rows={[
                ['enabled',   bool(data.ai?.enabled), boolColor(data.ai?.enabled)],
                ['timeout',   `${data.ai?.timeout_seconds}s (whole provider chain)`],
                ['plan cache', `${data.ai?.plan_cache_days} days`],
                ['failure threshold', data.ai?.circuit_breaker?.failure_threshold],
                ['cooldown',  `${data.ai?.circuit_breaker?.cooldown_seconds}s`],
                ['providers', (data.ai?.providers_configured ?? []).join(', ') || 'none configured'],
              ]} />
          </Col>

          <Col md={6}>
            <ConfigCard
              title="Environment"
              icon="bi-server"
              rows={[
                ['environment', data.environment,
                  data.environment === 'production' ? 'var(--fb-green)' : 'var(--fb-orange)'],
              ]} />
          </Col>
        </Row>
      )}
    </div>
  );
}

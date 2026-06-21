import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { runAiRerun } from '../../api/search';

export default function SearchAiRerunPage() {
  const { project } = useOutletContext();
  const [query, setQuery]     = useState('');
  const [lang, setLang]       = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  async function handleRun(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await runAiRerun({ query: query.trim(), language: lang });
      setResult(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'AI re-run failed.');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h2>AI re-run</h2>
        <p className="page-subtitle">
          Trigger the AI correction model directly and inspect its raw output.
          <span className="ms-2" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: 'var(--fb-yellow-bg)', color: '#865400' }}>Developer only</span>
        </p>
      </div>

      <div className="dev-tools-banner mb-4">
        <i className="bi bi-cpu fs-5 flex-shrink-0"></i>
        <span>Calls the AI model directly on your query — useful for debugging correction confidence and expansion quality.</span>
      </div>

      <Card className="mb-4">
        <Card.Body className="p-4">
          <form onSubmit={handleRun}>
            <div className="d-flex gap-2 flex-wrap">
              <InputGroup style={{ flex: '1 1 320px' }}>
                <InputGroup.Text style={{ background: 'transparent' }}>
                  <i className="bi bi-cpu" style={{ fontSize: 13 }}></i>
                </InputGroup.Text>
                <Form.Control placeholder="Query to run through the AI model directly…" value={query} onChange={e => setQuery(e.target.value)} style={{ fontSize: 14 }} />
              </InputGroup>
              <Form.Select value={lang} onChange={e => setLang(e.target.value)} style={{ width: 140 }}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Form.Select>
              <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} style={{ minWidth: 130 }}>
                {loading ? <><Spinner size="sm" className="me-2" />Running…</> : <><i className="bi bi-play-fill me-1"></i>Re-run AI</>}
              </button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {result && (
        <div className="d-flex flex-column gap-3 search-enter">
          {/* Recommendation */}
          <div className="d-flex align-items-start gap-3 p-3 rounded"
            style={{ background: 'var(--fb-blue-bg)', border: '1px solid rgba(26,115,232,0.2)', borderRadius: 'var(--fb-radius)' }}>
            <i className="bi bi-lightbulb-fill flex-shrink-0 mt-1" style={{ color: 'var(--fb-blue)', fontSize: 18 }}></i>
            <div style={{ fontSize: 14, color: 'var(--fb-blue)', fontWeight: 500 }}>{result.recommendation}</div>
          </div>

          {/* Parsed result */}
          <Card>
            <Card.Body className="p-4">
              <div className="config-card-title"><i className="bi bi-check2-circle"></i>Parsed result</div>
              <Row className="g-3 mb-3">
                {[
                  { label: 'Corrected query', value: result.parsed?.corrected_query, color: 'var(--fb-blue)' },
                  { label: 'Confidence',       value: result.parsed?.confidence },
                  { label: 'Source',           value: result.parsed?.source },
                  { label: 'Has correction',   value: result.parsed?.has_correction ? '✓ Yes' : 'No', color: result.parsed?.has_correction ? 'var(--fb-green)' : undefined },
                  { label: 'Has expansion',    value: result.parsed?.has_expansion  ? '✓ Yes' : 'No' },
                  { label: 'Execution time',   value: `${result.execution_time_ms} ms` },
                ].map(s => (
                  <Col key={s.label} xs={6} md={4}>
                    <div style={{ fontSize: 11, color: 'var(--fb-text-disabled)', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: s.color ?? 'var(--fb-text-primary)' }}>{String(s.value ?? '—')}</div>
                  </Col>
                ))}
              </Row>
              {result.parsed?.expanded_keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fb-text-disabled)', marginBottom: 6 }}>Expanded keywords</div>
                  <div className="d-flex gap-1 flex-wrap">
                    {result.parsed.expanded_keywords.map(kw => (
                      <span key={kw} style={{ fontSize: 12, padding: '2px 9px', borderRadius: 100, background: 'var(--fb-blue-light)', color: 'var(--fb-blue)', fontFamily: 'monospace' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Raw response */}
          <Card>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="config-card-title mb-0"><i className="bi bi-code-slash"></i>Raw AI response</div>
                <button type="button" className="btn btn-sm btn-link p-0" style={{ fontSize: 12 }}
                  onClick={() => navigator.clipboard?.writeText(JSON.stringify(result.raw_response, null, 2))}>
                  <i className="bi bi-clipboard me-1"></i>Copy
                </button>
              </div>
              <pre style={{ fontSize: 12, background: 'var(--fb-body-bg)', padding: 14, borderRadius: 'var(--fb-radius)', maxHeight: 300, overflow: 'auto', margin: 0, border: '1px solid var(--fb-border-light)' }}>
                {JSON.stringify(result.raw_response, null, 2)}
              </pre>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}

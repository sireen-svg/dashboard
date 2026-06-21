import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Form, InputGroup } from 'react-bootstrap';
import { runSearchCompare } from '../../api/search';

export default function SearchComparePage() {
  const { project } = useOutletContext();
  const [query, setQuery]     = useState('');
  const [lang, setLang]       = useState('en');
  const [aiA, setAiA]         = useState(false);
  const [aiB, setAiB]         = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  async function handleRun(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await runSearchCompare({
        query: query.trim(), language: lang, project_id: project.id,
        mode_a: { ai_enabled: aiA }, mode_b: { ai_enabled: aiB },
      });
      setResult(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Compare request failed.');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="page-header">
        <h2>A/B compare</h2>
        <p className="page-subtitle">
          Compare results for the same query across two configurations.
          <span className="ms-2" style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: 'var(--fb-yellow-bg)', color: '#865400' }}>Developer only</span>
        </p>
      </div>

      <div className="dev-tools-banner mb-4">
        <i className="bi bi-layout-split fs-5 flex-shrink-0"></i>
        <span>Run the same query with different settings side-by-side to tune the search engine.</span>
      </div>

      <Card className="mb-4">
        <Card.Body className="p-4">
          <form onSubmit={handleRun}>
            <div className="d-flex gap-2 flex-wrap mb-3">
              <InputGroup style={{ flex: '1 1 280px' }}>
                <InputGroup.Text style={{ background: 'transparent' }}>
                  <i className="bi bi-search" style={{ fontSize: 13 }}></i>
                </InputGroup.Text>
                <Form.Control placeholder="Query to compare between two modes…" value={query} onChange={e => setQuery(e.target.value)} style={{ fontSize: 14 }} />
              </InputGroup>
              <Form.Select value={lang} onChange={e => setLang(e.target.value)} style={{ width: 140 }}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Form.Select>
              <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} style={{ minWidth: 140 }}>
                {loading ? <><Spinner size="sm" className="me-2" />Running…</> : <><i className="bi bi-play-fill me-1"></i>Run compare</>}
              </button>
            </div>
            <div className="d-flex gap-4 flex-wrap">
              <div className="d-flex align-items-center gap-3 p-2 rounded" style={{ background: 'var(--fb-body-bg)', border: '1px solid var(--fb-border-light)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fb-text-secondary)', minWidth: 60 }}>Mode A</span>
                <Form.Check type="switch" label="AI enabled" checked={aiA} onChange={e => setAiA(e.target.checked)} style={{ fontSize: 13 }} />
              </div>
              <div className="d-flex align-items-center gap-3 p-2 rounded" style={{ background: 'var(--fb-body-bg)', border: '1px solid var(--fb-border-light)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fb-text-secondary)', minWidth: 60 }}>Mode B</span>
                <Form.Check type="switch" label="AI enabled" checked={aiB} onChange={e => setAiB(e.target.checked)} style={{ fontSize: 13 }} />
              </div>
            </div>
          </form>
        </Card.Body>
      </Card>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {result && (
        <div className="row g-3 search-enter">
          {[
            { label: `Mode A — AI ${aiA ? 'ON' : 'OFF'}`, data: result.mode_a ?? result, color: 'var(--fb-blue)' },
            { label: `Mode B — AI ${aiB ? 'ON' : 'OFF'}`, data: result.mode_b ?? result, color: '#00bcd4' },
          ].map(({ label, data, color }) => (
            <div key={label} className="col-md-6">
              <Card className="h-100">
                <Card.Body className="p-3">
                  <div className="config-card-title" style={{ color }}><i className="bi bi-layout-split"></i>{label}</div>
                  <pre style={{ fontSize: 12, background: 'var(--fb-body-bg)', padding: 12, borderRadius: 'var(--fb-radius)', maxHeight: 380, overflow: 'auto', margin: 0, border: '1px solid var(--fb-border-light)' }}>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

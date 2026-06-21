import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Form, InputGroup } from 'react-bootstrap';
import { runSearchDebug } from '../../api/search';

/* ── Pipeline stage component ─────────────────────────── */
function PipelineStage({ stage, isLast }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pipeline-stage">
      <div className="pipeline-dot-col">
        <div className={`pipeline-dot ${stage.status}`}>
          <i className={`bi ${stage.status === 'ok' ? 'bi-check-lg' : stage.status === 'empty' ? 'bi-x-lg' : 'bi-dash-lg'}`}></i>
        </div>
        {!isLast && <div className="pipeline-connector" />}
      </div>

      <div className="pipeline-body">
        <button type="button" className="pipeline-toggle" onClick={() => setOpen(o => !o)}>
          <div>
            <span className="pipeline-title">{stage.title}</span>
            <span className={`pipeline-status-tag ${stage.status}`}>{stage.statusLabel}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            {stage.timeMs > 0 && <span className="pipeline-time">{stage.timeMs} ms</span>}
            <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--fb-text-disabled)' }}></i>
          </div>
        </button>
        <div className="pipeline-summary">{stage.summary}</div>

        {open && (
          <div className="pipeline-detail">
            <div className="pipeline-kv-grid">
              {Object.entries(stage.detail).map(([k, v]) => (
                <div key={k}>
                  <div className="pipeline-kv-label">{k}</div>
                  <div className="pipeline-kv-val">{String(v)}</div>
                </div>
              ))}
            </div>
            {stage.results?.length > 0 && (
              <div className="mt-3">
                <table className="table table-sm mb-0" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {['Title', 'Type', 'Score', 'Matched terms'].map(h => (
                        <th key={h} style={{ fontSize: 11, color: 'var(--fb-text-secondary)', fontWeight: 600, padding: '6px 8px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stage.results.map(r => (
                      <tr key={r.entry_id}>
                        <td style={{ padding: '7px 8px', fontWeight: 500 }}>{r.title}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: 'var(--fb-text-secondary)' }}>{r.data_type}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--fb-blue)' }}>{r.score?.toFixed(2)}</div>
                          <div className="score-track"><div className="score-fill" style={{ width: `${(r.score ?? 0) * 100}%` }} /></div>
                        </td>
                        <td style={{ padding: '7px 8px' }}>
                          <div className="d-flex gap-1 flex-wrap">
                            {r.matched_terms?.map(t => (
                              <span key={t} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--fb-blue-light)', color: 'var(--fb-blue)', fontFamily: 'monospace' }}>{t}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function buildStages(r) {
  return [
    {
      id: 'norm', title: 'Query normalization', status: 'ok', statusLabel: 'done',
      timeMs: r.normalization.time_ms,
      summary: `"${r.normalization.original}"  →  "${r.normalization.normalized}"`,
      detail: { language: r.normalization.input_language, 'detected arabic': r.normalization.detected_arabic ? 'yes' : 'no', 'is natural language': r.normalization.is_natural_language ? 'yes' : 'no', 'word count': `${r.normalization.word_count_before} → ${r.normalization.word_count_after}`, 'excluded terms': r.normalization.exclude_terms.join(', ') || '—' },
    },
    {
      id: 'pre', title: 'Pre-AI analysis', status: r.pre_ai_analysis.is_gibberish ? 'empty' : 'ok',
      statusLabel: r.pre_ai_analysis.is_gibberish ? 'gibberish detected' : 'done',
      timeMs: 0,
      summary: `Vowel ratio ${r.pre_ai_analysis.vowel_ratio} · ${r.pre_ai_analysis.token_count} token(s)${r.pre_ai_analysis.typo_signals.length ? ` · signals: ${r.pre_ai_analysis.typo_signals.join(', ')}` : ''}`,
      detail: { 'is gibberish': r.pre_ai_analysis.is_gibberish ? 'yes' : 'no', 'has negation': r.pre_ai_analysis.has_negation ? 'yes' : 'no', 'typo signals': r.pre_ai_analysis.typo_signals.join(', ') || '—', 'token count': r.pre_ai_analysis.token_count },
    },
    {
      id: 'initial', title: 'Initial search', status: r.initial_search.total > 0 ? 'ok' : 'empty',
      statusLabel: `${r.initial_search.total} result${r.initial_search.total !== 1 ? 's' : ''}`,
      timeMs: r.initial_search.time_ms,
      summary: `Boolean query: ${r.initial_search.boolean_query}`,
      detail: { results: r.initial_search.total, 'boolean query': r.initial_search.boolean_query },
      results: r.initial_search.top_results ?? [],
    },
    {
      id: 'kb', title: 'Keyboard layout correction',
      status: !r.keyboard_fix.triggered ? 'skip' : r.keyboard_fix.decision === 'accepted' ? 'ok' : 'skip',
      statusLabel: !r.keyboard_fix.triggered ? 'skipped' : r.keyboard_fix.decision,
      timeMs: r.keyboard_fix.time_ms,
      summary: !r.keyboard_fix.triggered ? 'Not triggered — initial results were sufficient.' : `"${r.keyboard_fix.fixed_query}" · confidence ${r.keyboard_fix.confidence} · direction: ${r.keyboard_fix.direction}`,
      detail: r.keyboard_fix.triggered
        ? { 'fixed query': r.keyboard_fix.fixed_query, direction: r.keyboard_fix.direction, confidence: r.keyboard_fix.confidence, decision: r.keyboard_fix.decision, 'results after': r.keyboard_fix.total_after }
        : { status: 'not triggered' },
    },
    {
      id: 'ai', title: 'AI correction', status: r.ai.triggered ? 'ok' : 'skip',
      statusLabel: r.ai.triggered ? 'done' : 'skipped',
      timeMs: r.ai.time_ms,
      summary: r.ai.triggered
        ? `Corrected to "${r.ai.corrected}" via ${r.ai.source} · confidence ${r.ai.confidence} · ${r.ai.total_after} results`
        : 'Not triggered.',
      detail: r.ai.triggered
        ? { corrected: r.ai.corrected, source: r.ai.source, confidence: r.ai.confidence, intent: r.ai.intent, 'expanded terms': r.ai.expanded.join(', ') || '—', 'results after': r.ai.total_after }
        : { status: 'not triggered' },
    },
    {
      id: 'final', title: 'Final results', status: r.final.total > 0 ? 'ok' : 'empty',
      statusLabel: `${r.final.total} result${r.final.total !== 1 ? 's' : ''} via ${r.final.source}`,
      timeMs: 0,
      summary: `Source: ${r.final.source}`,
      detail: { total: r.final.total, source: r.final.source },
      results: r.final.results ?? [],
    },
  ];
}

export default function SearchDebugPage() {
  const { project } = useOutletContext();
  const [keyword, setKeyword] = useState('');
  const [lang, setLang]       = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleRun(e) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await runSearchDebug({ keyword: keyword.trim(), language: lang, project_id: project.id });
      setResult(res.data?.data ?? res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Debug request failed.');
    } finally { setLoading(false); }
  }

  const perfColor = ms => ms < 1000 ? 'var(--fb-green)' : ms < 3000 ? 'var(--fb-orange)' : 'var(--fb-red)';

  return (
    <div>
      <div className="page-header">
        <h2>Search debug</h2>
        <p className="page-subtitle">Trace how any keyword is processed through the search engine — step by step.</p>
      </div>

      {/* Query form */}
      <Card className="mb-4">
        <Card.Body className="p-4">
          <form onSubmit={handleRun}>
            <div className="d-flex gap-2 flex-wrap mb-3">
              <InputGroup style={{ flex: '1 1 280px' }}>
                <InputGroup.Text style={{ background: 'transparent' }}>
                  <i className="bi bi-search" style={{ fontSize: 13 }}></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Type any keyword to trace through the pipeline…"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  style={{ fontSize: 14 }}
                />
              </InputGroup>
              <Form.Select value={lang} onChange={e => setLang(e.target.value)} style={{ width: 140 }}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Form.Select>
              <button type="submit" className="btn btn-primary" disabled={loading || !keyword.trim()}
                style={{ minWidth: 140 }}>
                {loading
                  ? <><Spinner size="sm" className="me-2" />Analysing…</>
                  : <><i className="bi bi-play-fill me-1"></i>Run analysis</>}
              </button>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ fontSize: 12, color: 'var(--fb-text-disabled)' }}>Try:</span>
              {['iphoen', 'buy iphone', 'هحاخىث', 'doker tutorail'].map(ex => (
                <button key={ex} type="button" className="btn btn-link p-0 btn-sm"
                  style={{ fontSize: 12, color: 'var(--fb-blue)' }}
                  onClick={() => setKeyword(ex)}>{ex}</button>
              ))}
            </div>
          </form>
        </Card.Body>
      </Card>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {result && (
        <div className="search-enter">
          {/* Performance bar */}
          <div className="search-perf-bar mb-4">
            {[
              { label: 'Execution time', value: `${result.execution_time_ms} ms`, color: perfColor(result.execution_time_ms) },
              { label: 'Final source',   value: result.final?.source ?? '—' },
              { label: 'Total results',  value: result.final?.total ?? 0, color: result.final?.total > 0 ? 'var(--fb-green)' : 'var(--fb-red)' },
              { label: 'Correction',     value: result.ai?.triggered ? `${result.normalization?.original} → ${result.ai?.corrected}` : 'None' },
              { label: 'AI source',      value: result.ai?.triggered ? result.ai.source : '—' },
            ].map(s => (
              <div key={s.label} className="search-perf-item">
                <div className="search-perf-label">{s.label}</div>
                <div className="search-perf-value" style={{ color: s.color ?? 'var(--fb-text-primary)' }}>{s.value}</div>
              </div>
            ))}
            <div className="ms-auto">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowRaw(r => !r)}>
                <i className={`bi bi-${showRaw ? 'eye-slash' : 'code-slash'} me-1`}></i>{showRaw ? 'Hide' : 'Show'} raw JSON
              </button>
            </div>
          </div>

          {/* Decision pipeline */}
          <Card className="mb-3">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-diagram-3" style={{ color: 'var(--fb-blue)', fontSize: 18 }}></i>
                <h6 className="fw-medium mb-0" style={{ fontSize: 15 }}>Decision pipeline</h6>
                <span style={{ fontSize: 12, color: 'var(--fb-text-disabled)', marginLeft: 4 }}>click any stage to expand</span>
              </div>
              {buildStages(result).map((stage, i, arr) => (
                <PipelineStage key={stage.id} stage={stage} isLast={i === arr.length - 1} />
              ))}
            </Card.Body>
          </Card>

          {/* Raw JSON */}
          {showRaw && (
            <Card className="mb-3">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>Raw response</h6>
                  <button type="button" className="btn btn-sm btn-link p-0"
                    style={{ fontSize: 12 }}
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))}>
                    <i className="bi bi-clipboard me-1"></i>Copy
                  </button>
                </div>
                <pre style={{ fontSize: 12, background: 'var(--fb-body-bg)', padding: 14, borderRadius: 'var(--fb-radius)', maxHeight: 420, overflow: 'auto', margin: 0, border: '1px solid var(--fb-border-light)' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

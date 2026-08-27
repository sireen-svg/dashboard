import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Form, InputGroup } from 'react-bootstrap';
import { runSearchDebug, getSearchTermWeights } from '../../api/search';

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
          <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 11, color: 'var(--fb-text-disabled)' }}></i>
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
              <div className="mt-3" style={{ overflowX: 'auto' }}>
                <table className="table table-sm mb-0" style={{ fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      {['Title', 'Type', 'Final', 'BM25F', 'Phrase', 'Signals', 'Personal'].map(h => (
                        <th key={h} style={{ fontSize: 11, color: 'var(--fb-text-secondary)', fontWeight: 600, padding: '6px 8px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stage.results.map(r => (
                      <tr key={r.entry_id}>
                        <td style={{ padding: '7px 8px', fontWeight: 500 }}>{r.title}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: 'var(--fb-text-secondary)' }}>{r.data_type_slug}</td>
                        <td style={{ padding: '7px 8px' }}>
                          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--fb-blue)' }}>{r.score?.final?.toFixed(2)}</div>
                          <div className="score-track">
                            <div className="score-fill" style={{ width: `${Math.min(100, ((r.score?.final ?? 0) / (stage.topScore || 1)) * 100)}%` }} />
                          </div>
                        </td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{r.score?.bm25f?.toFixed(2)}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{r.score?.phrase_bonus?.toFixed(2)}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace' }}>{r.score?.signals?.toFixed(2)}</td>
                        <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: (r.score?.personalization_multiplier ?? 1) > 1 ? 'var(--fb-green)' : 'var(--fb-text-disabled)' }}>
                          ×{r.score?.personalization_multiplier?.toFixed(2)}
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

/**
 * Maps the /admin/search/debug response onto the pipeline UI.
 *
 * The stages mirror the engine's real execution order. Stages that the
 * engine did not run are omitted rather than rendered as "skipped" — a
 * permanently-skipped row teaches the reader nothing and pushes the
 * stages that actually decided the outcome further down the page.
 */
function buildStages(r) {
  const text = r.text_pipeline ?? {};
  const plan = r.plan ?? {};
  const retrieval = r.retrieval ?? {};
  const rescue = r.rescue ?? {};
  const refiner = r.refiner ?? {};
  const results = r.results ?? [];
  const topScore = results[0]?.score?.final ?? 1;

  const scripts = Object.entries(text.script_profile ?? {})
    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
    .join(', ');

  const filters = [...(retrieval.hard_filters ?? []), ...(retrieval.soft_filters ?? [])];
  const describeFilter = f =>
    `${f.key} ${f.operator} ${f.value}${f.value_to ? `..${f.value_to}` : ''}`;

  const stages = [
    {
      id: 'text',
      title: 'Text normalisation',
      status: 'ok',
      statusLabel: text.dominant_script ?? 'done',
      summary: `"${text.raw}"  →  "${text.folded}"`,
      detail: {
        'script profile': scripts || '—',
        'mixed scripts': text.is_mixed ? 'yes' : 'no',
        'index targeted': text.needs_ngram ? 'ft_ngram (n-gram parser)' : 'ft_fold (default parser)',
        tokens: (text.tokens ?? []).join(' · ') || '—',
      },
    },
    {
      id: 'plan',
      title: 'Query understanding',
      status: (plan.terms ?? []).length > 0 ? 'ok' : 'empty',
      statusLabel: `${(plan.terms ?? []).length} term(s)`,
      summary: `terms: ${(plan.terms ?? []).join(', ') || '—'}`
        + (plan.must_not?.length ? `   ·   excluded: ${plan.must_not.join(', ')}` : ''),
      detail: {
        terms: (plan.terms ?? []).join(', ') || '—',
        expansions: (plan.expansions ?? []).join(', ') || '—',
        'must not': (plan.must_not ?? []).join(', ') || '—',
        phrase: (plan.phrases ?? []).join(' | ') || '—',
        intent: `${plan.intent?.intent ?? 'general'} @ ${plan.intent?.confidence ?? 0}`,
        'natural language': plan.is_natural_language ? 'yes' : 'no',
      },
    },
    {
      id: 'filters',
      title: 'Structured conditions',
      status: filters.length > 0 ? 'ok' : 'skip',
      statusLabel: filters.length
        ? `${retrieval.hard_filters?.length ?? 0} filter · ${retrieval.soft_filters?.length ?? 0} boost`
        : 'none detected',
      summary: filters.length
        ? filters.map(f => `${describeFilter(f)} (${f.hard ? 'filters' : 'boosts'} @ ${f.confidence})`).join('   ·   ')
        : 'No year / price / attribute condition in this query.',
      detail: filters.length
        ? Object.fromEntries(filters.map(f => [
            describeFilter(f),
            `confidence ${f.confidence} — ${f.hard ? 'excludes non-matching entries' : 'boosts matches, excludes nothing'}`,
          ]))
        : { status: 'none detected' },
    },
    {
      id: 'retrieval',
      title: 'Retrieval',
      status: retrieval.total_matches > 0 ? 'ok' : 'empty',
      statusLabel: `${retrieval.total_matches ?? 0} match(es)`,
      summary: `${retrieval.query_actually_used ?? '—'}   →   ${retrieval.match_target ?? ''}`,
      detail: {
        'queries tried': (retrieval.boolean_queries ?? []).join('     |     ') || '—',
        'step used': retrieval.relaxation_step_used === 0
          ? '0 — strict (every term required)'
          : retrieval.relaxation_step_used > 0
            ? `${retrieval.relaxation_step_used} — relaxed (any term)`
            : 'none matched',
        'match target': retrieval.match_target ?? '—',
        'candidates fetched': retrieval.candidates_fetched ?? 0,
        'window size': retrieval.window?.size ?? '—',
        're-ranked': retrieval.window?.reranked ? 'yes' : 'no — deep paging, DB order kept',
      },
    },
  ];

  // Rescue only ran if retrieval actually came up empty.
  if (rescue.attempted) {
    stages.push({
      id: 'rescue',
      title: 'Local rescue',
      status: rescue.accepted ? 'ok' : 'empty',
      statusLabel: rescue.accepted ?? 'nothing recovered',
      summary: rescue.accepted
        ? `Recovered via ${rescue.accepted} correction — no network call needed.`
        : 'Keyboard-layout and spelling correction both failed to find results.',
      detail: (rescue.tried ?? []).length
        ? Object.fromEntries(rescue.tried.map((t, i) => [
            `${i + 1}. ${t.strategy}`,
            `${t.terms.join(', ')}   →   ${t.total} result(s)`,
          ]))
        : { status: 'no candidate produced' },
    });
  }

  if (refiner.used) {
    stages.push({
      id: 'ai',
      title: 'AI fallback',
      status: 'ok',
      statusLabel: refiner.source ?? 'used',
      summary: `Local pipeline and rescue both returned nothing — the model reinterpreted the query as: ${(plan.terms ?? []).join(', ')}`,
      detail: {
        source: refiner.source ?? '—',
        'reinterpreted terms': (plan.terms ?? []).join(', ') || '—',
        note: 'Structured conditions stay local — the model may only suggest words.',
      },
    });
  }

  stages.push({
    id: 'final',
    title: 'Ranked results',
    status: results.length > 0 ? 'ok' : 'empty',
    statusLabel: `${retrieval.total_matches ?? 0} total · showing ${results.length}`,
    summary: 'final = (BM25F + phrase bonus + signals) × personalisation',
    detail: {
      'plan source': plan.source ?? 'local',
      'total matches': retrieval.total_matches ?? 0,
    },
    results,
    topScore,
  });

  return stages;
}

/* ── Term weight panel ────────────────────────────────── */
function TermWeights({ data }) {
  if (!data?.terms?.length) return null;

  const max = Math.max(...data.terms.map(t => t.idf), 1);

  return (
    <Card className="mb-3">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center gap-2 mb-1">
          <i className="bi bi-bar-chart-steps" style={{ color: 'var(--fb-blue)', fontSize: 18 }}></i>
          <h6 className="fw-medium mb-0" style={{ fontSize: 15 }}>Term weights (IDF)</h6>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--fb-text-secondary)', marginBottom: 16 }}>
          How rare each word is in this project&apos;s {data.corpus?.document_count ?? 0} indexed documents.
          Rarer words carry more weight — this is why one word outranks another.
        </p>

        <table className="table table-sm mb-0" style={{ fontSize: 12.5 }}>
          <thead>
            <tr>
              {['Term', 'Appears in', 'IDF weight', ''].map(h => (
                <th key={h} style={{ fontSize: 11, color: 'var(--fb-text-secondary)', fontWeight: 600, padding: '6px 8px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.terms.map(t => (
              <tr key={t.term}>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontWeight: 500 }}>
                  {t.term}
                  {t.is_expansion && (
                    <span style={{ fontSize: 10, marginLeft: 6, padding: '1px 5px', borderRadius: 4, background: 'var(--fb-body-bg)', color: 'var(--fb-text-disabled)' }}>
                      expansion
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 8px', color: 'var(--fb-text-secondary)' }}>{t.document_frequency} doc(s)</td>
                <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--fb-blue)' }}>{t.idf?.toFixed(3)}</td>
                <td style={{ padding: '7px 8px', width: '38%' }}>
                  <div className="score-track"><div className="score-fill" style={{ width: `${(t.idf / max) * 100}%` }} /></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card.Body>
    </Card>
  );
}

export default function SearchDebugPage() {
  const { project } = useOutletContext();
  const [keyword, setKeyword] = useState('');
  const [lang, setLang]       = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [weights, setWeights] = useState(null);
  const [error, setError]     = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleRun(e) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true); setError(null); setResult(null); setWeights(null);
    try {
      const payload = { keyword: keyword.trim(), language: lang, project_id: project.id };
      const [debugRes, weightRes] = await Promise.all([
        runSearchDebug(payload),
        getSearchTermWeights(payload).catch(() => null),
      ]);
      setResult(debugRes.data?.data ?? debugRes.data);
      if (weightRes) setWeights(weightRes.data?.data ?? weightRes.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Debug request failed.');
    } finally { setLoading(false); }
  }

  const perfColor = ms => ms < 200 ? 'var(--fb-green)' : ms < 1000 ? 'var(--fb-orange)' : 'var(--fb-red)';

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
              {['smartphoen', 'هحاخىث', 'iphone released in 2020', 'laptop under 800', 'ما بدي ايفون 14'].map(ex => (
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
              { label: 'Total results',  value: result.retrieval?.total_matches ?? 0,
                color: (result.retrieval?.total_matches ?? 0) > 0 ? 'var(--fb-green)' : 'var(--fb-red)' },
              { label: 'Plan source',    value: result.plan?.source ?? 'local' },
              { label: 'Index used',     value: result.plan?.needs_ngram ? 'ft_ngram' : 'ft_fold' },
              { label: 'Rescue',         value: result.rescue?.accepted ?? (result.rescue?.attempted ? 'failed' : 'not needed'),
                color: result.rescue?.accepted ? 'var(--fb-green)' : undefined },
              { label: 'Conditions',     value: `${result.retrieval?.hard_filters?.length ?? 0} filter / ${result.retrieval?.soft_filters?.length ?? 0} boost` },
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

          <TermWeights data={weights} />

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

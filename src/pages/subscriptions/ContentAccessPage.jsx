import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table, Modal, Form, Button } from 'react-bootstrap';
import {
  getContentAccessRules,
  createContentAccess,
  updateContentAccess,
  disableContentAccess,
  activateContentAccess,
  getPlans,
} from '../../api/subscriptions';
import { getEntriesByDataType } from '../../api/cms';
import { showToast } from '../../components/Toast';
import { getApiError } from '../../lib/utils';

// The list endpoint returns entries as { id, status, values }; `values` is a
// map of field values, so fall back to the first string we find as a label.
function entryLabel(entry) {
  const values = entry?.values;
  if (values && typeof values === 'object') {
    for (const v of Object.values(values)) {
      if (typeof v === 'string' && v.trim() !== '') return v;
    }
  }
  return `Entry #${entry?.id}`;
}

function FeatureKeys({ features }) {
  if (!features || features.length === 0) {
    return (
      <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>
        Any subscription
      </span>
    );
  }
  return (
    <div className="d-flex flex-wrap gap-1">
      {features.map((f) => (
        <span
          key={f.id ?? f.feature_key}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 100,
            background: 'var(--fb-purple-bg)',
            color: 'var(--fb-purple)',
            fontFamily: 'monospace',
          }}
        >
          {f.feature_key}
        </span>
      ))}
    </div>
  );
}

export default function ContentAccessPage() {
  const { project, dataTypes } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = closed, {} = create
  const [busyId, setBusyId] = useState(null);
  const [featureKeys, setFeatureKeys] = useState([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // This endpoint filters on an explicit project_id rather than the header.
      const res = await getContentAccessRules({ project_id: project.id, page });
      const body = res.data ?? {};
      setRules(body.data ?? []);
      // The controller returns Laravel's paginator as-is, so the page meta sits
      // at the top level rather than under a `meta` key.
      setMeta(body.meta ?? (body.last_page ? body : null));
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
  useEffect(() => { load(); }, [project.id, page]);

  useEffect(() => {
    getPlans(project.id)
      .then((res) => {
        const plans = res.data?.data ?? res.data ?? [];
        const keys = plans.flatMap((p) => (p.features ?? []).map((f) => f.feature_key));
        setFeatureKeys([...new Set(keys)].sort());
      })
      .catch(() => {});
  }, [project.id]);

  async function toggle(rule) {
    setBusyId(rule.id);
    try {
      if (rule.is_active) {
        await disableContentAccess(rule.id);
        showToast('Content access disabled', 'info');
      } else {
        await activateContentAccess(rule.id);
        showToast('Content access activated', 'success');
      }
      load();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = rules.filter((r) => r.is_active).length;
  const gatedCount = rules.filter((r) => r.requires_subscription).length;
  const featureGated = rules.filter((r) => (r.features ?? []).length > 0).length;

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Content access</h2>
          <p className="page-subtitle">
            Which entries sit behind the paywall, and which plan feature unlocks each one.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setEditing({})}>
            <i className="bi bi-plus-lg me-1"></i>Gate content
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      <Row className="g-3 mb-4">
        {[
          { label: 'Rules on this page', value: rules.length, accent: 'accent-blue', icon: 'bi-shield-lock' },
          { label: 'Active', value: activeCount, accent: 'accent-green', icon: 'bi-check-circle' },
          { label: 'Requires subscription', value: gatedCount, accent: 'accent-orange', icon: 'bi-lock' },
          { label: 'Feature-gated', value: featureGated, accent: 'accent-purple', icon: 'bi-key' },
        ].map((s, i) => (
          <Col key={s.label} xs={6} md={3}>
            <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 40}ms` }}>
              <Card.Body className={`p-3 ${s.accent}`}>
                <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                <div className="search-stat-value">{s.value}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

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
                  {['Content type', 'Content ID', 'Gate', 'Unlocked by', 'Status', ''].map((h, i) => (
                    <th
                      key={h || i}
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
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No content access rules. Every entry is public until you gate it here.
                    </td>
                  </tr>
                ) : rules.map((rule) => (
                  <tr key={rule.id}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 500 }}>
                      {rule.content_type}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      #{rule.content_id}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: rule.requires_subscription ? 'var(--fb-orange-bg)' : 'var(--fb-green-bg)',
                          color: rule.requires_subscription ? 'var(--fb-orange)' : 'var(--fb-green)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <i
                          className={`bi ${rule.requires_subscription ? 'bi-lock-fill' : 'bi-unlock-fill'} me-1`}
                          style={{ fontSize: 10 }}
                        ></i>
                        {rule.requires_subscription ? 'Subscription' : 'Public'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {rule.requires_subscription
                        ? <FeatureKeys features={rule.features} />
                        : <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: rule.is_active ? 'var(--fb-green-bg)' : 'var(--fb-body-bg)',
                          color: rule.is_active ? 'var(--fb-green)' : 'var(--fb-text-secondary)',
                        }}
                      >
                        {rule.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => setEditing(rule)}
                        title="Edit rule"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${rule.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggle(rule)}
                        disabled={busyId === rule.id}
                        title={rule.is_active ? 'Disable rule' : 'Activate rule'}
                      >
                        {busyId === rule.id
                          ? <Spinner size="sm" animation="border" />
                          : <i className={`bi ${rule.is_active ? 'bi-slash-circle' : 'bi-check-circle'}`}></i>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
          {meta && meta.last_page > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--fb-text-secondary)' }}>{meta.total} total rules</span>
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

      {editing && (
        <ContentAccessModal
          rule={editing}
          projectId={project.id}
          dataTypes={dataTypes}
          featureKeys={featureKeys}
          onHide={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ContentAccessModal({ rule, projectId, dataTypes, featureKeys, onHide, onSaved }) {
  const isEdit = Boolean(rule.id);

  const [dataType, setDataType] = useState(rule.content_type ?? '');
  const [entries, setEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [contentId, setContentId] = useState(rule.content_id ? String(rule.content_id) : '');
  const [requires, setRequires] = useState(rule.requires_subscription ?? true);
  const [isActive, setIsActive] = useState(rule.is_active ?? true);
  const [features, setFeatures] = useState(
    (rule.features ?? []).map((f) => f.feature_key),
  );
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  // Picking a data type loads its entries so the operator selects a real entry
  // instead of guessing a numeric id.
  async function loadEntries(slug) {
    if (!slug) { setEntries([]); return; }
    setEntriesLoading(true);
    try {
      const res = await getEntriesByDataType(projectId, slug, { per_page: 100 });
      const body = res.data ?? {};
      setEntries(body.entries ?? body.data ?? []);
    } catch {
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }

  function addFeature() {
    const key = newFeature.trim();
    if (!key || features.includes(key)) { setNewFeature(''); return; }
    setFeatures((l) => [...l, key]);
    setNewFeature('');
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateContentAccess(rule.id, {
          project_id: projectId,
          // content_id is optional on update — omitted means "keep the current one".
          requires_subscription: requires,
          features,
          is_active: isActive,
        });
        showToast('Content access updated', 'success');
      } else {
        await createContentAccess({
          project_id: projectId,
          // content_type is resolved backend-side from the entry itself.
          content_id: Number(contentId),
          requires_subscription: requires,
          features,
        });
        showToast('Content gated', 'success');
      }
      onSaved();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show onHide={onHide} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 17 }}>
            {isEdit ? 'Edit content access' : 'Gate content'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            {isEdit ? (
              <Col xs={12}>
                <div
                  className="d-flex align-items-center gap-2 p-2 rounded"
                  style={{ background: 'var(--fb-body-bg)', fontSize: 13 }}
                >
                  <i className="bi bi-file-earmark-text" style={{ color: 'var(--fb-text-secondary)' }}></i>
                  <span style={{ fontFamily: 'monospace' }}>
                    {rule.content_type} #{rule.content_id}
                  </span>
                </div>
              </Col>
            ) : (
              <>
                <Col md={6}>
                  <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Data type</Form.Label>
                  <Form.Select
                    size="sm"
                    value={dataType}
                    onChange={(e) => {
                      setDataType(e.target.value);
                      setContentId('');
                      loadEntries(e.target.value);
                    }}
                  >
                    <option value="">Select a type…</option>
                    {(dataTypes ?? []).map((dt) => (
                      <option key={dt.id} value={dt.slug}>{dt.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Entry</Form.Label>
                  <Form.Select
                    size="sm"
                    required
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    disabled={!dataType || entriesLoading}
                  >
                    <option value="">
                      {entriesLoading ? 'Loading…' : !dataType ? 'Pick a type first' : 'Select an entry…'}
                    </option>
                    {entries.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entryLabel(entry)}
                      </option>
                    ))}
                  </Form.Select>
                  {dataType && !entriesLoading && entries.length === 0 && (
                    <Form.Text style={{ fontSize: 11, color: 'var(--fb-orange)' }}>
                      This type has no entries yet.
                    </Form.Text>
                  )}
                </Col>
              </>
            )}

            <Col xs={12}>
              <Form.Check
                type="switch"
                id="ca-requires"
                label="Requires a subscription to view"
                checked={requires}
                onChange={(e) => setRequires(e.target.checked)}
                style={{ fontSize: 13 }}
              />
              <Form.Text style={{ fontSize: 11 }}>
                Off means the entry stays public even with a rule attached.
              </Form.Text>
            </Col>

            {requires && (
              <Col xs={12}>
                <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Unlocking features</Form.Label>
                <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginBottom: 8 }}>
                  A subscriber needs at least ONE of these. Leave empty to accept any
                  active subscription.
                </div>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    size="sm"
                    list="ca-feature-keys"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addFeature(); }
                    }}
                    placeholder="feature_key"
                    style={{ fontFamily: 'monospace' }}
                  />
                  <datalist id="ca-feature-keys">
                    {featureKeys.map((k) => <option key={k} value={k} />)}
                  </datalist>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addFeature}>
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
                {features.length === 0 ? (
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    Any active subscription unlocks this entry.
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-1">
                    {features.map((key) => (
                      <span
                        key={key}
                        className="d-inline-flex align-items-center gap-1"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 6px 3px 8px',
                          borderRadius: 100,
                          background: 'var(--fb-purple-bg)',
                          color: 'var(--fb-purple)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {key}
                        <button
                          type="button"
                          className="btn btn-link p-0 d-inline-flex"
                          onClick={() => setFeatures((l) => l.filter((k) => k !== key))}
                          style={{ color: 'inherit', lineHeight: 1 }}
                          aria-label={`Remove ${key}`}
                        >
                          <i className="bi bi-x" style={{ fontSize: 13 }}></i>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Col>
            )}

            {isEdit && (
              <Col xs={12}>
                <Form.Check
                  type="switch"
                  id="ca-active"
                  label="Rule is active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ fontSize: 13 }}
                />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="outline-secondary" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button size="sm" variant="primary" type="submit" disabled={saving}>
            {saving
              ? <><Spinner size="sm" animation="border" className="me-1" />Saving…</>
              : isEdit ? 'Save changes' : 'Gate content'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

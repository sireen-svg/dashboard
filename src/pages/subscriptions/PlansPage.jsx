import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table, Modal, Form, Button } from 'react-bootstrap';
import { getPlans, createPlan } from '../../api/subscriptions';
import { showToast } from '../../components/Toast';
import { getApiError, slugify } from '../../lib/utils';

// feature_value is stored as JSON, so a limit is a number and a flag is a
// boolean. The form keeps it as text and casts on submit per feature_type.
const FEATURE_TYPES = [
  { value: 'boolean', label: 'Flag (on / off)' },
  { value: 'number', label: 'Limit (numeric quota)' },
  { value: 'json', label: 'JSON value' },
];

const EMPTY_FEATURE = { feature_key: '', feature_type: 'boolean', feature_value: 'true' };

function money(amount, currency) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(2)} ${currency || ''}`.trim();
}

function castFeatureValue(feature) {
  if (feature.feature_type === 'number') return Number(feature.feature_value);
  if (feature.feature_type === 'boolean') return feature.feature_value === 'true';
  try {
    return JSON.parse(feature.feature_value);
  } catch {
    // Send it through as typed and let the backend reject it, rather than
    // silently dropping what the operator wrote.
    return feature.feature_value;
  }
}

function FeatureBadge({ feature }) {
  const raw = feature.feature_value;
  const value = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw);
  return (
    <span
      className="d-inline-flex align-items-center gap-1"
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 100,
        background: 'var(--fb-body-bg)',
        color: 'var(--fb-text-secondary)',
      }}
      title={`${feature.feature_key} (${feature.feature_type})`}
    >
      <span style={{ fontFamily: 'monospace' }}>{feature.feature_key}</span>
      <span style={{ opacity: 0.6 }}>·</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </span>
  );
}

export default function PlansPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getPlans(project.id);
      setPlans(res.data?.data ?? res.data ?? []);
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
  useEffect(() => { load(); }, [project.id]);

  const activeCount = plans.filter((p) => p.is_active).length;
  const freeCount = plans.filter((p) => Number(p.price) <= 0).length;
  const currencies = [...new Set(plans.map((p) => p.currency).filter(Boolean))];

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Subscription plans</h2>
          <p className="page-subtitle">
            What a subscriber can buy — price, billing period, and the features each plan unlocks.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>New plan
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      <Row className="g-3 mb-4">
        {[
          { label: 'Total plans', value: plans.length, accent: 'accent-blue', icon: 'bi-card-list' },
          { label: 'Active', value: activeCount, accent: 'accent-green', icon: 'bi-check-circle' },
          { label: 'Free plans', value: freeCount, accent: 'accent-cyan', icon: 'bi-gift' },
          {
            label: 'Currencies',
            value: currencies.length ? currencies.join(', ') : '—',
            accent: 'accent-purple',
            icon: 'bi-currency-exchange',
          },
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
                  {['Plan', 'Slug', 'Price', 'Period', 'Features', 'Status'].map((h) => (
                    <th
                      key={h}
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
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No plans yet. Create one to let users subscribe to this project.
                    </td>
                  </tr>
                ) : plans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={{ padding: '10px 16px', fontWeight: 500 }}>
                      {plan.name}
                      {plan.description && (
                        <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', fontWeight: 400 }}>
                          {plan.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                      {plan.slug}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {Number(plan.price) <= 0
                        ? <span style={{ color: 'var(--fb-green)' }}>Free</span>
                        : money(plan.price, plan.currency)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>
                      {plan.duration_days} days
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {(plan.features ?? []).length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>—</span>
                      ) : (
                        <div className="d-flex flex-wrap gap-1">
                          {plan.features.map((f) => (
                            <FeatureBadge key={f.id ?? f.feature_key} feature={f} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: plan.is_active ? 'var(--fb-green-bg)' : 'var(--fb-body-bg)',
                          color: plan.is_active ? 'var(--fb-green)' : 'var(--fb-text-secondary)',
                        }}
                      >
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <NewPlanModal
        show={showForm}
        projectId={project.id}
        onHide={() => setShowForm(false)}
        onCreated={() => { setShowForm(false); load(); }}
      />
    </div>
  );
}

function NewPlanModal({ show, projectId, onHide, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '0',
    currency: 'USD',
    duration_days: '30',
    is_active: true,
  });
  const [features, setFeatures] = useState([]);
  const [saving, setSaving] = useState(false);
  // Until the slug is hand-edited it follows the name.
  const [slugTouched, setSlugTouched] = useState(false);

  function reset() {
    setForm({
      name: '', slug: '', description: '', price: '0',
      currency: 'USD', duration_days: '30', is_active: true,
    });
    setFeatures([]);
    setSlugTouched(false);
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setFeature(index, key, value) {
    setFeatures((list) => list.map((f, i) => {
      if (i !== index) return f;
      const next = { ...f, [key]: value };
      // Switching type makes the old literal meaningless — reset to a sane default.
      if (key === 'feature_type') {
        next.feature_value = value === 'boolean' ? 'true' : value === 'number' ? '0' : '{}';
      }
      return next;
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPlan({
        project_id: projectId,
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        price: Number(form.price),
        currency: form.currency.toUpperCase(),
        duration_days: Number(form.duration_days),
        is_active: form.is_active,
        features: features
          .filter((f) => f.feature_key.trim() !== '')
          .map((f) => ({
            feature_key: f.feature_key.trim(),
            feature_type: f.feature_type,
            feature_value: castFeatureValue(f),
          })),
      });
      showToast('Plan created', 'success');
      reset();
      onCreated();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 17 }}>New subscription plan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Name</Form.Label>
              <Form.Control
                size="sm"
                required
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!slugTouched) set('slug', slugify(e.target.value));
                }}
                placeholder="Premium"
              />
            </Col>
            <Col md={6}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Slug</Form.Label>
              <Form.Control
                size="sm"
                required
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }}
                placeholder="premium"
                style={{ fontFamily: 'monospace' }}
              />
            </Col>
            <Col xs={12}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Description</Form.Label>
              <Form.Control
                size="sm"
                as="textarea"
                rows={2}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What this plan gives a subscriber."
              />
            </Col>
            <Col md={4}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Price</Form.Label>
              <Form.Control
                size="sm"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
              <Form.Text style={{ fontSize: 11 }}>0 makes it a free plan — no payment is taken.</Form.Text>
            </Col>
            <Col md={4}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Currency</Form.Label>
              <Form.Control
                size="sm"
                required
                maxLength={3}
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
            </Col>
            <Col md={4}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Duration (days)</Form.Label>
              <Form.Control
                size="sm"
                type="number"
                min="1"
                required
                value={form.duration_days}
                onChange={(e) => set('duration_days', e.target.value)}
              />
            </Col>
            <Col xs={12}>
              <Form.Check
                type="switch"
                id="plan-active"
                label="Active — subscribers can pick this plan"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                style={{ fontSize: 13 }}
              />
            </Col>
          </Row>

          <hr style={{ borderColor: 'var(--fb-border)', margin: '20px 0' }} />

          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="config-card-title mb-0">
              <i className="bi bi-toggles"></i>Features
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setFeatures((l) => [...l, { ...EMPTY_FEATURE }])}
            >
              <i className="bi bi-plus-lg me-1"></i>Add feature
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', marginBottom: 10 }}>
            A flag gates access on or off. A limit is the quota that feature rules count usage against.
          </div>

          {features.length === 0 ? (
            <div className="text-muted" style={{ fontSize: 13 }}>
              No features — the plan grants a bare subscription with no gated capabilities.
            </div>
          ) : features.map((f, i) => (
            <Row className="g-2 mb-2 align-items-end" key={i}>
              <Col md={4}>
                <Form.Control
                  size="sm"
                  placeholder="feature_key"
                  value={f.feature_key}
                  onChange={(e) => setFeature(i, 'feature_key', e.target.value)}
                  style={{ fontFamily: 'monospace' }}
                />
              </Col>
              <Col md={4}>
                <Form.Select
                  size="sm"
                  value={f.feature_type}
                  onChange={(e) => setFeature(i, 'feature_type', e.target.value)}
                >
                  {FEATURE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                {f.feature_type === 'boolean' ? (
                  <Form.Select
                    size="sm"
                    value={f.feature_value}
                    onChange={(e) => setFeature(i, 'feature_value', e.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </Form.Select>
                ) : (
                  <Form.Control
                    size="sm"
                    type={f.feature_type === 'number' ? 'number' : 'text'}
                    value={f.feature_value}
                    onChange={(e) => setFeature(i, 'feature_value', e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                )}
              </Col>
              <Col md={1}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100"
                  onClick={() => setFeatures((l) => l.filter((_, idx) => idx !== i))}
                  aria-label="Remove feature"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </Col>
            </Row>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="outline-secondary" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button size="sm" variant="primary" type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" animation="border" className="me-1" />Creating…</> : 'Create plan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

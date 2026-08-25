import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table, Modal, Form, Button } from 'react-bootstrap';
import { getFeatureRules, createFeatureRule, getPlans } from '../../api/subscriptions';
import { showToast } from '../../components/Toast';
import { getApiError } from '../../lib/utils';

// Mirrors SubscriptionFeatureRule's ACTION_* / RESET_* constants.
const ACTIONS = [
  { value: 'check', label: 'Check only', hint: 'Block the event when the quota is already spent.' },
  { value: 'increment', label: 'Increment only', hint: 'Count the usage without enforcing a ceiling.' },
  { value: 'both', label: 'Check + increment', hint: 'Enforce the quota, then count the usage.' },
];

const RESET_TYPES = ['never', 'daily', 'monthly', 'yearly'];

const ACTION_STYLE = {
  check: { bg: 'var(--fb-yellow-bg)', color: 'var(--fb-yellow)' },
  increment: { bg: 'var(--fb-blue-bg)', color: 'var(--fb-blue)' },
  both: { bg: 'var(--fb-green-bg)', color: 'var(--fb-green)' },
};

export default function FeatureRulesPage() {
  const { project } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [featureKeys, setFeatureKeys] = useState([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await getFeatureRules();
      setRules(res.data?.data ?? res.data ?? []);
    } catch (e) {
      setError(getApiError(e));
    } finally {
      setLoading(false);
    }
  }

  // The loading flag is flipped inside load(), which the rule sees as a
  // synchronous setState. That is the intended shape for a data fetch (and what
  // every other list page here does) — the advisory is about derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  // Offer the feature keys that actually exist across this project's plans, so
  // a rule can't be pointed at a key no plan grants (which would make every
  // event fail with FEATURE_REQUIRED).
  useEffect(() => {
    getPlans(project.id)
      .then((res) => {
        const plans = res.data?.data ?? res.data ?? [];
        const keys = plans.flatMap((p) => (p.features ?? []).map((f) => f.feature_key));
        setFeatureKeys([...new Set(keys)].sort());
      })
      .catch(() => {});
  }, [project.id]);

  const activeCount = rules.filter((r) => r.is_active).length;
  const events = [...new Set(rules.map((r) => r.event_key))];
  const metered = rules.filter((r) => r.reset_type !== 'never').length;

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Feature rules</h2>
          <p className="page-subtitle">
            Which domain event consumes which plan feature — the quota engine behind usage limits.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>New rule
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      <Row className="g-3 mb-4">
        {[
          { label: 'Total rules', value: rules.length, accent: 'accent-blue', icon: 'bi-diagram-2' },
          { label: 'Active', value: activeCount, accent: 'accent-green', icon: 'bi-check-circle' },
          { label: 'Tracked events', value: events.length, accent: 'accent-cyan', icon: 'bi-lightning' },
          { label: 'Periodic reset', value: metered, accent: 'accent-purple', icon: 'bi-arrow-clockwise' },
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
                  {['Event key', 'Feature key', 'Action', 'Reset', 'Status'].map((h) => (
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
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No feature rules yet. Without one, an event consumes no quota at all.
                    </td>
                  </tr>
                ) : rules.map((rule) => {
                  const style = ACTION_STYLE[rule.action] ?? ACTION_STYLE.check;
                  return (
                    <tr key={rule.id}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 500 }}>
                        {rule.event_key}
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                        {rule.feature_key}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 100,
                            background: style.bg,
                            color: style.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rule.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)' }}>
                        {rule.reset_type}
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
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      <NewRuleModal
        show={showForm}
        projectId={project.id}
        featureKeys={featureKeys}
        onHide={() => setShowForm(false)}
        onCreated={() => { setShowForm(false); load(); }}
      />
    </div>
  );
}

function NewRuleModal({ show, projectId, featureKeys, onHide, onCreated }) {
  const [form, setForm] = useState({
    event_key: '',
    feature_key: '',
    action: 'both',
    reset_type: 'monthly',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createFeatureRule({
        project_id: projectId,
        event_key: form.event_key.trim(),
        feature_key: form.feature_key.trim(),
        action: form.action,
        reset_type: form.reset_type,
        is_active: form.is_active,
      });
      showToast('Feature rule created', 'success');
      setForm({ event_key: '', feature_key: '', action: 'both', reset_type: 'monthly', is_active: true });
      onCreated();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  const actionHint = ACTIONS.find((a) => a.value === form.action)?.hint;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 17 }}>New feature rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Event key</Form.Label>
              <Form.Control
                size="sm"
                required
                value={form.event_key}
                onChange={(e) => set('event_key', e.target.value)}
                placeholder="articles.create"
                style={{ fontFamily: 'monospace' }}
              />
              <Form.Text style={{ fontSize: 11 }}>
                The event the backend dispatches, usually <code>&lt;data-type-slug&gt;.create</code>.
              </Form.Text>
            </Col>
            <Col xs={12}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Feature key</Form.Label>
              <Form.Control
                size="sm"
                required
                list="plan-feature-keys"
                value={form.feature_key}
                onChange={(e) => set('feature_key', e.target.value)}
                placeholder="monthly_articles"
                style={{ fontFamily: 'monospace' }}
              />
              <datalist id="plan-feature-keys">
                {featureKeys.map((k) => <option key={k} value={k} />)}
              </datalist>
              <Form.Text style={{ fontSize: 11 }}>
                {featureKeys.length > 0
                  ? 'Suggestions come from the features your plans already define.'
                  : 'No plan features exist yet — a rule pointing at a missing key rejects the event.'}
              </Form.Text>
            </Col>
            <Col md={6}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Action</Form.Label>
              <Form.Select size="sm" value={form.action} onChange={(e) => set('action', e.target.value)}>
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Form.Select>
              <Form.Text style={{ fontSize: 11 }}>{actionHint}</Form.Text>
            </Col>
            <Col md={6}>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Reset period</Form.Label>
              <Form.Select size="sm" value={form.reset_type} onChange={(e) => set('reset_type', e.target.value)}>
                {RESET_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </Form.Select>
              <Form.Text style={{ fontSize: 11 }}>
                How often the counter returns to zero.
              </Form.Text>
            </Col>
            <Col xs={12}>
              <Form.Check
                type="switch"
                id="rule-active"
                label="Active — the rule is enforced on matching events"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                style={{ fontSize: 13 }}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="outline-secondary" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button size="sm" variant="primary" type="submit" disabled={saving}>
            {saving ? <><Spinner size="sm" animation="border" className="me-1" />Creating…</> : 'Create rule'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

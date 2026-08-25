import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table, Form, InputGroup } from 'react-bootstrap';
import { getProjectSubscriptions, getPlans } from '../../api/subscriptions';
import { getApiError } from '../../lib/utils';

const STATUS_STYLE = {
  active: { bg: 'var(--fb-green-bg)', color: 'var(--fb-green)', icon: 'bi-check-circle-fill' },
  pending: { bg: 'var(--fb-yellow-bg)', color: 'var(--fb-yellow)', icon: 'bi-hourglass-split' },
  grace_period: { bg: 'var(--fb-orange-bg)', color: 'var(--fb-orange)', icon: 'bi-exclamation-triangle-fill' },
  expired: { bg: 'var(--fb-body-bg)', color: 'var(--fb-text-secondary)', icon: 'bi-clock-history' },
  cancelled: { bg: 'var(--fb-red-bg)', color: 'var(--fb-red)', icon: 'bi-x-circle-fill' },
};

const STATUSES = ['active', 'pending', 'grace_period', 'expired', 'cancelled'];

function fmt(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' });
}

// Days until expiry — negative once it has lapsed.
function daysLeft(endsAt) {
  if (!endsAt) return null;
  const d = new Date(endsAt);
  if (isNaN(d)) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.expired;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 100,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      <i className={`bi ${s.icon} me-1`} style={{ fontSize: 10 }}></i>
      {status.replace('_', ' ')}
    </span>
  );
}

// Each subscription carries its own usage rows, so the quota picture is per
// subscriber rather than per plan.
function UsageCell({ usages }) {
  if (!usages || usages.length === 0) {
    return <span style={{ fontSize: 12, color: 'var(--fb-text-secondary)' }}>—</span>;
  }
  return (
    <div className="d-flex flex-wrap gap-1">
      {usages.map((u) => (
        <span
          key={u.id ?? u.feature_key}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 100,
            background: 'var(--fb-body-bg)',
            color: 'var(--fb-text-secondary)',
            fontFamily: 'monospace',
          }}
          title={u.reset_at ? `Resets ${fmt(u.reset_at)}` : 'Never resets'}
        >
          {u.feature_key} {u.used_value}
        </span>
      ))}
    </div>
  );
}

export default function SubscribersPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [plans, setPlans] = useState([]);

  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [userId, setUserId] = useState('');
  const [appliedUserId, setAppliedUserId] = useState('');
  const [page, setPage] = useState(1);

  const { project } = useOutletContext();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { page, per_page: 25 };
      if (status) params.status = status;
      if (planId) params.plan_id = planId;
      if (appliedUserId) params.user_id = appliedUserId;
      const res = await getProjectSubscriptions(params);
      setRows(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
      setStats(res.data?.stats ?? null);
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
  useEffect(() => { load(); }, [page, status, planId, appliedUserId]);

  // Plans populate the filter dropdown and let the table fall back to a plan
  // name when a row has no eager-loaded plan.
  useEffect(() => {
    getPlans(project.id)
      .then((res) => setPlans(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, [project.id]);

  const byStatus = stats?.by_status ?? {};

  return (
    <div>
      <div className="page-header d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h2>Subscribers</h2>
          <p className="page-subtitle">
            Every subscription in this project — plan, period, and quota consumed so far.
          </p>
        </div>
        <button className="btn btn-sm btn-outline-primary" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

      {stats && (
        <Row className="g-3 mb-4">
          {[
            { label: 'Total', value: stats.total, accent: 'accent-blue', icon: 'bi-people' },
            {
              label: 'Active', value: byStatus.active ?? 0, accent: 'accent-green',
              icon: 'bi-check-circle', color: 'var(--fb-green)',
            },
            { label: 'Pending', value: byStatus.pending ?? 0, accent: 'accent-cyan', icon: 'bi-hourglass-split' },
            {
              label: 'Grace period', value: byStatus.grace_period ?? 0, accent: 'accent-orange',
              icon: 'bi-exclamation-triangle',
              color: (byStatus.grace_period ?? 0) > 0 ? 'var(--fb-orange)' : undefined,
            },
            {
              label: 'Cancelled', value: byStatus.cancelled ?? 0, accent: 'accent-red',
              icon: 'bi-x-circle',
            },
            { label: 'Expired', value: byStatus.expired ?? 0, accent: 'accent-purple', icon: 'bi-clock-history' },
          ].map((s, i) => (
            <Col key={s.label} xs={6} md>
              <Card className="search-stat-card search-enter h-100" style={{ animationDelay: `${i * 35}ms` }}>
                <Card.Body className={`p-3 ${s.accent}`}>
                  <div className="search-stat-label"><i className={`bi ${s.icon}`}></i>{s.label}</div>
                  <div className="search-stat-value" style={{ color: s.color }}>{s.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filter bar */}
      <Card className="mb-3 search-enter">
        <Card.Body className="p-3">
          <div className="d-flex gap-2 flex-wrap align-items-end">
            <InputGroup size="sm" style={{ flex: '1 1 180px', maxWidth: 240 }}>
              <InputGroup.Text style={{ background: 'transparent' }}>
                <i className="bi bi-person" style={{ fontSize: 12 }}></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="User ID…"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setPage(1); setAppliedUserId(userId.trim()); }
                }}
              />
            </InputGroup>
            <Form.Select
              size="sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              style={{ width: 165 }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </Form.Select>
            <Form.Select
              size="sm"
              value={planId}
              onChange={(e) => { setPlanId(e.target.value); setPage(1); }}
              style={{ width: 190 }}
            >
              <option value="">All plans</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Form.Select>
            {(status || planId || appliedUserId) && (
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setStatus(''); setPlanId(''); setUserId(''); setAppliedUserId(''); setPage(1);
                }}
              >
                <i className="bi bi-x-lg me-1"></i>Clear
              </button>
            )}
          </div>
        </Card.Body>
      </Card>

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
                  {['User', 'Plan', 'Status', 'Started', 'Ends', 'Renew', 'Usage'].map((h) => (
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
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                      No subscriptions match this filter.
                    </td>
                  </tr>
                ) : rows.map((sub) => {
                  const left = daysLeft(sub.ends_at);
                  const planName = sub.plan?.name
                    ?? plans.find((p) => p.id === sub.plan_id)?.name
                    ?? `#${sub.plan_id}`;
                  return (
                    <tr key={sub.id}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 500 }}>
                        {sub.user_id}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{planName}</td>
                      <td style={{ padding: '10px 16px' }}><StatusBadge status={sub.status} /></td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--fb-text-secondary)', whiteSpace: 'nowrap' }}>
                        {fmt(sub.starts_at)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--fb-text-secondary)' }}>{fmt(sub.ends_at)}</span>
                        {left != null && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: left < 0 ? 'var(--fb-red)' : left <= 7 ? 'var(--fb-orange)' : 'var(--fb-text-secondary)',
                            }}
                          >
                            {left < 0 ? `${Math.abs(left)}d overdue` : `${left}d left`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {sub.auto_renew ? (
                          <i className="bi bi-arrow-repeat" style={{ color: 'var(--fb-green)' }} title="Auto-renew on"></i>
                        ) : (
                          <i className="bi bi-dash" style={{ color: 'var(--fb-text-secondary)' }} title="Auto-renew off"></i>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px' }}><UsageCell usages={sub.usages} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          {meta && meta.last_page > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3" style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--fb-text-secondary)' }}>{meta.total} total subscriptions</span>
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
    </div>
  );
}

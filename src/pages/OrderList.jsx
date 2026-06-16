import { useState, useEffect } from 'react';
import { Link, useOutletContext, Navigate } from 'react-router-dom';
import { Card, Badge, Spinner, Form } from 'react-bootstrap';
import { listAllOrders } from '../api/ecommerce';
import { ORDER_STATUSES, ORDER_STATUS_VARIANT, extractList } from '../lib/commerce';
import { getApiError } from '../lib/utils';
import { showToast } from '../components/Toast';

function money(v, currency) {
  if (v == null) return '—';
  const n = Number(v);
  return `${currency || 'USD'} ${Number.isFinite(n) ? n.toFixed(2) : v}`;
}

export default function OrderList() {
  const { project } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (ecommerceEnabled) loadOrders(statusFilter);
  }, [ecommerceEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOrders(status) {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await listAllOrders(params);
      setOrders(extractList(res));
    } catch (err) {
      showToast(getApiError(err), 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(value) {
    setStatusFilter(value);
    loadOrders(value);
  }

  if (!ecommerceEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Orders</h2>
          <p className="page-subtitle">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Form.Select
          size="sm"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Form.Select>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-bag-check"></i></div>
          <div className="empty-title">No orders</div>
          <div className="empty-desc">
            Orders placed by customers will appear here.
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/projects/${projectSlug}/commerce/orders/${o.id}`}
              className="collection-card-link"
            >
              <Card>
                <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                      Order #{o.id}
                    </div>
                    <div className="d-flex gap-2 mt-1 align-items-center flex-wrap">
                      <Badge bg={ORDER_STATUS_VARIANT[o.status] || 'secondary'}>{o.status}</Badge>
                      <span style={{ fontSize: 12, color: '#5f6368' }}>
                        {(o.items?.length ?? o.items_count ?? 0)} item{(o.items?.length ?? o.items_count ?? 0) !== 1 ? 's' : ''}
                      </span>
                      {o.user_id && (
                        <span style={{ fontSize: 12, color: '#5f6368' }}>User #{o.user_id}</span>
                      )}
                      {o.created_at && (
                        <span style={{ fontSize: 12, color: '#5f6368' }}>
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                    {money(o.total_price, o.currency)}
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

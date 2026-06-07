import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Navigate, Link } from 'react-router-dom';
import { Card, Badge, Spinner, Form, Button, Row, Col } from 'react-bootstrap';
import { getOrder, updateOrderStatus } from '../api/ecommerce';
import { getApiError } from '../lib/utils';
import { showToast } from '../components/Toast';
import { ORDER_STATUSES, ORDER_STATUS_VARIANT } from '../lib/commerce';

function money(v, currency) {
  if (v == null) return '—';
  const n = Number(v);
  return `${currency || 'USD'} ${Number.isFinite(n) ? n.toFixed(2) : v}`;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const { project } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ecommerceEnabled) loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecommerceEnabled, orderId]);

  async function loadOrder() {
    setLoading(true);
    try {
      const res = await getOrder(orderId);
      const data = res.data?.data ?? res.data;
      setOrder(data);
      setStatus(data?.status || '');
    } catch (err) {
      showToast(getApiError(err), 'error');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveStatus() {
    if (saving || !status || status === order.status) return;
    setSaving(true);
    try {
      await updateOrderStatus(orderId, status);
      showToast('Order status updated', 'success');
      loadOrder();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!ecommerceEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><i className="bi bi-bag-x"></i></div>
        <div className="empty-title">Order not found</div>
        <Link to={`/projects/${projectSlug}/commerce/orders`} className="btn btn-primary btn-sm mt-2">
          Back to orders
        </Link>
      </div>
    );
  }

  const addr = order.address || {};
  const items = order.items || [];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <Link to={`/projects/${projectSlug}/commerce/orders`} className="back-link d-inline-flex mb-2">
            <i className="bi bi-arrow-left"></i> Orders
          </Link>
          <h2>Order #{order.id}</h2>
          <p className="page-subtitle">
            <Badge bg={ORDER_STATUS_VARIANT[order.status] || 'secondary'}>{order.status}</Badge>
            <span className="ms-2">{money(order.total_price, order.currency)}</span>
          </p>
        </div>
      </div>

      <Row className="g-3">
        <Col md={8}>
          <Card>
            <Card.Body className="p-3">
              <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Items</h6>
              {items.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No items on this order.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {items.map((it) => (
                    <div key={it.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                      <div>
                        <div className="fw-medium" style={{ fontSize: 14 }}>
                          {it.entry?.values?.title || it.entry?.values?.name || it.entry?.slug || `Product #${it.product_id}`}
                        </div>
                        <div style={{ fontSize: 12, color: '#5f6368' }}>
                          {money(it.price, order.currency)} × {it.quantity}
                          {it.status && <> · {it.status}</>}
                        </div>
                      </div>
                      <div className="fw-medium" style={{ fontSize: 14 }}>
                        {money(it.total ?? (Number(it.price) * Number(it.quantity)), order.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Body className="p-3">
              <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Update status</h6>
              <Form.Select
                size="sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mb-2"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Form.Select>
              <Button
                size="sm"
                onClick={handleSaveStatus}
                disabled={saving || !status || status === order.status}
              >
                {saving ? <Spinner size="sm" animation="border" /> : 'Save status'}
              </Button>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-3">
              <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Shipping</h6>
              <div style={{ fontSize: 13, color: '#3c4043' }}>
                {addr.full_address && <div>{addr.full_address}</div>}
                {(addr.street || addr.city) && <div>{[addr.street, addr.city].filter(Boolean).join(', ')}</div>}
                {addr.phone && <div className="text-muted">{addr.phone}</div>}
                {!addr.full_address && !addr.city && !addr.phone && (
                  <div className="text-muted">No address on file.</div>
                )}
              </div>
              {order.user_id && (
                <div className="mt-2" style={{ fontSize: 12, color: '#5f6368' }}>
                  Customer: User #{order.user_id}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

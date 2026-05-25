import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import {
  getResource,
  updateResource,
  setAvailability,
  setPolicy,
  getResourceBookings,
} from '../api/booking';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BOOKING_STATUS_VARIANTS = {
  pending: 'secondary',
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'primary',
  no_show: 'warning',
};

function emptyAvailability(day = 0) {
  return {
    day_of_week: day,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration: 60,
    is_active: true,
  };
}

function emptyPolicy() {
  return { hours_before: 24, refund_percentage: 50, description: '' };
}

export default function BookingResourceDetail() {
  const { project } = useOutletContext();
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const projectSlug = project.slug;

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getResource(resourceId);
      setResource(res.data?.data || res.data || null);
    } catch (err) {
      showToast(getApiError(err), 'error');
      setResource(null);
    } finally {
      setLoading(false);
    }
  }, [resourceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><i className="bi bi-exclamation-circle"></i></div>
        <div className="empty-title">Resource not found</div>
        <Button as={Link} to={`/projects/${projectSlug}/booking/resources`} variant="primary" size="sm">
          Back to resources
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <Button
          variant="link"
          className="p-0 mb-2"
          onClick={() => navigate(`/projects/${projectSlug}/booking/resources`)}
          style={{ fontSize: 13, color: '#5f6368', textDecoration: 'none' }}
        >
          <i className="bi bi-arrow-left me-1"></i>All resources
        </Button>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1">{resource.name}</h2>
            <div className="d-flex gap-2 align-items-center">
              <Badge bg="info">{resource.type}</Badge>
              <Badge bg={resource.status === 'active' ? 'success' : 'secondary'}>{resource.status}</Badge>
              <Badge bg={resource.payment_type === 'paid' ? 'warning' : 'light'} text="dark">
                {resource.payment_type === 'paid' ? `Paid · ${resource.price}` : 'Free'}
              </Badge>
              <span style={{ fontSize: 12, color: '#5f6368' }}>Capacity: {resource.capacity}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="info" title="Info">
          <InfoTab resource={resource} onSaved={load} />
        </Tab>
        <Tab eventKey="availability" title="Availability">
          <AvailabilityTab resource={resource} onSaved={load} />
        </Tab>
        <Tab eventKey="policy" title="Cancellation policy">
          <PolicyTab resource={resource} onSaved={load} />
        </Tab>
        <Tab eventKey="bookings" title="Bookings">
          <BookingsTab resourceId={resource.id} />
        </Tab>
      </Tabs>
    </div>
  );
}

// ─── Info tab ─────────────────────────────────────────────────────────────────

function InfoTab({ resource, onSaved }) {
  const [form, setForm] = useState({
    name: resource.name || '',
    type: resource.type || '',
    capacity: resource.capacity || 1,
    status: resource.status || 'active',
    payment_type: resource.payment_type || 'free',
    price: resource.price ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type.trim(),
        capacity: Number(form.capacity) || 1,
        status: form.status,
        payment_type: form.payment_type,
      };
      // Backend rejects price < 0.01 even when payment_type is free. Only send it when paid.
      if (form.payment_type === 'paid' && form.price !== '' && Number(form.price) > 0) {
        payload.price = Number(form.price);
      }
      await updateResource(resource.id, payload);
      showToast('Resource updated', 'success');
      onSaved();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Card.Body className="p-4">
        <Form onSubmit={handleSave}>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Payment</Form.Label>
                <Form.Select
                  value={form.payment_type}
                  onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </Form.Select>
              </Form.Group>
            </Col>
            {form.payment_type === 'paid' && (
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
          <div className="mt-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Save changes'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

// ─── Availability tab ─────────────────────────────────────────────────────────

function AvailabilityTab({ resource, onSaved }) {
  const initial = (resource.active_availabilities || resource.availabilities || []).map((a) => ({
    day_of_week: a.day_of_week,
    start_time: (a.start_time || '09:00').slice(0, 5),
    end_time: (a.end_time || '17:00').slice(0, 5),
    slot_duration: a.slot_duration || 60,
    is_active: a.is_active ?? true,
  }));

  const [rows, setRows] = useState(initial.length > 0 ? initial : [emptyAvailability(1)]);
  const [saving, setSaving] = useState(false);

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyAvailability(prev.length % 7)]);
  }

  async function handleSave() {
    if (saving) return;
    if (rows.length === 0) {
      showToast('Add at least one availability window', 'error');
      return;
    }
    setSaving(true);
    try {
      await setAvailability(resource.id, rows);
      showToast('Availability saved', 'success');
      onSaved();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Card.Body className="p-4">
        <p className="mb-3" style={{ fontSize: 13, color: '#5f6368' }}>
          Define when this resource is open for booking. Each row covers one day of the week.
          Saving replaces all existing windows.
        </p>

        <div className="table-responsive">
          <table className="table column-table mb-0">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Day</th>
                <th style={{ width: 130 }}>Start</th>
                <th style={{ width: 130 }}>End</th>
                <th style={{ width: 130 }}>Slot (min)</th>
                <th style={{ width: 100 }}>Active</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <Form.Select
                      size="sm"
                      value={r.day_of_week}
                      onChange={(e) => updateRow(i, { day_of_week: Number(e.target.value) })}
                    >
                      {DAY_LABELS.map((label, d) => (
                        <option key={d} value={d}>{label}</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      size="sm"
                      value={r.start_time}
                      onChange={(e) => updateRow(i, { start_time: e.target.value })}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="time"
                      size="sm"
                      value={r.end_time}
                      onChange={(e) => updateRow(i, { end_time: e.target.value })}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      min="5"
                      value={r.slot_duration}
                      onChange={(e) => updateRow(i, { slot_duration: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      checked={r.is_active}
                      onChange={(e) => updateRow(i, { is_active: e.target.checked })}
                    />
                  </td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => removeRow(i)}
                      style={{ color: '#5f6368' }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex gap-2 mt-3">
          <Button variant="outline-primary" size="sm" onClick={addRow}>
            <i className="bi bi-plus-lg me-1"></i>Add window
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Save availability'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

// ─── Policy tab ───────────────────────────────────────────────────────────────

function PolicyTab({ resource, onSaved }) {
  const initial = (resource.cancellation_policies || []).map((p) => ({
    hours_before: p.hours_before,
    refund_percentage: p.refund_percentage,
    description: p.description || '',
  }));

  const [rows, setRows] = useState(initial.length > 0 ? initial : [emptyPolicy()]);
  const [saving, setSaving] = useState(false);

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyPolicy()]);
  }

  async function handleSave() {
    if (saving) return;
    if (rows.length === 0) {
      showToast('Add at least one policy row', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = rows.map((r) => ({
        hours_before: Number(r.hours_before),
        refund_percentage: Number(r.refund_percentage),
        description: r.description || null,
      }));
      await setPolicy(resource.id, payload);
      showToast('Cancellation policy saved', 'success');
      onSaved();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <Card.Body className="p-4">
        <p className="mb-3" style={{ fontSize: 13, color: '#5f6368' }}>
          When a customer cancels, the booking service finds the matching tier and refunds the
          listed percentage. Use multiple tiers for sliding-scale refunds (e.g. 100% if 48h before,
          50% if 24h, 0% otherwise). Saving replaces all existing rules.
        </p>

        <div className="table-responsive">
          <table className="table column-table mb-0">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Hours before</th>
                <th style={{ width: 160 }}>Refund %</th>
                <th>Description</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      min="0"
                      value={r.hours_before}
                      onChange={(e) => updateRow(i, { hours_before: e.target.value })}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      size="sm"
                      min="0"
                      max="100"
                      value={r.refund_percentage}
                      onChange={(e) => updateRow(i, { refund_percentage: e.target.value })}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="Optional explanation"
                      value={r.description}
                      onChange={(e) => updateRow(i, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => removeRow(i)}
                      style={{ color: '#5f6368' }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex gap-2 mt-3">
          <Button variant="outline-primary" size="sm" onClick={addRow}>
            <i className="bi bi-plus-lg me-1"></i>Add tier
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Save policy'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

// ─── Bookings tab ─────────────────────────────────────────────────────────────

function BookingsTab({ resourceId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body = {};
      if (filters.status) body.status = filters.status;
      if (filters.from) body.from = filters.from;
      if (filters.to) body.to = filters.to;

      const res = await getResourceBookings(resourceId, body);
      setBookings(res.data?.data || res.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [resourceId, filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <Card.Body className="p-4">
        <Row className="g-2 mb-3">
          <Col md={3}>
            <Form.Select
              size="sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
              <option value="no_show">No-show</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Control
              size="sm"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              size="sm"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </Col>
        </Row>

        {loading ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-4" style={{ fontSize: 13, color: '#5f6368' }}>
            No bookings match these filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table column-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Refund</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="font-monospace" style={{ fontSize: 12 }}>#{b.id}</td>
                    <td style={{ fontSize: 13 }}>{b.user_id ?? '-'}</td>
                    <td style={{ fontSize: 13 }}>
                      {b.start_at ? new Date(b.start_at).toLocaleString() : '-'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.end_at ? new Date(b.end_at).toLocaleString() : '-'}
                    </td>
                    <td>
                      <Badge bg={BOOKING_STATUS_VARIANTS[b.status] || 'secondary'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.amount} {b.currency}
                    </td>
                    <td style={{ fontSize: 13 }}>{b.refund_amount ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

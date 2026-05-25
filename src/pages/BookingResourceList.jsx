import { useState, useEffect } from 'react';
import { Link, useOutletContext, Navigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { listResources, createResource, deleteResource } from '../api/booking';
import { getEntriesByDataType } from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const STATUS_VARIANTS = {
  active: 'success',
  inactive: 'secondary',
};

export default function BookingResourceList() {
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;
  const bookingEnabled = (project.enabled_modules || []).includes('booking');

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Entry picker state — when the user selects a data type we fetch its entries
  // so they can attach the resource to a specific CMS entry (e.g. a "Room").
  const [entriesByType, setEntriesByType] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'room',
    capacity: 1,
    payment_type: 'free',
    price: '',
    data_type_slug: '',
    data_entry_id: '',
  });

  useEffect(() => {
    if (bookingEnabled) loadResources();
  }, [bookingEnabled]);

  async function loadResources() {
    setLoading(true);
    try {
      const res = await listResources();
      setResources(res.data?.data || res.data || []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadEntriesForType(typeSlug) {
    if (!typeSlug) {
      setEntriesByType([]);
      return;
    }
    setLoadingEntries(true);
    try {
      const res = await getEntriesByDataType(project.id, typeSlug, { per_page: 100 });
      const data = res.data || {};
      setEntriesByType(data.entries || data.data || []);
    } catch {
      setEntriesByType([]);
    } finally {
      setLoadingEntries(false);
    }
  }

  function handleTypeChange(slug) {
    setForm((f) => ({ ...f, data_type_slug: slug, data_entry_id: '' }));
    loadEntriesForType(slug);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.type.trim() || !form.data_entry_id) return;
    if (form.payment_type === 'paid' && (!form.price || Number(form.price) <= 0)) return;

    setSaving(true);
    try {
      const payload = {
        data_entry_id: Number(form.data_entry_id),
        name: form.name.trim(),
        type: form.type.trim(),
        capacity: Number(form.capacity) || 1,
        payment_type: form.payment_type,
      };
      if (form.payment_type === 'paid') {
        payload.price = Number(form.price);
      }

      await createResource(payload);
      showToast('Resource created', 'success');
      setForm({
        name: '',
        type: 'room',
        capacity: 1,
        payment_type: 'free',
        price: '',
        data_type_slug: '',
        data_entry_id: '',
      });
      setEntriesByType([]);
      setShowForm(false);
      loadResources();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId || deleting) return;
    setDeleting(true);
    try {
      await deleteResource(deleteId);
      showToast('Resource deleted', 'info');
      setDeleteId(null);
      loadResources();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  // The booking module isn't enabled for this project — bounce back to the overview
  // rather than showing an empty page.
  if (!bookingEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Booking Resources</h2>
          <p className="page-subtitle">
            {resources.length} bookable resource{resources.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1"></i>New resource
        </Button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : resources.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-calendar-check"></i></div>
          <div className="empty-title">No resources yet</div>
          <div className="empty-desc">
            A resource is a bookable item — a room, a court, a doctor, a table.
            Create one to start accepting bookings.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>Create resource
          </Button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {resources.map((r) => (
            <Link
              key={r.id}
              to={`/projects/${projectSlug}/booking/resources/${r.id}`}
              className="collection-card-link"
            >
              <Card>
                <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                      {r.name}
                    </div>
                    <div className="d-flex gap-2 mt-1 align-items-center">
                      <Badge bg="info">{r.type}</Badge>
                      <Badge bg={STATUS_VARIANTS[r.status] || 'secondary'}>{r.status}</Badge>
                      <Badge bg={r.payment_type === 'paid' ? 'warning' : 'light'} text={r.payment_type === 'paid' ? 'dark' : 'dark'}>
                        {r.payment_type === 'paid' ? `Paid · ${r.price}` : 'Free'}
                      </Badge>
                      <span style={{ fontSize: 12, color: '#5f6368' }}>
                        Capacity: {r.capacity}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteId(r.id);
                    }}
                    style={{ color: '#5f6368' }}
                    aria-label={`Delete ${r.name}`}
                  >
                    <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
                  </Button>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <Card className="mt-3">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>New resource</h6>
            <Form onSubmit={handleCreate}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Room 101"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      autoFocus
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="room, court, doctor..."
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
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Linked content (data type)</Form.Label>
                    <Form.Select
                      value={form.data_type_slug}
                      onChange={(e) => handleTypeChange(e.target.value)}
                    >
                      <option value="">Select a data type...</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.slug}>{dt.name}</option>
                      ))}
                    </Form.Select>
                    <Form.Text>Pick the data type that holds this resource's content</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Linked entry</Form.Label>
                    <Form.Select
                      value={form.data_entry_id}
                      onChange={(e) => setForm({ ...form, data_entry_id: e.target.value })}
                      disabled={!form.data_type_slug || loadingEntries}
                    >
                      <option value="">
                        {!form.data_type_slug
                          ? 'Pick a data type first'
                          : loadingEntries
                            ? 'Loading entries...'
                            : entriesByType.length === 0
                              ? 'No entries in this data type'
                              : 'Select an entry...'}
                      </option>
                      {entriesByType.map((en) => (
                        <option key={en.id} value={en.id}>
                          {en.slug || en.values?.title || en.values?.name || `#${en.id}`}
                        </option>
                      ))}
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
              <div className="d-flex gap-2 mt-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !form.name.trim()
                    || !form.type.trim()
                    || !form.data_entry_id
                    || (form.payment_type === 'paid' && (!form.price || Number(form.price) <= 0))
                    || saving
                  }
                >
                  {saving ? <Spinner size="sm" animation="border" /> : 'Create'}
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Delete modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete resource</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure? Deleting a resource also deletes its bookings, availability,
          and cancellation policies.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

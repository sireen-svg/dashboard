import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { listOffers, createOffer, deleteOffer, activateOffer, deactivateOffer } from '../api/ecommerce';
import { getFields } from '../api/cms';
import ConditionsBuilder from '../components/ConditionsBuilder';
import { cleanConditions } from '../lib/collectionConditions';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const BENEFIT_LABELS = {
  percentage: 'Percentage',
  fixed_amount: 'Fixed amount',
  buy_x_get_y: 'Buy X get Y',
  quantity: 'Quantity',
  total_price: 'Total price',
};

function offerSlug(o) {
  return o.collection?.slug || o.collection_slug || o.slug || null;
}

function isActive(o) {
  if (typeof o.is_active === 'boolean') return o.is_active;
  if (o.collection && typeof o.collection.is_active === 'boolean') return o.collection.is_active;
  return o.status === 'active';
}

export default function OfferList() {
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busySlug, setBusySlug] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: 'manual',
    data_type_id: '',
    benefit_type: 'percentage',
    benefit_value: '',
    is_code_offer: false,
    offer_duration: '',
    start_at: '',
    end_at: '',
    is_active: true,
    conditions_logic: 'and',
  });
  const [conditions, setConditions] = useState([]);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    if (ecommerceEnabled) loadOffers();
  }, [ecommerceEnabled]);

  // Load the selected data type's fields so dynamic-offer conditions can reference them by name.
  useEffect(() => {
    let cancelled = false;
    async function loadFields() {
      const dt = dataTypes.find((d) => d.id === Number(form.data_type_id));
      if (!form.data_type_id || !dt?.slug) {
        setFields([]);
        return;
      }
      setLoadingFields(true);
      try {
        const res = await getFields(dt.slug);
        if (!cancelled) setFields(res.data?.data || res.data || []);
      } catch {
        if (!cancelled) setFields([]);
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    }
    loadFields();
    return () => { cancelled = true; };
  }, [form.data_type_id, dataTypes]);

  async function loadOffers() {
    setLoading(true);
    try {
      const res = await listOffers();
      const data = res.data?.data ?? res.data ?? [];
      setOffers(Array.isArray(data) ? data : (data.offers || []));
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: '', type: 'manual', data_type_id: '', benefit_type: 'percentage',
      benefit_value: '', is_code_offer: false, offer_duration: '',
      start_at: '', end_at: '', is_active: true, conditions_logic: 'and',
    });
    setConditions([]);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.data_type_id || !form.benefit_value) return;

    // benefit_config shape depends on benefit_type. We support the two simple
    // money benefits here; richer types (buy_x_get_y, etc.) can be added later.
    const benefit_config = form.benefit_type === 'percentage'
      ? { percentage: Number(form.benefit_value) }
      : { fixed_amount: Number(form.benefit_value) };

    const payload = {
      name: form.name.trim(),
      type: form.type,
      data_type_id: Number(form.data_type_id),
      is_code_offer: form.is_code_offer,
      benefit_type: form.benefit_type,
      benefit_config,
      is_active: form.is_active,
    };
    if (form.type === 'dynamic') {
      payload.conditions = cleanConditions(conditions);
      payload.conditions_logic = form.conditions_logic;
    }
    if (form.is_code_offer && form.offer_duration) payload.offer_duration = Number(form.offer_duration);
    if (form.start_at) payload.start_at = form.start_at;
    if (form.end_at) payload.end_at = form.end_at;

    setSaving(true);
    try {
      await createOffer(payload);
      showToast('Offer created', 'success');
      resetForm();
      setShowForm(false);
      loadOffers();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(o) {
    const slug = offerSlug(o);
    if (!slug) {
      showToast('This offer has no collection slug to toggle', 'error');
      return;
    }
    setBusySlug(slug);
    try {
      if (isActive(o)) {
        await deactivateOffer(slug);
        showToast('Offer deactivated', 'info');
      } else {
        await activateOffer(slug);
        showToast('Offer activated', 'success');
      }
      loadOffers();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusySlug(null);
    }
  }

  async function handleDelete() {
    if (!deleteSlug || deleting) return;
    setDeleting(true);
    try {
      await deleteOffer(deleteSlug);
      showToast('Offer deleted', 'info');
      setDeleteSlug(null);
      loadOffers();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  if (!ecommerceEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Offers</h2>
          <p className="page-subtitle">
            {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1"></i>New offer
        </Button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : offers.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-tag"></i></div>
          <div className="empty-title">No offers yet</div>
          <div className="empty-desc">
            Offers apply discounts to products in a data type — a percentage off,
            a fixed amount, or a coupon code. Create one to start a promotion.
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>Create offer
          </Button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {offers.map((o) => {
            const slug = offerSlug(o);
            const active = isActive(o);
            return (
              <Card key={o.id || slug}>
                <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                      {o.name || o.collection?.name || slug || `Offer #${o.id}`}
                    </div>
                    <div className="d-flex gap-2 mt-1 align-items-center flex-wrap">
                      <Badge bg="info">{BENEFIT_LABELS[o.benefit_type] || o.benefit_type || 'offer'}</Badge>
                      <Badge bg={active ? 'success' : 'secondary'}>{active ? 'active' : 'inactive'}</Badge>
                      {o.is_code_offer && o.code && (
                        <Badge bg="warning" text="dark">Code: {o.code}</Badge>
                      )}
                      {o.type && <span style={{ fontSize: 12, color: '#5f6368' }}>{o.type}</span>}
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Button
                      variant={active ? 'outline-secondary' : 'outline-success'}
                      size="sm"
                      disabled={busySlug === slug}
                      onClick={() => toggleActive(o)}
                    >
                      {busySlug === slug
                        ? <Spinner size="sm" animation="border" />
                        : active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0"
                      onClick={() => slug && setDeleteSlug(slug)}
                      style={{ color: '#5f6368' }}
                      aria-label={`Delete ${o.name}`}
                    >
                      <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <Card className="mt-3">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>New offer</h6>
            <Form onSubmit={handleCreate}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Summer Sale"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      autoFocus
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="manual">Manual</option>
                      <option value="dynamic">Dynamic</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Products (data type)</Form.Label>
                    <Form.Select
                      value={form.data_type_id}
                      onChange={(e) => setForm({ ...form, data_type_id: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Benefit</Form.Label>
                    <Form.Select
                      value={form.benefit_type}
                      onChange={(e) => setForm({ ...form, benefit_type: e.target.value })}
                    >
                      <option value="percentage">Percentage off</option>
                      <option value="fixed_amount">Fixed amount off</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>{form.benefit_type === 'percentage' ? 'Percent (%)' : 'Amount'}</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.benefit_value}
                      onChange={(e) => setForm({ ...form, benefit_value: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Form.Check
                    type="switch"
                    label="Coupon code offer"
                    checked={form.is_code_offer}
                    onChange={(e) => setForm({ ...form, is_code_offer: e.target.checked })}
                  />
                </Col>
                {form.is_code_offer && (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Code duration (days)</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        value={form.offer_duration}
                        onChange={(e) => setForm({ ...form, offer_duration: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                )}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Start (optional)</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.start_at}
                      onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>End (optional)</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.end_at}
                      onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {form.type === 'dynamic' && (
                <div className="mt-3">
                  <Form.Label>Conditions</Form.Label>
                  {!form.data_type_id ? (
                    <div className="text-muted" style={{ fontSize: 13 }}>Select a data type first.</div>
                  ) : loadingFields ? (
                    <Spinner size="sm" animation="border" />
                  ) : (
                    <ConditionsBuilder
                      fields={fields}
                      conditions={conditions}
                      logic={form.conditions_logic}
                      onChange={({ conditions: c, conditions_logic }) => {
                        setConditions(c);
                        setForm((f) => ({ ...f, conditions_logic }));
                      }}
                    />
                  )}
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    The discount applies to every product matching these conditions.
                  </div>
                </div>
              )}

              <div className="d-flex gap-2 mt-3">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!form.name.trim() || !form.data_type_id || !form.benefit_value || saving}
                >
                  {saving ? <Spinner size="sm" animation="border" /> : 'Create'}
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}

      <Modal show={!!deleteSlug} onHide={() => setDeleteSlug(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure? This removes the offer and its discounted pricing.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setDeleteSlug(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

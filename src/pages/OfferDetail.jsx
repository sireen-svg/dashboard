import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link, Navigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import {
  getOffer,
  updateOffer,
  deleteOffer,
  activateOffer,
  deactivateOffer,
} from '../api/ecommerce';
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

// Mirrors UpdateOfferRequest::withValidator on the backend: benefit_config must
// carry these keys for the chosen benefit_type, otherwise the request 422s.
const BENEFIT_CONFIG_KEYS = {
  percentage: ['percentage'],
  fixed_amount: ['fixed_amount'],
  buy_x_get_y: ['targeted_item', 'targeted_item_count', 'acquired_item', 'acquired_item_count'],
  quantity: ['quantity', 'discount_type', 'discount_value'],
  total_price: ['total_price', 'discount_type', 'discount_value'],
};

const SIMPLE_TYPES = ['percentage', 'fixed_amount'];

// "2026-07-03 20:33:17" / ISO -> "2026-07-03" for <input type="date">
function toDateInput(value) {
  if (!value) return '';
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : '';
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function Row2({ label, children }) {
  return (
    <div className="d-flex justify-content-between align-items-start py-2"
         style={{ borderBottom: '1px solid #f1f3f4', fontSize: 14, gap: 16 }}>
      <span style={{ color: '#5f6368', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#202124', textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>
        {children}
      </span>
    </div>
  );
}

export default function OfferDetail() {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [collection, setCollection] = useState(null);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [configJson, setConfigJson] = useState('');
  const [configError, setConfigError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await getOffer(collectionSlug);
      // ShowOfferDetailsAction returns { collection, offer } under `data`.
      const payload = res.data?.data ?? res.data ?? {};
      setCollection(payload.collection ?? null);
      setOffer(payload.offer ?? null);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [collectionSlug]);

  useEffect(() => {
    if (!ecommerceEnabled) return;
    (async () => { await load(); })();
  }, [ecommerceEnabled, load]);

  // Conditions reference the collection's data type fields by name.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      const dt = dataTypes.find((d) => d.id === Number(collection?.data_type_id));
      if (!editing || collection?.type !== 'dynamic' || !dt?.slug) {
        if (!cancelled) setFields([]);
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
    run();
    return () => { cancelled = true; };
  }, [editing, collection, dataTypes]);

  function startEditing() {
    const benefitType = offer?.benefit_type || 'percentage';
    const config = offer?.benefit_config || {};
    setForm({
      name: collection?.name || '',
      description: collection?.description || '',
      benefit_type: benefitType,
      benefit_value: SIMPLE_TYPES.includes(benefitType)
        ? String(config[BENEFIT_CONFIG_KEYS[benefitType][0]] ?? '')
        : '',
      offer_duration: offer?.offer_duration ?? '',
      start_at: toDateInput(offer?.start_at),
      end_at: toDateInput(offer?.end_at),
      conditions_logic: collection?.conditions_logic || 'and',
    });
    setConditions(Array.isArray(collection?.conditions) ? collection.conditions : []);
    setConfigJson(JSON.stringify(config, null, 2));
    setConfigError('');
    setEditing(true);
  }

  function buildBenefitConfig() {
    const type = form.benefit_type;
    if (SIMPLE_TYPES.includes(type)) {
      if (form.benefit_value === '') return null;
      return { [BENEFIT_CONFIG_KEYS[type][0]]: Number(form.benefit_value) };
    }
    try {
      const parsed = JSON.parse(configJson || '{}');
      const missing = BENEFIT_CONFIG_KEYS[type].filter((k) => parsed[k] === undefined);
      if (missing.length) {
        setConfigError(`Missing required key${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
        return undefined;
      }
      setConfigError('');
      return parsed;
    } catch {
      setConfigError('Not valid JSON');
      return undefined;
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;

    // Backend rule: end_at is required_with start_at, and must be >= start_at.
    if (form.start_at && !form.end_at) {
      showToast('An end date is required when a start date is set', 'error');
      return;
    }
    if (form.start_at && form.end_at && form.end_at < form.start_at) {
      showToast('End date must be on or after the start date', 'error');
      return;
    }

    const benefit_config = buildBenefitConfig();
    if (benefit_config === undefined) return; // invalid config, error already shown

    // Every field is nullable on the backend, so only send what is set.
    const payload = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.description !== '') payload.description = form.description;
    if (benefit_config) {
      payload.benefit_type = form.benefit_type;
      payload.benefit_config = benefit_config;
    }
    if (form.offer_duration !== '' && form.offer_duration !== null) {
      payload.offer_duration = Number(form.offer_duration);
    }
    if (form.start_at) {
      payload.start_at = form.start_at;
      payload.end_at = form.end_at;
    } else if (form.end_at) {
      payload.end_at = form.end_at;
    }
    if (collection?.type === 'dynamic') {
      payload.conditions = cleanConditions(conditions);
      payload.conditions_logic = form.conditions_logic;
    }

    setSaving(true);
    try {
      await updateOffer(collectionSlug, payload);
      showToast('Offer updated', 'success');
      setEditing(false);
      await load();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    if (busy) return;
    setBusy(true);
    try {
      if (offer?.is_active) {
        await deactivateOffer(collectionSlug);
        showToast('Offer deactivated', 'info');
      } else {
        await activateOffer(collectionSlug);
        showToast('Offer activated', 'success');
      }
      await load();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await deleteOffer(collectionSlug);
      showToast('Offer deleted', 'info');
      navigate(`/projects/${projectSlug}/commerce/offers`);
    } catch (err) {
      showToast(getApiError(err), 'error');
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  if (!ecommerceEnabled) return <Navigate to={`/projects/${projectSlug}`} replace />;

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (notFound || !offer) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><i className="bi bi-tag"></i></div>
        <div className="empty-title">Offer not found</div>
        <div className="empty-desc">
          No offer exists for the collection <code>{collectionSlug}</code>.
        </div>
        <Button as={Link} to={`/projects/${projectSlug}/commerce/offers`} variant="primary" size="sm">
          Back to offers
        </Button>
      </div>
    );
  }

  const active = !!offer.is_active;
  const config = offer.benefit_config || {};

  return (
    <div>
      <div className="page-header">
        <Link
          to={`/projects/${projectSlug}/commerce/offers`}
          className="text-decoration-none d-inline-flex align-items-center gap-1 mb-2"
          style={{ fontSize: 13, color: '#5f6368' }}
        >
          <i className="bi bi-chevron-left"></i> Offers
        </Link>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2>{collection?.name || collectionSlug}</h2>
            <div className="d-flex gap-2 align-items-center flex-wrap mt-1">
              <Badge bg="info">{BENEFIT_LABELS[offer.benefit_type] || offer.benefit_type}</Badge>
              <Badge bg={active ? 'success' : 'secondary'}>{active ? 'active' : 'inactive'}</Badge>
              {collection?.type && <Badge bg="light" text="dark">{collection.type}</Badge>}
              {offer.is_code_offer && offer.code && (
                <Badge bg="warning" text="dark">Code: {offer.code}</Badge>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant={active ? 'outline-secondary' : 'outline-success'}
              size="sm"
              disabled={busy}
              onClick={toggleActive}
            >
              {busy ? <Spinner size="sm" animation="border" /> : active ? 'Deactivate' : 'Activate'}
            </Button>
            {!editing && (
              <Button variant="primary" size="sm" onClick={startEditing}>
                <i className="bi bi-pencil me-1"></i>Edit
              </Button>
            )}
            <Button variant="outline-danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <i className="bi bi-trash"></i>
            </Button>
          </div>
        </div>
      </div>

      {editing ? (
        <Card>
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Edit offer</h6>
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
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Benefit type</Form.Label>
                    <Form.Select
                      value={form.benefit_type}
                      onChange={(e) => {
                        const t = e.target.value;
                        setForm({ ...form, benefit_type: t, benefit_value: '' });
                        setConfigJson(
                          SIMPLE_TYPES.includes(t)
                            ? ''
                            : JSON.stringify(
                                Object.fromEntries(BENEFIT_CONFIG_KEYS[t].map((k) => [k, ''])),
                                null,
                                2,
                              ),
                        );
                        setConfigError('');
                      }}
                    >
                      {Object.entries(BENEFIT_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {SIMPLE_TYPES.includes(form.benefit_type) ? (
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        {form.benefit_type === 'percentage' ? 'Percent (%)' : 'Amount'}
                      </Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.benefit_value}
                        onChange={(e) => setForm({ ...form, benefit_value: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                ) : (
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>
                        benefit_config{' '}
                        <span style={{ fontSize: 12, color: '#5f6368' }}>
                          (requires: {BENEFIT_CONFIG_KEYS[form.benefit_type].join(', ')})
                        </span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        className="font-monospace"
                        style={{ fontSize: 12 }}
                        value={configJson}
                        onChange={(e) => { setConfigJson(e.target.value); setConfigError(''); }}
                        isInvalid={!!configError}
                      />
                      <Form.Control.Feedback type="invalid">{configError}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                )}

                {offer.is_code_offer && (
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
                    <Form.Label>Start</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.start_at}
                      onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      End {form.start_at && <span style={{ color: '#d93025' }}>*</span>}
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={form.end_at}
                      min={form.start_at || undefined}
                      onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                    />
                    {form.start_at && !form.end_at && (
                      <div style={{ fontSize: 12, color: '#d93025' }}>
                        Required when a start date is set.
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              {collection?.type === 'dynamic' && (
                <div className="mt-3">
                  <Form.Label>Conditions</Form.Label>
                  {loadingFields ? (
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
                </div>
              )}

              <div className="d-flex gap-2 mt-3">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? <Spinner size="sm" animation="border" /> : 'Save changes'}
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          <Col md={6}>
            <Card className="h-100">
              <Card.Body className="p-3">
                <h6 className="fw-medium mb-2" style={{ fontSize: 14 }}>Offer</h6>
                <Row2 label="Benefit">{BENEFIT_LABELS[offer.benefit_type] || offer.benefit_type}</Row2>
                <Row2 label="Value">
                  {offer.benefit_type === 'percentage' && config.percentage !== undefined
                    ? `${config.percentage}%`
                    : offer.benefit_type === 'fixed_amount' && config.fixed_amount !== undefined
                      ? config.fixed_amount
                      : (
                        <code style={{ fontSize: 12 }}>{JSON.stringify(config)}</code>
                      )}
                </Row2>
                <Row2 label="Coupon code">{offer.is_code_offer ? (offer.code || '—') : 'No'}</Row2>
                {offer.is_code_offer && (
                  <Row2 label="Code duration">
                    {offer.offer_duration ? `${offer.offer_duration} days` : '—'}
                  </Row2>
                )}
                <Row2 label="Starts">{formatDate(offer.start_at)}</Row2>
                <Row2 label="Ends">{formatDate(offer.end_at)}</Row2>
                <Row2 label="Status">{active ? 'Active' : 'Inactive'}</Row2>
                <Row2 label="Offer ID"><code style={{ fontSize: 12 }}>{offer.id}</code></Row2>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="h-100">
              <Card.Body className="p-3">
                <h6 className="fw-medium mb-2" style={{ fontSize: 14 }}>Collection</h6>
                <Row2 label="Name">{collection?.name || '—'}</Row2>
                <Row2 label="Slug"><code style={{ fontSize: 12 }}>{collection?.slug || collectionSlug}</code></Row2>
                <Row2 label="Type">{collection?.type || '—'}</Row2>
                <Row2 label="Description">{collection?.description || '—'}</Row2>
                <Row2 label="Data type">
                  {dataTypes.find((d) => d.id === Number(collection?.data_type_id))?.name
                    ?? collection?.data_type_id ?? '—'}
                </Row2>
                {collection?.type === 'dynamic' && (
                  <>
                    <Row2 label="Logic">{collection?.conditions_logic || 'and'}</Row2>
                    <Row2 label="Conditions">
                      {Array.isArray(collection?.conditions) && collection.conditions.length
                        ? `${collection.conditions.length} rule${collection.conditions.length !== 1 ? 's' : ''}`
                        : '—'}
                    </Row2>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Modal show={confirmDelete} onHide={() => setConfirmDelete(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This removes <strong>{collection?.name || collectionSlug}</strong> and its discounted pricing.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy}>
            {busy ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

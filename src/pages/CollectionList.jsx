import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { getCollections, createCollection, deleteCollection, getFields } from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError, slugify } from '../lib/utils';
import ConditionsBuilder from '../components/ConditionsBuilder';
import { cleanConditions } from '../lib/collectionConditions';

export default function CollectionList() {
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'manual',
    data_type_id: '',
    description: '',
    conditions_logic: 'and',
  });
  const [conditions, setConditions] = useState([]);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  // Load the selected data type's fields so dynamic-collection conditions can reference them by name.
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

  async function loadCollections() {
    try {
      const res = await getCollections();
      setCollections(res.data?.data || res.data || []);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.data_type_id || saving) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.name),
        type: form.type,
        data_type_id: Number(form.data_type_id),
        description: form.description,
        is_active: true,
      };
      if (form.type === 'dynamic') {
        payload.conditions = cleanConditions(conditions);
        payload.conditions_logic = form.conditions_logic;
      }
      await createCollection(payload);
      showToast('Collection created', 'success');
      setForm({ name: '', type: 'manual', data_type_id: '', description: '', conditions_logic: 'and' });
      setConditions([]);
      setShowForm(false);
      loadCollections();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteSlug || deleting) return;
    setDeleting(true);
    try {
      await deleteCollection(deleteSlug);
      showToast('Collection deleted', 'info');
      setDeleteSlug(null);
      loadCollections();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  function getTypeName(id) {
    return dataTypes.find((dt) => dt.id === Number(id))?.name || '-';
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Collections</h2>
          <p className="page-subtitle">
            {collections.length} collection{collections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-1"></i>New collection
        </Button>
      </div>

      {collections.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-collection"></i></div>
          <div className="empty-title">No collections yet</div>
          <div className="empty-desc">Create curated groups of entries</div>
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>Create collection
          </Button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {collections.map((col) => (
            <Link
              key={col.id}
              to={`/projects/${projectSlug}/collections/${col.slug}`}
              className="collection-card-link"
            >
              <Card>
                <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                      {col.name}
                    </div>
                    <div className="d-flex gap-2 mt-1">
                      <Badge bg={col.type === 'manual' ? 'primary' : 'info'}>{col.type}</Badge>
                      <Badge bg={col.is_active ? 'success' : 'secondary'}>
                        {col.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span style={{ fontSize: 12, color: '#5f6368' }}>
                        Type: {getTypeName(col.data_type_id)}
                      </span>
                    </div>
                    {col.description && (
                      <p className="mb-0 mt-1" style={{ fontSize: 13, color: '#5f6368' }}>{col.description}</p>
                    )}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={(e) => {
                      // Don't navigate when the user clicks the trash button.
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteSlug(col.slug);
                    }}
                    style={{ color: '#5f6368' }}
                    aria-label={`Delete ${col.name}`}
                  >
                    <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
                  </Button>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card className="mt-3">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>New collection</h6>
            <Form onSubmit={handleCreate}>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. Featured Products"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      autoFocus
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Data type</Form.Label>
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
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="manual">Manual</option>
                      <option value="dynamic">Dynamic</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="d-flex align-items-end gap-2">
                  <Button type="submit" size="sm" disabled={!form.name.trim() || !form.data_type_id || saving}>
                    {saving ? <Spinner size="sm" animation="border" /> : 'Create'}
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </Col>
              </Row>
              <Form.Group className="mt-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Form.Group>

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
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal show={!!deleteSlug} onHide={() => setDeleteSlug(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this collection?</Modal.Body>
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

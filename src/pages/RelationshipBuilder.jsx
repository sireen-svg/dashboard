import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, Form, Button, Modal, Row, Col, Spinner } from 'react-bootstrap';
import { getApiError } from '../lib/utils';
import { getFields, createField, deleteField } from '../api/cms';
import { showToast } from '../components/Toast';

const BACKEND_RELATION_KINDS = [
  { value: 'belongs_to', label: 'Belongs To (Many to One)' },
  { value: 'has_many', label: 'Has Many (One to Many)' },
  { value: 'many_to_many', label: 'Many to Many' },
];

export default function RelationshipBuilder() {
  const { project, dataTypes, refreshDataTypes } = useOutletContext();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fieldsMap, setFieldsMap] = useState({});
  const [loadingFields, setLoadingFields] = useState(true);
  const [form, setForm] = useState({
    sourceTypeId: '',
    targetTypeId: '',
    relationKind: 'belongs_to',
    sourceColumn: '',
  });

  const loadAllFields = useCallback(async () => {
    setLoadingFields(true);
    try {
      const results = await Promise.all(
        dataTypes.map(async (dt) => {
          const res = await getFields(dt.id);
          return { dtId: dt.id, fields: res.data?.data || res.data || [] };
        })
      );
      const map = {};
      results.forEach(({ dtId, fields }) => { map[dtId] = fields; });
      setFieldsMap(map);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoadingFields(false);
    }
  }, [dataTypes]);

  useEffect(() => {
    if (dataTypes.length > 0) {
      loadAllFields();
    } else {
      setLoadingFields(false);
    }
  }, [dataTypes, loadAllFields]);

  function getTypeName(id) {
    return dataTypes.find((dt) => dt.id === Number(id))?.slug || 'unknown';
  }

  function getTypeDisplayName(id) {
    return dataTypes.find((dt) => dt.id === Number(id))?.name || 'Unknown';
  }

  // Collect relation fields from all data types
  const relationships = dataTypes.flatMap((dt) =>
    (fieldsMap[dt.id] || [])
      .filter((f) => f.type === 'relation')
      .map((f) => ({
        id: f.id,
        sourceTypeId: dt.id,
        targetTypeId: f.settings?.related_data_type_id,
        relationKind: f.settings?.relation_type || 'belongs_to',
        sourceColumn: f.name,
      }))
  );

  function handleTargetChange(targetId) {
    const targetName = dataTypes.find((dt) => dt.id === Number(targetId))?.slug || '';
    setForm({
      ...form,
      targetTypeId: targetId,
      sourceColumn: targetName ? `${targetName}_id` : '',
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.sourceTypeId || !form.targetTypeId || !form.sourceColumn.trim() || saving) return;

    setSaving(true);
    try {
      await createField(form.sourceTypeId, {
        name: form.sourceColumn.trim(),
        type: 'relation',
        required: false,
        translatable: false,
        validation_rules: [],
        settings: {
          relation_type: form.relationKind,
          related_data_type_id: Number(form.targetTypeId),
          // belongs_to → single target; has_many / many_to_many → multiple targets.
          // (Mirrors the backend's RelationFieldStrategy default for `multiple`.)
          multiple: form.relationKind !== 'belongs_to',
        },
        sort_order: 0,
      });
      await refreshDataTypes();
      await loadAllFields();
      showToast('Relationship created', 'success');
      setForm({ sourceTypeId: '', targetTypeId: '', relationKind: 'belongs_to', sourceColumn: '' });
      setShowForm(false);
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
      await deleteField(deleteId);
      await refreshDataTypes();
      await loadAllFields();
      showToast('Relationship removed', 'info');
      setDeleteId(null);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  const relationLabel = {
    'belongs_to': 'N : 1',
    'has_many': '1 : N',
    'many_to_many': 'N : N',
  };

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Relationships</h2>
          <p className="page-subtitle">
            {relationships.length} relationship{relationships.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowForm(true)}
          disabled={dataTypes.length < 2}
        >
          <i className="bi bi-plus-lg me-1"></i>Add relationship
        </Button>
      </div>

      {loadingFields && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loadingFields && dataTypes.length < 2 && (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-diagram-3"></i></div>
          <div className="empty-title">Not enough tables</div>
          <div className="empty-desc">You need at least 2 tables to create relationships between them</div>
        </div>
      )}

      {!loadingFields && relationships.length === 0 && dataTypes.length >= 2 && (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-diagram-3"></i></div>
          <div className="empty-title">No relationships yet</div>
          <div className="empty-desc">Define how your tables relate to each other</div>
        </div>
      )}

      <div className="d-flex flex-column gap-2">
        {relationships.map((rel) => (
          <div key={rel.id} className="rel-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="rel-arrow">
                <span className="rel-table-name">{getTypeDisplayName(rel.sourceTypeId)}</span>
                <i className="bi bi-arrow-right rel-arrow-icon"></i>
                <span className="rel-badge">{relationLabel[rel.relationKind] || rel.relationKind}</span>
                <i className="bi bi-arrow-right rel-arrow-icon"></i>
                <span className="rel-table-name">{getTypeDisplayName(rel.targetTypeId)}</span>
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0"
                onClick={() => setDeleteId(rel.id)}
                title="Delete"
                style={{ color: '#5f6368' }}
              >
                <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
              </Button>
            </div>
            <div className="mt-2">
              <small className="font-monospace" style={{ fontSize: 11, color: '#5f6368' }}>
                FK: {getTypeName(rel.sourceTypeId)}.{rel.sourceColumn}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* New Relationship Form */}
      {showForm && (
        <Card className="mt-3">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>New relationship</h6>
            <Form onSubmit={handleCreate}>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Source table</Form.Label>
                    <Form.Select
                      value={form.sourceTypeId}
                      onChange={(e) => setForm({ ...form, sourceTypeId: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Target table</Form.Label>
                    <Form.Select
                      value={form.targetTypeId}
                      onChange={(e) => handleTargetChange(e.target.value)}
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
                    <Form.Label>Kind</Form.Label>
                    <Form.Select
                      value={form.relationKind}
                      onChange={(e) => setForm({ ...form, relationKind: e.target.value })}
                    >
                      {BACKEND_RELATION_KINDS.map((k) => (
                        <option key={k.value} value={k.value}>{k.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>FK column</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. category_id"
                      value={form.sourceColumn}
                      onChange={(e) => setForm({ ...form, sourceColumn: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end gap-2">
                  <Button type="submit" size="sm" disabled={!form.sourceTypeId || !form.targetTypeId || !form.sourceColumn.trim() || saving}>
                    {saving ? <Spinner size="sm" animation="border" /> : 'Create'}
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete relationship</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this relationship?</Modal.Body>
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

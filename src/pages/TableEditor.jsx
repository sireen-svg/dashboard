import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Form, Button, Modal, Spinner } from 'react-bootstrap';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FIELD_TYPES } from '../lib/constants';
import { toBackendFieldType, toFrontendFieldType, getApiError } from '../lib/utils';
import {
  getDataType,
  getFields,
  createField,
  updateField,
  deleteField,
  deleteDataType,
  getTrashedFields,
  restoreField,
  forceDeleteField,
} from '../api/cms';
import { showToast } from '../components/Toast';

function SortableRow({ column, onDelete, deleting }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const frontendType = toFrontendFieldType(column.type);

  return (
    <tr ref={setNodeRef} style={style}>
      <td {...attributes} {...listeners} className="grip-handle" style={{ width: 36 }}>
        <i className="bi bi-grip-vertical"></i>
      </td>
      <td>
        <span className="fw-medium">{column.name}</span>
      </td>
      <td>
        <span className={`field-badge ${frontendType}`}>{column.type}</span>
      </td>
      <td className="text-center">
        {column.required && <i className="bi bi-check-circle-fill" style={{ color: '#34a853', fontSize: 14 }}></i>}
      </td>
      <td className="text-center">
        {column.translatable && <i className="bi bi-check-circle-fill" style={{ color: '#1a73e8', fontSize: 14 }}></i>}
      </td>
      <td>
        {column.settings?.enum_values && (
          <div className="d-flex flex-wrap gap-1">
            {column.settings.enum_values.map((v) => (
              <span key={v} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{v}</span>
            ))}
          </div>
        )}
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0"
          onClick={() => onDelete(column.id)}
          title="Delete field"
          style={{ color: '#5f6368' }}
          disabled={deleting}
        >
          <i className="bi bi-trash" style={{ fontSize: 14 }}></i>
        </Button>
      </td>
    </tr>
  );
}

const EMPTY_COLUMN = {
  name: '',
  fieldType: 'string',
  isRequired: false,
  translatable: false,
  defaultValue: '',
  enumValues: '',
};

export default function TableEditor() {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const { project, refreshDataTypes } = useOutletContext();

  const [dataType, setDataType] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCol, setNewCol] = useState(EMPTY_COLUMN);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showTrash, setShowTrash] = useState(false);
  const [trashedFields, setTrashedFields] = useState([]);
  const [loadingTrashedFields, setLoadingTrashedFields] = useState(false);
  const [busyTrashId, setBusyTrashId] = useState(null);
  const [confirmForceDelete, setConfirmForceDelete] = useState(null);

  const projectSlug = project.slug;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadDataType = useCallback(async () => {
    try {
      const res = await getDataType(typeId);
      const dt = res.data?.data || res.data;
      setDataType(dt);

      const fieldsRes = await getFields(dt.id || typeId);
      setFields(fieldsRes.data?.data || fieldsRes.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setDataType(null);
      } else {
        showToast(getApiError(err), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [typeId]);

  useEffect(() => {
    loadDataType();
  }, [loadDataType]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!dataType) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><i className="bi bi-question-circle"></i></div>
        <div className="empty-title">Table not found</div>
        <div className="empty-desc">This table may have been deleted</div>
        <Button variant="primary" size="sm" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  async function handleAddColumn(e) {
    e.preventDefault();
    if (!newCol.name.trim() || saving) return;

    const backendType = toBackendFieldType(newCol.fieldType);
    const fieldData = {
      name: newCol.name.trim().toLowerCase().replace(/\s+/g, '_'),
      type: backendType,
      required: newCol.isRequired,
      translatable: newCol.translatable,
      validation_rules: [],
      settings: {},
      sort_order: fields.length,
    };

    if (newCol.fieldType === 'enum' && newCol.enumValues) {
      fieldData.settings.enum_values = newCol.enumValues.split(',').map((v) => v.trim()).filter(Boolean);
    }

    setSaving(true);
    try {
      await createField(dataType.id, fieldData);
      await loadDataType();
      showToast(`Field "${fieldData.name}" added`, 'success');
      setNewCol(EMPTY_COLUMN);
      setShowAddForm(false);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteColumn(fieldId) {
    const field = fields.find((f) => f.id === fieldId);
    setDeleting(true);
    try {
      await deleteField(fieldId);
      await loadDataType();
      showToast(`Field "${field?.name || 'field'}" removed`, 'info');
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex);
    setFields(reordered);

    // Update sort_order for moved fields
    try {
      await Promise.all(
        reordered.map((f, i) => updateField(f.id, { ...f, sort_order: i }))
      );
    } catch (err) {
      showToast(getApiError(err), 'error');
      await loadDataType();
    }
  }

  async function openTrash() {
    setShowTrash(true);
    setLoadingTrashedFields(true);
    try {
      const res = await getTrashedFields(dataType.id);
      setTrashedFields(res.data?.data || res.data || []);
    } catch (err) {
      showToast(getApiError(err), 'error');
      setTrashedFields([]);
    } finally {
      setLoadingTrashedFields(false);
    }
  }

  async function handleRestoreField(fieldId) {
    if (busyTrashId) return;
    setBusyTrashId(fieldId);
    try {
      await restoreField(fieldId);
      showToast('Field restored', 'success');
      await loadDataType();
      setTrashedFields((prev) => prev.filter((f) => f.id !== fieldId));
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyTrashId(null);
    }
  }

  async function handleForceDeleteField() {
    if (!confirmForceDelete || busyTrashId) return;
    const id = confirmForceDelete.id;
    setBusyTrashId(id);
    try {
      await forceDeleteField(id);
      showToast('Field permanently deleted', 'info');
      setTrashedFields((prev) => prev.filter((f) => f.id !== id));
      setConfirmForceDelete(null);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyTrashId(null);
    }
  }

  async function handleDeleteTable() {
    setDeleting(true);
    try {
      await deleteDataType(dataType.slug);
      await refreshDataTypes();
      showToast(`Table "${dataType.name}" deleted`, 'info');
      navigate(`/projects/${projectSlug}/schema`);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button
            className="back-nav"
            onClick={() => navigate(`/projects/${projectSlug}/schema`)}
          >
            <i className="bi bi-arrow-left"></i> Schema Builder
          </button>
          <div className="d-flex align-items-center gap-3">
            <div className="schema-card-icon" style={{ background: '#e8f0fe', color: '#1a73e8', width: 44, height: 44, borderRadius: 8, fontSize: 20 }}>
              <i className="bi bi-table"></i>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 400, margin: 0, fontFamily: "'Google Sans', sans-serif" }}>
                {dataType.name}
              </h2>
              <span style={{ fontSize: 12, color: '#5f6368' }} className="font-monospace">{dataType.slug}</span>
              <span style={{ fontSize: 12, color: '#9aa0a6', marginLeft: 8 }}>
                &middot; {fields.length} field{fields.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={openTrash}>
            <i className="bi bi-trash3 me-1"></i>Trashed fields
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowDeleteModal(true)} style={{ color: '#ea4335', borderColor: '#dadce0' }}>
            <i className="bi bi-trash me-1"></i>Delete table
          </Button>
        </div>
      </div>

      {/* Fields Table */}
      <Card className="mb-3">
        <Card.Body className="p-0">
          {fields.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="bi bi-columns-gap"></i></div>
              <div className="empty-title">No fields yet</div>
              <div className="empty-desc">Add your first field to define the structure of this table</div>
              <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
                <i className="bi bi-plus-lg me-1"></i>Add first field
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <table className="table column-table mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}></th>
                        <th>Field name</th>
                        <th>Type</th>
                        <th className="text-center" style={{ width: 80 }}>Required</th>
                        <th className="text-center" style={{ width: 100 }}>Translatable</th>
                        <th>Options</th>
                        <th style={{ width: 40 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field) => (
                        <SortableRow key={field.id} column={field} onDelete={handleDeleteColumn} deleting={deleting} />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Field */}
      {!showAddForm ? (
        fields.length > 0 && (
          <Button variant="outline-primary" size="sm" onClick={() => setShowAddForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>Add field
          </Button>
        )
      ) : (
        <Card>
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>New field</h6>
            <Form onSubmit={handleAddColumn}>
              <div className="row g-3">
                <div className="col-md-3">
                  <Form.Group>
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. price"
                      value={newCol.name}
                      onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
                      autoFocus
                    />
                  </Form.Group>
                </div>
                <div className="col-md-2">
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={newCol.fieldType}
                      onChange={(e) => setNewCol({ ...newCol, fieldType: e.target.value })}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-3">
                  <Form.Group>
                    <Form.Label>Options</Form.Label>
                    <div className="d-flex gap-3 pt-1">
                      <Form.Check
                        type="checkbox"
                        label="Required"
                        checked={newCol.isRequired}
                        onChange={(e) => setNewCol({ ...newCol, isRequired: e.target.checked })}
                        style={{ fontSize: 13 }}
                      />
                      <Form.Check
                        type="checkbox"
                        label="Translatable"
                        checked={newCol.translatable}
                        onChange={(e) => setNewCol({ ...newCol, translatable: e.target.checked })}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </Form.Group>
                </div>
                <div className="col-md-2 d-flex align-items-end gap-2">
                  <Button type="submit" size="sm" disabled={!newCol.name.trim() || saving}>
                    {saving ? <Spinner size="sm" animation="border" /> : 'Add'}
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => { setShowAddForm(false); setNewCol(EMPTY_COLUMN); }}>
                    Cancel
                  </Button>
                </div>
              </div>
              {newCol.fieldType === 'enum' && (
                <Form.Group className="mt-3">
                  <Form.Label>Enum values <span style={{ fontWeight: 400, color: '#5f6368' }}>(comma-separated)</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. active, draft, archived"
                    value={newCol.enumValues}
                    onChange={(e) => setNewCol({ ...newCol, enumValues: e.target.value })}
                  />
                </Form.Group>
              )}
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete table</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{dataType.name}</strong>? This will also remove all fields and entries.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteTable} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Trashed fields */}
      <Modal show={showTrash} onHide={() => setShowTrash(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Trashed fields</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingTrashedFields ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : trashedFields.length === 0 ? (
            <div className="text-center py-4" style={{ color: '#5f6368', fontSize: 14 }}>
              <i className="bi bi-trash3" style={{ fontSize: 28, opacity: 0.4 }}></i>
              <div className="mt-2">No trashed fields for this table</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {trashedFields.map((f) => (
                <div
                  key={f.id}
                  className="d-flex justify-content-between align-items-center p-2 rounded"
                  style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}
                >
                  <div>
                    <div className="fw-medium" style={{ fontSize: 14 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: '#5f6368' }}>
                      <span className="font-monospace">{f.type}</span>
                      {f.deleted_at && (
                        <span className="ms-2">
                          deleted {new Date(f.deleted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleRestoreField(f.id)}
                      disabled={busyTrashId === f.id}
                      style={{ fontSize: 12 }}
                    >
                      {busyTrashId === f.id ? <Spinner size="sm" animation="border" /> : 'Restore'}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setConfirmForceDelete(f)}
                      disabled={busyTrashId === f.id}
                      style={{ fontSize: 12 }}
                    >
                      Delete forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowTrash(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={!!confirmForceDelete} onHide={() => setConfirmForceDelete(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Permanently delete field?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This will permanently delete <strong>{confirmForceDelete?.name}</strong> and any stored
          values for it across entries. This cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setConfirmForceDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleForceDeleteField} disabled={busyTrashId === confirmForceDelete?.id}>
            {busyTrashId === confirmForceDelete?.id ? <Spinner size="sm" animation="border" /> : 'Delete forever'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

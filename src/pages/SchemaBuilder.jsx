import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Row, Col, Button, Modal, Spinner } from 'react-bootstrap';
import { getTrashedDataTypes, restoreDataType, forceDeleteDataType } from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

export default function SchemaBuilder() {
  const { project, dataTypes, refreshDataTypes } = useOutletContext();
  const projectSlug = project.slug;

  const [showTrash, setShowTrash] = useState(false);
  const [trashed, setTrashed] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmForceDelete, setConfirmForceDelete] = useState(null);

  async function openTrash() {
    setShowTrash(true);
    setLoadingTrash(true);
    try {
      const res = await getTrashedDataTypes();
      setTrashed(res.data?.data || res.data || []);
    } catch (err) {
      showToast(getApiError(err), 'error');
      setTrashed([]);
    } finally {
      setLoadingTrash(false);
    }
  }

  async function handleRestore(id) {
    if (busyId) return;
    setBusyId(id);
    try {
      await restoreDataType(id);
      showToast('Table restored', 'success');
      await refreshDataTypes();
      setTrashed((prev) => prev.filter((dt) => dt.id !== id));
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleForceDelete() {
    if (!confirmForceDelete || busyId) return;
    const id = confirmForceDelete.id;
    setBusyId(id);
    try {
      await forceDeleteDataType(id);
      showToast('Table permanently deleted', 'info');
      setTrashed((prev) => prev.filter((dt) => dt.id !== id));
      setConfirmForceDelete(null);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Schema Builder</h2>
          <p className="page-subtitle">
            {dataTypes.length} table{dataTypes.length !== 1 ? 's' : ''} defined
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" size="sm" onClick={openTrash}>
            <i className="bi bi-trash3 me-1"></i>Trash
          </Button>
          <Button as={Link} to={`/projects/${projectSlug}/schema/new`} variant="primary" size="sm">
            <i className="bi bi-plus-lg me-1"></i>Add table
          </Button>
        </div>
      </div>

      {dataTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-table"></i>
          </div>
          <div className="empty-title">No tables yet</div>
          <div className="empty-desc">Create your first data type to start defining your schema</div>
          <Button as={Link} to={`/projects/${projectSlug}/schema/new`} variant="primary" size="sm">
            <i className="bi bi-plus-lg me-1"></i>Create table
          </Button>
        </div>
      ) : (
        <Row xs={1} sm={2} md={3} className="g-3">
          {dataTypes.map((dt) => (
            <Col key={dt.id}>
              <Link to={`/projects/${projectSlug}/schema/${dt.slug || dt.id}`} className="text-decoration-none">
                <div className="card schema-card card-hover h-100">
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="schema-card-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                        <i className="bi bi-table"></i>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="schema-card-name text-truncate">{dt.name}</div>
                        <div className="schema-card-count font-monospace">{dt.slug}</div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="schema-card-count">
                        {(dt.fields || []).length} field{(dt.fields || []).length !== 1 ? 's' : ''}
                      </span>
                      <i className="bi bi-chevron-right" style={{ fontSize: 12, color: '#9aa0a6' }}></i>
                    </div>
                  </div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showTrash} onHide={() => setShowTrash(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Trashed tables</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingTrash ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : trashed.length === 0 ? (
            <div className="text-center py-4" style={{ color: '#5f6368', fontSize: 14 }}>
              <i className="bi bi-trash3" style={{ fontSize: 28, opacity: 0.4 }}></i>
              <div className="mt-2">Trash is empty</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {trashed.map((dt) => (
                <div
                  key={dt.id}
                  className="d-flex justify-content-between align-items-center p-2 rounded"
                  style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}
                >
                  <div>
                    <div className="fw-medium" style={{ fontSize: 14 }}>{dt.name}</div>
                    <div className="font-monospace" style={{ fontSize: 12, color: '#5f6368' }}>
                      {dt.slug}
                      {dt.deleted_at && (
                        <span className="ms-2">
                          deleted {new Date(dt.deleted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleRestore(dt.id)}
                      disabled={busyId === dt.id}
                      style={{ fontSize: 12 }}
                    >
                      {busyId === dt.id ? <Spinner size="sm" animation="border" /> : 'Restore'}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setConfirmForceDelete(dt)}
                      disabled={busyId === dt.id}
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
          <Modal.Title>Permanently delete table?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This will permanently delete <strong>{confirmForceDelete?.name}</strong> and any related
          fields and entries. This cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setConfirmForceDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleForceDelete} disabled={busyId === confirmForceDelete?.id}>
            {busyId === confirmForceDelete?.id ? <Spinner size="sm" animation="border" /> : 'Delete forever'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

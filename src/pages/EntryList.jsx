import { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { Card, Form, Button, Badge, Spinner, Modal } from 'react-bootstrap';
import { getEntriesByDataType, getEntriesBulk, deleteEntry, publishEntry } from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const STATUS_VARIANTS = {
  draft: 'secondary',
  published: 'success',
  scheduled: 'primary',
  archived: 'warning',
};

export default function EntryList() {
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;
  const [searchParams] = useSearchParams();
  const selectedType = searchParams.get('type') || '';
  const selectedDataType = dataTypes.find((dt) => dt.slug === selectedType);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteSlug, setDeleteSlug] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState('');

  // Reset pagination + search when the user switches type via the sidebar.
  useEffect(() => {
    setPage(1);
    setSearch('');
  }, [selectedType]);

  useEffect(() => {
    if (selectedType) {
      loadEntries();
    } else {
      setEntries([]);
      setMeta(null);
    }
  }, [selectedType, page]);

  async function loadEntries() {
    setLoading(true);
    try {
      const listRes = await getEntriesByDataType(project.id, selectedType, {
        page,
        per_page: 20,
        ...(search ? { search } : {}),
      });
      const listData = listRes.data || {};
      const listEntries = listData.entries || listData.data || [];
      setMeta(listData.meta || null);

      // The list endpoint returns minimal fields ({ id, status, values }).
      // Hydrate slug/created_at/updated_at via bulk fetch so the table can link to edit.
      const ids = listEntries.map((e) => e.id).filter(Boolean);
      if (ids.length === 0) {
        setEntries([]);
        return;
      }
      const bulkRes = await getEntriesBulk(ids);
      const bulkArr = bulkRes.data?.data || bulkRes.data || [];
      const bulkById = new Map(bulkArr.map((e) => [e.id, e]));
      const merged = listEntries.map((e) => {
        const full = bulkById.get(e.id) || {};
        return {
          ...full,
          ...e,
          slug: e.slug || full.slug,
          created_at: e.created_at || full.created_at,
          updated_at: e.updated_at || full.updated_at,
        };
      });
      setEntries(merged);
    } catch {
      setEntries([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteSlug || deleting) return;
    setDeleting(true);
    try {
      await deleteEntry(deleteSlug);
      showToast('Entry deleted', 'info');
      setDeleteSlug(null);
      loadEntries();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handlePublish(slug) {
    try {
      await publishEntry(slug);
      showToast('Entry published', 'success');
      loadEntries();
    } catch (err) {
      showToast(getApiError(err), 'error');
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    loadEntries();
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>{selectedDataType ? selectedDataType.name : 'Entries'}</h2>
          <p className="page-subtitle">
            {selectedDataType
              ? `Entries in ${selectedDataType.name}`
              : 'Pick a data type from the sidebar to view its entries'}
          </p>
        </div>
        {selectedType && (
          <Button as={Link} to={`/projects/${projectSlug}/entries/new?type=${selectedType}`} variant="primary" size="sm">
            <i className="bi bi-plus-lg me-1"></i>New entry
          </Button>
        )}
      </div>

      {selectedType && (
        <Card className="mb-3">
          <Card.Body className="p-3">
            <Form onSubmit={handleSearch} className="d-flex gap-2">
              <Form.Control
                type="text"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="sm"
                style={{ maxWidth: 280 }}
              />
              <Button type="submit" variant="outline-primary" size="sm">
                <i className="bi bi-search"></i>
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Entries Table */}
      {!selectedType ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-file-earmark-text"></i></div>
          <div className="empty-title">Select a data type</div>
          <div className="empty-desc">
            {dataTypes.length === 0
              ? 'Create a data type first from the Schema Builder.'
              : 'Pick one of your data types from the sidebar.'}
          </div>
        </div>
      ) : loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-inbox"></i></div>
          <div className="empty-title">No entries yet</div>
          <div className="empty-desc">Create your first entry for this data type</div>
          <Button as={Link} to={`/projects/${projectSlug}/entries/new?type=${selectedType}`} variant="primary" size="sm">
            <i className="bi bi-plus-lg me-1"></i>Create entry
          </Button>
        </div>
      ) : (
        <>
          <Card>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table column-table mb-0">
                  <thead>
                    <tr>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <Link to={`/projects/${projectSlug}/entries/${entry.slug}?type=${selectedType}`} className="fw-medium text-decoration-none">
                            {entry.slug}
                          </Link>
                        </td>
                        <td>
                          <Badge bg={STATUS_VARIANTS[entry.status] || 'secondary'}>
                            {entry.status}
                          </Badge>
                        </td>
                        <td style={{ fontSize: 13, color: '#5f6368' }}>
                          {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ fontSize: 13, color: '#5f6368' }}>
                          {entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : '-'}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              as={Link}
                              to={`/projects/${projectSlug}/entries/${entry.slug}?type=${selectedType}`}
                              variant="outline-primary"
                              size="sm"
                              style={{ fontSize: 12, padding: '2px 8px' }}
                            >
                              Edit
                            </Button>
                            {entry.status === 'draft' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handlePublish(entry.slug)}
                                style={{ fontSize: 12, padding: '2px 8px' }}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => setDeleteSlug(entry.slug)}
                              style={{ fontSize: 12, padding: '2px 8px' }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="d-flex align-items-center" style={{ fontSize: 13, color: '#5f6368' }}>
                Page {page} of {meta.last_page}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      <Modal show={!!deleteSlug} onHide={() => setDeleteSlug(null)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{deleteSlug}</strong>?
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

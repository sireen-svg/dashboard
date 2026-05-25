import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { slugify, getApiError } from '../lib/utils';
import { createDataType } from '../api/cms';
import { showToast } from '../components/Toast';

export default function NewDataType() {
  const navigate = useNavigate();
  const { project, refreshDataTypes } = useOutletContext();
  const [tableName, setTableName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  const projectSlug = project.slug;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tableName.trim() || saving) return;

    const slug = slugify(tableName).replace(/-/g, '_');
    setSaving(true);
    try {
      const res = await createDataType({
        name: displayName.trim() || tableName.trim(),
        slug,
        description: '',
      });
      const created = res.data?.data || res.data;
      await refreshDataTypes();
      showToast(`Table "${created.name || slug}" created`, 'success');
      navigate(`/projects/${projectSlug}/schema/${created.slug || created.id}`);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <button
        className="back-nav"
        onClick={() => navigate(`/projects/${projectSlug}/schema`)}
      >
        <i className="bi bi-arrow-left"></i> Schema Builder
      </button>

      <div className="page-header">
        <h2>Create table</h2>
        <p className="page-subtitle">Define a new data type for your schema</p>
      </div>

      <Card>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Table name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. products"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                autoFocus
              />
              <Form.Text>
                Stored as: <code>{slugify(tableName).replace(/-/g, '_') || '...'}</code>
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Display name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Products"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!tableName.trim() || saving}>
                {saving ? <Spinner size="sm" animation="border" /> : 'Create table'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Form, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import { MODULE_KEYS, MODULE_LABELS } from '../lib/constants';
import { getApiError } from '../lib/utils';
import { showToast } from '../components/Toast';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'tr', label: 'Turkish' },
];

export default function ProjectSettings() {
  const navigate = useNavigate();
  const { project, onUpdateProject, onDeleteProject } = useOutletContext();
  const [name, setName] = useState(project.name);
  const [supportedLanguages, setSupportedLanguages] = useState(project.supported_languages || []);
  const [enabledModules, setEnabledModules] = useState(project.enabled_modules || []);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleLanguage(code) {
    setSupportedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  }

  function toggleModule(key) {
    setEnabledModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  const hasChanges =
    name.trim() !== project.name ||
    JSON.stringify(supportedLanguages) !== JSON.stringify(project.supported_languages || []) ||
    JSON.stringify(enabledModules) !== JSON.stringify(project.enabled_modules || []);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdateProject({
        name: name.trim(),
        supported_languages: supportedLanguages,
        enabled_modules: enabledModules,
      });
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const success = await onDeleteProject();
      if (success) {
        showToast(`Project "${project.name}" deleted`, 'info');
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h2>Settings</h2>
        <p className="page-subtitle">Manage your project configuration</p>
      </div>

      <Card className="mb-4">
        <Card.Body className="p-4">
          <div className="section-label">General</div>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Project name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project slug</Form.Label>
              <Form.Control type="text" value={project.slug || ''} disabled />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Project ID</Form.Label>
              <Form.Control type="text" value={project.public_id || ''} disabled />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Supported Languages</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {AVAILABLE_LANGUAGES.map((lang) => {
                  const selected = supportedLanguages.includes(lang.code);
                  return (
                    <Badge
                      key={lang.code}
                      bg={selected ? 'primary' : 'light'}
                      className={`${selected ? '' : 'text-dark border'} px-3 py-2`}
                      style={{ cursor: 'pointer', fontSize: 13 }}
                      onClick={() => toggleLanguage(lang.code)}
                    >
                      {lang.label}
                    </Badge>
                  );
                })}
              </div>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Modules</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {MODULE_KEYS.map((key) => {
                  const selected = enabledModules.includes(key);
                  return (
                    <Badge
                      key={key}
                      bg={selected ? 'primary' : 'light'}
                      className={`${selected ? '' : 'text-dark border'} px-3 py-2`}
                      style={{ cursor: 'pointer', fontSize: 13 }}
                      onClick={() => toggleModule(key)}
                    >
                      {MODULE_LABELS[key] || key}
                    </Badge>
                  );
                })}
              </div>
            </Form.Group>
            <Button type="submit" size="sm" disabled={!name.trim() || !hasChanges || saving}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Save changes'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <div className="danger-zone p-4">
        <h5><i className="bi bi-exclamation-triangle me-1"></i> Danger zone</h5>
        <p style={{ fontSize: 13, color: '#5f6368' }} className="mb-3">
          Deleting a project removes all its tables, columns, and relationships. This action cannot be undone.
        </p>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          Delete project
        </Button>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

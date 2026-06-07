import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { MODULE_KEYS, MODULE_LABELS } from '../lib/constants';
import { slugify, getApiError } from '../lib/utils';
import { getTablesForModules } from '../data/moduleTemplates';
import { createProject, createDataType, createField } from '../api/cms';
import { toBackendFieldType } from '../lib/utils';
import { showToast } from '../components/Toast';

const MODULE_INFO = {
  'ecommerce': {
    icon: 'bi-cart3',
    color: '#1a73e8',
    bg: '#e8f0fe',
    desc: 'Products, categories, orders, and order items',
  },
  'booking': {
    icon: 'bi-calendar-check',
    color: '#f9ab00',
    bg: '#fef7e0',
    desc: 'Bookable resources, availability windows, and reservations',
  },
  'cms': {
    icon: 'bi-file-earmark-text',
    color: '#34a853',
    bg: '#e6f4ea',
    desc: 'Pages, posts, media, and tags',
  },
};

const STEP_LABELS = ['Project Info', 'Modules', 'Review'];

export default function NewProjectWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  // CMS is the core of this app — preselected and locked so it can't be removed.
  const [selectedModules, setSelectedModules] = useState(['cms']);
  const [creating, setCreating] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState(['en']);

  const slug = slugify(name);

  const AVAILABLE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'Arabic' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'de', label: 'German' },
    { code: 'tr', label: 'Turkish' },
  ];

  function toggleLanguage(code) {
    setSupportedLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  }

  function toggleModule(key) {
    if (key === 'cms') return; // CMS is required and cannot be unselected.
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  async function handleCreate() {
    if (!name.trim() || creating) return;

    setCreating(true);
    try {
      // Create the project
      const res = await createProject({
        name: name.trim(),
        supported_languages: supportedLanguages,
        enabled_modules: selectedModules,
      });
      const project = res.data?.data || res.data;

      // Set active project for subsequent API calls
      localStorage.setItem('active_project_key', project.public_id);

      // Create module template data types and fields
      const templateTables = getTablesForModules(selectedModules);
      for (const table of templateTables) {
        try {
          const dtRes = await createDataType({
            name: table.displayName,
            slug: table.name,
            description: '',
          });
          const dt = dtRes.data?.data || dtRes.data;

          // Create fields for this data type
          for (let i = 0; i < table.columns.length; i++) {
            const col = table.columns[i];
            const fieldData = {
              name: col.name,
              type: toBackendFieldType(col.fieldType),
              required: col.isRequired || false,
              translatable: false,
              validation_rules: [],
              settings: {},
              sort_order: i,
            };
            if (col.enumValues) {
              fieldData.settings.enum_values = col.enumValues;
            }
            try {
              await createField(dt.id, fieldData);
            } catch {
              // Continue with other fields
            }
          }
        } catch {
          // Continue with other tables
        }
      }

      showToast(`Project "${name.trim()}" created successfully`, 'success');
      // If booking is enabled, drop the user straight into resource setup —
      // they need at least one Resource before any booking flows work.
      if (selectedModules.includes('booking')) {
        navigate(`/projects/${project.slug}/booking/resources`);
      } else {
        navigate(`/projects/${project.slug}`);
      }
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="wizard-container">
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div className="text-center mb-4">
          <h2 style={{ fontWeight: 400, fontSize: 24, color: '#202124', fontFamily: "'Google Sans', sans-serif" }}>
            Create a project
          </h2>
          <p style={{ fontSize: 14, color: '#5f6368' }}>Set up your project in a few steps</p>
        </div>

        {/* Progress */}
        <div className="wizard-progress">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const isCompleted = s < step;
            const isActive = s === step;
            return (
              <div key={s} className="wizard-step">
                <div className="d-flex flex-column align-items-center">
                  <div className={`wizard-step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                    {isCompleted ? <i className="bi bi-check-lg"></i> : s}
                  </div>
                  <div className={`wizard-step-label ${isActive ? 'active' : ''}`}>{label}</div>
                </div>
                {s < 3 && <div className={`wizard-connector ${isCompleted ? 'completed' : ''}`}></div>}
              </div>
            );
          })}
        </div>

        <Card>
          <Card.Body className="p-4">
            {/* Step 1 */}
            {step === 1 && (
              <>
                <h6 className="fw-medium mb-1" style={{ fontSize: 16 }}>Project Info</h6>
                <p className="mb-4" style={{ fontSize: 13, color: '#5f6368' }}>Enter a name for your project</p>
                <Form.Group className="mb-3">
                  <Form.Label>Project name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. My Store"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Project ID</Form.Label>
                  <Form.Control type="text" value={slug || '...'} disabled />
                  <Form.Text>Auto-generated from the project name</Form.Text>
                </Form.Group>
                <Form.Group className="mb-4">
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
                  <Form.Text>Select the languages your project will support</Form.Text>
                </Form.Group>
                <div className="d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                    Cancel
                  </Button>
                  <Button onClick={() => setStep(2)} disabled={!name.trim() || supportedLanguages.length === 0}>
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <h6 className="fw-medium mb-1" style={{ fontSize: 16 }}>Choose Modules</h6>
                <p className="mb-4" style={{ fontSize: 13, color: '#5f6368' }}>Select the modules for your project. Pre-built tables will be generated.</p>
                <div className="d-flex flex-column gap-2 mb-4">
                  {MODULE_KEYS.map((key) => {
                    const info = MODULE_INFO[key];
                    const selected = selectedModules.includes(key);
                    const isLocked = key === 'cms';
                    return (
                      <div
                        key={key}
                        className={`module-card position-relative d-flex align-items-center gap-3 ${selected ? 'selected' : ''}`}
                        onClick={() => toggleModule(key)}
                        style={isLocked ? { cursor: 'not-allowed' } : undefined}
                        title={isLocked ? 'CMS is required and cannot be removed' : undefined}
                      >
                        <div className="module-icon" style={{ background: info.bg, color: info.color }}>
                          <i className={`bi ${info.icon}`}></i>
                        </div>
                        <div>
                          <div className="module-name d-flex align-items-center gap-2">
                            {MODULE_LABELS[key]}
                            {isLocked && (
                              <span
                                className="badge bg-light text-dark border"
                                style={{ fontSize: 10, fontWeight: 500 }}
                              >
                                <i className="bi bi-lock-fill me-1" style={{ fontSize: 9 }}></i>
                                Required
                              </span>
                            )}
                          </div>
                          <p className="module-desc">{info.desc}</p>
                        </div>
                        {selected && (
                          <div className="module-check">
                            <i className="bi bi-check-lg"></i>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <h6 className="fw-medium mb-1" style={{ fontSize: 16 }}>Review & Create</h6>
                <p className="mb-4" style={{ fontSize: 13, color: '#5f6368' }}>Confirm your project details</p>

                <div className="review-summary mb-3">
                  <Row className="g-3">
                    <Col xs={6}>
                      <div className="review-label">Project name</div>
                      <div className="review-value">{name}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="review-label">Project ID</div>
                      <div className="review-value font-monospace" style={{ fontSize: 13 }}>{slug}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="review-label">Modules</div>
                      <div className="mt-1">
                        {selectedModules.length > 0
                          ? selectedModules.map((m) => (
                              <Badge key={m} bg="primary" className="me-1">
                                {MODULE_LABELS[m]}
                              </Badge>
                            ))
                          : <span style={{ fontSize: 13, color: '#9aa0a6' }}>None selected</span>}
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="review-label">Languages</div>
                      <div className="mt-1">
                        {supportedLanguages.map((code) => {
                          const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
                          return (
                            <Badge key={code} bg="info" className="me-1">
                              {lang ? lang.label : code}
                            </Badge>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => setStep(2)} disabled={creating}>
                    Back
                  </Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? (
                      <><Spinner size="sm" animation="border" className="me-1" /> Creating...</>
                    ) : (
                      <><i className="bi bi-check-lg me-1"></i>Create project</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

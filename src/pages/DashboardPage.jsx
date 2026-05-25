import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import { MODULE_LABELS } from '../lib/constants';
import { getProjects } from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const PROJECT_COLORS = [
  { bg: '#e8f0fe', color: '#1a73e8', icon: 'bi-box' },
  { bg: '#e6f4ea', color: '#34a853', icon: 'bi-shop' },
  { bg: '#fef7e0', color: '#f9ab00', icon: 'bi-calendar-event' },
  { bg: '#fce8e6', color: '#ea4335', icon: 'bi-journal-text' },
  { bg: '#e0f7fa', color: '#00bcd4', icon: 'bi-rocket' },
  { bg: '#f3e8fd', color: '#ab47bc', icon: 'bi-lightning' },
];

function getProjectStyle(index) {
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await getProjects();
      setProjects(res.data?.data || res.data || []);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="welcome-banner">
        <h2>Welcome to Headless CMS</h2>
        <p className="mb-3">Build and manage your data schemas visually. Create projects, define tables, and set up relationships.</p>
        {projects.length === 0 && (
          <Button as={Link} to="/projects/new" variant="light" size="sm" style={{ color: '#1a73e8', fontWeight: 500 }}>
            <i className="bi bi-plus-lg me-1"></i>Create your first project
          </Button>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Your projects</h3>
          <p style={{ fontSize: 13, color: '#5f6368', margin: 0 }}>
            {projects.length > 0
              ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
              : 'No projects yet'}
          </p>
        </div>
        {projects.length > 0 && (
          <Button as={Link} to="/projects/new" variant="primary" size="sm">
            <i className="bi bi-plus-lg me-1"></i>Add project
          </Button>
        )}
      </div>

      <Row xs={1} sm={2} md={3} lg={4} className="g-3">
        <Col>
          <Link to="/projects/new" className="text-decoration-none">
            <div className="card create-card card-hover h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
                <div className="create-icon">
                  <i className="bi bi-plus-lg"></i>
                </div>
                <div className="fw-medium" style={{ color: '#1a73e8', fontSize: 14 }}>Add project</div>
              </div>
            </div>
          </Link>
        </Col>

        {projects.map((project, index) => {
          const style = getProjectStyle(index);
          const modules = project.enabled_modules || [];
          return (
            <Col key={project.id}>
              <Link to={`/projects/${project.slug}`} className="text-decoration-none"
                onClick={() => localStorage.setItem('active_project_key', project.public_id)}
              >
                <div className="card project-card card-hover h-100">
                  <div className="card-body">
                    <div className="project-icon" style={{ background: style.bg, color: style.color }}>
                      <i className={`bi ${style.icon}`}></i>
                    </div>
                    <div className="project-name">{project.name}</div>
                    <div className="mb-2">
                      {modules.map((m) => (
                        <Badge key={m} bg="secondary" className="me-1">
                          {MODULE_LABELS[m] || m}
                        </Badge>
                      ))}
                    </div>
                    <div className="project-meta">
                      {project.slug || ''}
                    </div>
                    <div className="project-id">{(project.public_id || String(project.id)).substring(0, 8)}</div>
                  </div>
                </div>
              </Link>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}

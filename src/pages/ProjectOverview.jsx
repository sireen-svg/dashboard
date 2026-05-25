import { Link, useOutletContext } from 'react-router-dom';
import { Row, Col, Badge } from 'react-bootstrap';
import { MODULE_LABELS } from '../lib/constants';

export default function ProjectOverview() {
  const { project, dataTypes } = useOutletContext();
  const totalFields = dataTypes.reduce((sum, dt) => sum + (dt.fields || []).length, 0);
  const totalRelations = dataTypes.reduce(
    (sum, dt) => sum + (dt.fields || []).filter((f) => f.type === 'relation').length,
    0
  );
  const modules = project.enabled_modules || [];

  const stats = [
    { label: 'Tables', value: dataTypes.length, icon: 'bi-table', bg: '#e8f0fe', color: '#1a73e8' },
    { label: 'Fields', value: totalFields, icon: 'bi-list-columns', bg: '#e6f4ea', color: '#34a853' },
    { label: 'Relationships', value: totalRelations, icon: 'bi-diagram-3', bg: '#fef7e0', color: '#f9ab00' },
  ];

  const actions = [
    {
      to: `/projects/${project.slug}/schema`,
      icon: 'bi-table',
      title: 'Schema Builder',
      desc: 'Manage tables and columns',
      bg: '#e8f0fe',
      color: '#1a73e8',
    },
    {
      to: `/projects/${project.slug}/relationships`,
      icon: 'bi-diagram-3',
      title: 'Relationships',
      desc: 'Define table relations',
      bg: '#fef7e0',
      color: '#f9ab00',
    },
    {
      to: `/projects/${project.slug}/entries`,
      icon: 'bi-file-earmark-text',
      title: 'Entries',
      desc: 'Manage content entries',
      bg: '#e6f4ea',
      color: '#34a853',
    },
    {
      to: `/projects/${project.slug}/collections`,
      icon: 'bi-collection',
      title: 'Collections',
      desc: 'Curated entry groups',
      bg: '#f3e8fd',
      color: '#ab47bc',
    },
    ...(modules.includes('booking') ? [{
      to: `/projects/${project.slug}/booking/resources`,
      icon: 'bi-calendar-check',
      title: 'Booking Resources',
      desc: 'Bookable items, availability, policies',
      bg: '#fef7e0',
      color: '#f9ab00',
    }] : []),
    {
      to: `/projects/${project.slug}/settings`,
      icon: 'bi-gear',
      title: 'Settings',
      desc: 'Project configuration',
      bg: '#f1f3f4',
      color: '#5f6368',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>{project.name}</h2>
        <p className="page-subtitle">
          Project overview and quick actions
        </p>
        {modules.length > 0 && (
          <div className="mt-2">
            {modules.map((m) => (
              <Badge key={m} bg="primary" className="me-1">
                {MODULE_LABELS[m] || m}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Row xs={1} sm={3} className="g-3 mb-4">
        {stats.map((stat) => (
          <Col key={stat.label}>
            <div className="card stat-card">
              <div className="card-body d-flex align-items-center gap-3 py-3 px-4">
                <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                  <i className={`bi ${stat.icon}`}></i>
                </div>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <div className="section-label">Quick actions</div>
      <Row xs={1} sm={3} className="g-3">
        {actions.map((action) => (
          <Col key={action.to}>
            <Link to={action.to} className="action-card">
              <div className="action-icon" style={{ background: action.bg, color: action.color }}>
                <i className={`bi ${action.icon}`}></i>
              </div>
              <div className="action-title">{action.title}</div>
              <p className="action-desc">{action.desc}</p>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}

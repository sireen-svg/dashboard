import { Nav } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  { to: '/platform', label: 'Overview', icon: 'bi-speedometer2', end: true },
  { to: '/platform/projects', label: 'All projects', icon: 'bi-folder' },
  { to: '/platform/health', label: 'System health', icon: 'bi-activity' },
  { to: '/platform/logs', label: 'Event logs', icon: 'bi-list-ul' },
  { to: '/platform/audit-logs', label: 'Audit trail', icon: 'bi-shield-check' },
];

/**
 * Shell for the platform-owner dashboard.
 *
 * Deliberately not ProjectLayout: nothing here is scoped to a single project,
 * so there is no active project to resolve and no X-Project-Key to set.
 */
export default function PlatformLayout() {
  const { user } = useAuth();

  return (
    <div className="d-flex">
      <nav className="app-sidebar platform-sidebar">
        <div className="sidebar-project-info">
          <div className="sidebar-section-platform">Platform</div>
          <div className="sidebar-project-name">HyperCore</div>
          <div className="sidebar-project-id">{user?.email ?? 'operator'}</div>
        </div>

        <div className="sidebar-divider"></div>
        <Nav className="flex-column platform-nav">
          {LINKS.map((link) => (
            <Nav.Item key={link.to}>
              <Nav.Link as={NavLink} to={link.to} end={link.end}>
                <i className={`bi ${link.icon}`}></i>
                {link.label}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        <div className="sidebar-divider"></div>
        <div className="sidebar-section">Accounts</div>
        <Nav className="flex-column platform-nav">
          {/*
            Deliberately NO link into the project builder. Running the platform
            and authoring a tenant's content are different jobs — TenantRoute
            turns those routes away for this role, so offering them here would
            only be a dead end. Account administration IS the operator's, hence
            these two.
          */}
          <Nav.Item>
            <Nav.Link as={NavLink} to="/admin/users">
              <i className="bi bi-people"></i>
              Users
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link as={NavLink} to="/admin/roles">
              <i className="bi bi-key"></i>
              Roles
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </nav>

      <div className="content-area">
        <Outlet />
      </div>
    </div>
  );
}

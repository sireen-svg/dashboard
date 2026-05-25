import { useState, useRef, useEffect } from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordModal from '../ChangePasswordModal';

export default function Header({ projects = [], currentProject = null }) {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const isAdmin = user?.roles?.some((r) => [1, 2, 3].includes(r.id));
  const isOnAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (open || userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, userMenuOpen]);

  function handleSelectProject(projectId) {
    setOpen(false);
    navigate(`/projects/${projectId}`);
  }

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <>
      <Navbar className="app-header" variant="dark">
        <Container fluid className="px-3 d-flex justify-content-between">
          <div className="d-flex align-items-center gap-0">
            <Navbar.Brand as={Link} to="/dashboard">
              <span className="brand-icon">
                <i className="bi bi-grid-3x3-gap-fill text-white"></i>
              </span>
              Headless CMS
            </Navbar.Brand>

            {/* Project Selector */}
            <div className="project-selector" ref={dropdownRef}>
              <button
                className="project-selector-btn"
                onClick={() => setOpen(!open)}
              >
                <span className="project-selector-label">
                  {currentProject ? currentProject.name : 'Select a project'}
                </span>
                <i className={`bi bi-chevron-down project-selector-chevron ${open ? 'open' : ''}`}></i>
              </button>

              {open && (
                <div className="project-selector-dropdown">
                  <div className="project-selector-header">Recent projects</div>
                  <div className="project-selector-list">
                    {projects.length === 0 && (
                      <div className="project-selector-empty">No projects yet</div>
                    )}
                    {projects.map((p) => {
                      const pid = p.slug;
                      return (
                        <button
                          key={p.id}
                          className={`project-selector-item ${currentProject?.id === p.id ? 'active' : ''}`}
                          onClick={() => handleSelectProject(pid)}
                        >
                          <span className="project-selector-item-name">{p.name}</span>
                          <span className="project-selector-item-id">{(p.public_id || String(p.id)).substring(0, 8)}</span>
                          {currentProject?.id === p.id && (
                            <i className="bi bi-check-lg project-selector-check"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <Link
                    to="/projects/new"
                    className="project-selector-add"
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-plus-lg"></i>
                    Add project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="admin-nav-links">
              <Link
                to="/admin/users"
                className={`admin-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
              >
                <i className="bi bi-people"></i>
                <span>Users</span>
              </Link>
              <Link
                to="/admin/roles"
                className={`admin-nav-link ${location.pathname === '/admin/roles' ? 'active' : ''}`}
              >
                <i className="bi bi-shield-lock"></i>
                <span>Roles</span>
              </Link>
            </div>
          )}

          <div className="header-actions">
            {isAuthenticated && user && (
              <div className="position-relative" ref={userMenuRef}>
                <button
                  className="d-flex align-items-center gap-2 border-0 bg-transparent"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    {user.name || user.email}
                  </span>
                  <div className="header-avatar" title={user.name || 'Account'}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 6,
                    background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    minWidth: 220, zIndex: 1000, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8eaed' }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: '#202124' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: '#5f6368' }}>{user.email}</div>
                      {user.roles?.length > 0 && (
                        <div className="mt-1">
                          {user.roles.map((r) => (
                            <span key={r.id || r.name} className="badge bg-primary me-1" style={{ fontSize: 10 }}>
                              {r.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent px-3 py-2"
                      style={{ fontSize: 13, color: '#202124', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f4'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => { setUserMenuOpen(false); setShowChangePassword(true); }}
                    >
                      <i className="bi bi-key" style={{ fontSize: 14 }}></i>
                      Change password
                    </button>
                    <div style={{ borderTop: '1px solid #e8eaed' }}>
                      <button
                        className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent px-3 py-2"
                        style={{ fontSize: 13, color: '#ea4335', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fce8e6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right" style={{ fontSize: 14 }}></i>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </Navbar>

      <ChangePasswordModal
        show={showChangePassword}
        onHide={() => setShowChangePassword(false)}
      />
    </>
  );
}

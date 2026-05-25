import { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Sidebar({ projectSlug, projectName, dataTypes = [], enabledModules = [] }) {
  const bookingEnabled = enabledModules.includes('booking');
  const location = useLocation();
  const entriesBase = `/projects/${projectSlug}/entries`;
  const isOnEntries = location.pathname.startsWith(entriesBase);

  // Expand the Entries group whenever we're on an entries route.
  const [entriesOpen, setEntriesOpen] = useState(isOnEntries);
  useEffect(() => {
    if (isOnEntries) setEntriesOpen(true);
  }, [isOnEntries]);

  const buildLinks = [
    { to: `/projects/${projectSlug}`, label: 'Overview', icon: 'bi-speedometer2' },
    { to: `/projects/${projectSlug}/schema`, label: 'Schema Builder', icon: 'bi-table' },
    { to: `/projects/${projectSlug}/relationships`, label: 'Relationships', icon: 'bi-diagram-3' },
  ];

  const trailingManageLinks = [
    { to: `/projects/${projectSlug}/collections`, label: 'Collections', icon: 'bi-collection' },
    { to: `/projects/${projectSlug}/settings`, label: 'Settings', icon: 'bi-gear' },
  ];

  // Highlight a data-type child link based on the ?type= query string when on the list page.
  const params = new URLSearchParams(location.search);
  const activeType = params.get('type');

  return (
    <nav className="app-sidebar">
      <NavLink to="/dashboard" className="back-link">
        <i className="bi bi-arrow-left"></i>
        All Projects
      </NavLink>

      <div className="sidebar-project-info">
        <div className="sidebar-project-name">{projectName}</div>
        {projectSlug && (
          <div className="sidebar-project-id">{projectSlug}</div>
        )}
      </div>

      <div className="sidebar-section">Build</div>
      <Nav className="flex-column">
        {buildLinks.map((link) => (
          <Nav.Item key={link.to}>
            <Nav.Link as={NavLink} to={link.to} end>
              <i className={`bi ${link.icon}`}></i>
              {link.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="sidebar-divider"></div>
      <div className="sidebar-section">Manage</div>
      <Nav className="flex-column">
        {/* Entries — expandable group listing each data type as a child. */}
        <Nav.Item>
          <button
            type="button"
            className={`nav-link sidebar-group-toggle${isOnEntries ? ' active' : ''}`}
            onClick={() => setEntriesOpen((v) => !v)}
            aria-expanded={entriesOpen}
          >
            <i className="bi bi-file-earmark-text"></i>
            <span className="group-label">Entries</span>
            <i className="bi bi-chevron-right group-chevron"></i>
          </button>
        </Nav.Item>

        {entriesOpen && (
          <div className="sidebar-subnav">
            {dataTypes.length === 0 ? (
              <div className="sidebar-subnav-empty">No data types yet</div>
            ) : (
              dataTypes.map((dt) => {
                const to = `${entriesBase}?type=${encodeURIComponent(dt.slug)}`;
                // NavLink would mark every child active because they share the same pathname.
                // Drive active state from the ?type= query string instead.
                const isActive =
                  location.pathname === entriesBase && activeType === dt.slug;
                return (
                  <Link
                    key={dt.id}
                    to={to}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    title={dt.name}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dt.name}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {trailingManageLinks.map((link) => (
          <Nav.Item key={link.to}>
            <Nav.Link as={NavLink} to={link.to} end>
              <i className={`bi ${link.icon}`}></i>
              {link.label}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {bookingEnabled && (
        <>
          <div className="sidebar-divider"></div>
          <div className="sidebar-section">Booking</div>
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link as={NavLink} to={`/projects/${projectSlug}/booking/resources`}>
                <i className="bi bi-calendar-check"></i>
                Resources
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </>
      )}
    </nav>
  );
}

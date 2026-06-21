import { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, NavLink, useLocation } from 'react-router-dom';

// A collapsible, route-driven nav group (e.g. Booking, Commerce). Auto-expands
// when the current route falls under `basePath`. Mirrors the Entries group styling.
function CollapsibleNavGroup({ label, icon, basePath, links }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(basePath);
  const [open, setOpen] = useState(isActive);
  // Auto-expand when navigating into this group. Adjust state during render
  // (React's recommended pattern) instead of in an effect.
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) setOpen(true);
  }

  return (
    <Nav.Item>
      <button
        type="button"
        className={`nav-link sidebar-group-toggle${isActive ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <i className={`bi ${icon}`}></i>
        <span className="group-label">{label}</span>
        <i className="bi bi-chevron-right group-chevron"></i>
      </button>

      {open && (
        <div className="sidebar-subnav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive: active }) => `nav-link${active ? ' active' : ''}`}
            >
              <i className={`bi ${l.icon}`} style={{ marginRight: 8, fontSize: 13 }}></i>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </Nav.Item>
  );
}

export default function Sidebar({ projectSlug, projectName, dataTypes = [], enabledModules = [] }) {
  const bookingEnabled = enabledModules.includes('booking');
  const ecommerceEnabled = enabledModules.includes('ecommerce');
  const location = useLocation();
  const entriesBase = `/projects/${projectSlug}/entries`;
  const isOnEntries = location.pathname.startsWith(entriesBase);

  // Expand the Entries group whenever we're on an entries route. Adjust state
  // during render (React's recommended pattern) instead of in an effect.
  const [entriesOpen, setEntriesOpen] = useState(isOnEntries);
  const [wasOnEntries, setWasOnEntries] = useState(isOnEntries);
  if (isOnEntries !== wasOnEntries) {
    setWasOnEntries(isOnEntries);
    if (isOnEntries) setEntriesOpen(true);
  }

  const buildLinks = [
    { to: `/projects/${projectSlug}`, label: 'Overview', icon: 'bi-speedometer2' },
    { to: `/projects/${projectSlug}/schema`, label: 'Schema Builder', icon: 'bi-table' },
    { to: `/projects/${projectSlug}/relationships`, label: 'Relationships', icon: 'bi-diagram-3' },
  ];

  const trailingManageLinks = [
    { to: `/projects/${projectSlug}/collections`, label: 'Collections', icon: 'bi-collection' },
    { to: `/projects/${projectSlug}/settings`, label: 'Settings', icon: 'bi-gear' },
  ];

  const bookingLinks = [
    { to: `/projects/${projectSlug}/booking/resources`, label: 'Resources', icon: 'bi-calendar-check' },
  ];

  // Products aren't a Commerce entity — they're CMS entries of the module's
  // "products" data type. Deep-link the Commerce group straight to those entries.
  const productsType = dataTypes.find((dt) => dt.slug === 'products')
    || dataTypes.find((dt) => /product/i.test(dt.slug) || /product/i.test(dt.name || ''));
  const productsSlug = productsType?.slug || 'products';

  const commerceLinks = [
    { to: `/projects/${projectSlug}/entries?type=${encodeURIComponent(productsSlug)}`, label: 'Products', icon: 'bi-box-seam' },
    { to: `/projects/${projectSlug}/commerce/offers`, label: 'Offers', icon: 'bi-tag' },
    { to: `/projects/${projectSlug}/commerce/orders`, label: 'Orders', icon: 'bi-bag-check' },
    { to: `/projects/${projectSlug}/commerce/returns`, label: 'Returns', icon: 'bi-arrow-return-left' },
    { to: `/projects/${projectSlug}/commerce/analytics`, label: 'Analytics', icon: 'bi-graph-up' },
  ];

  // Search — always visible, not gated behind any module flag.
  const searchLinks = [
    { to: `/projects/${projectSlug}/search/popular`,  label: 'Popular searches', icon: 'bi-fire' },
    { to: `/projects/${projectSlug}/search/logs`,     label: 'Search logs',      icon: 'bi-list-ul' },
    { to: `/projects/${projectSlug}/search/problems`, label: 'Problems',         icon: 'bi-exclamation-triangle' },
    { to: `/projects/${projectSlug}/search/debug`,    label: 'Debug query',      icon: 'bi-bug' },
  ];

  const searchDevLinks = [
    { to: `/projects/${projectSlug}/search/config`,   label: 'Config',     icon: 'bi-sliders' },
    { to: `/projects/${projectSlug}/search/compare`,  label: 'A/B compare', icon: 'bi-layout-split' },
    { to: `/projects/${projectSlug}/search/ai-rerun`, label: 'AI re-run',  icon: 'bi-cpu' },
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

      {/* Search — permanent section, always rendered for every project. */}
      <div className="sidebar-divider"></div>
      <div className="sidebar-section-search">Search</div>
      <Nav className="flex-column search-nav">
        <CollapsibleNavGroup
          label="Search admin"
          icon="bi-search"
          basePath={`/projects/${projectSlug}/search`}
          links={searchLinks}
        />
      </Nav>
      <Nav className="flex-column search-dev-nav">
        <CollapsibleNavGroup
          label="Dev tools"
          icon="bi-terminal"
          basePath={`/projects/${projectSlug}/search/config`}
          links={searchDevLinks}
        />
      </Nav>

      {/* Module sections — each enabled module is a collapsible group. */}
      {(bookingEnabled || ecommerceEnabled) && (
        <>
          <div className="sidebar-divider"></div>
          <div className="sidebar-section">Modules</div>
          <Nav className="flex-column">
            {bookingEnabled && (
              <CollapsibleNavGroup
                label="Booking"
                icon="bi-calendar-check"
                basePath={`/projects/${projectSlug}/booking`}
                links={bookingLinks}
              />
            )}
            {ecommerceEnabled && (
              <CollapsibleNavGroup
                label="Commerce"
                icon="bi-cart3"
                basePath={`/projects/${projectSlug}/commerce`}
                links={commerceLinks}
              />
            )}
          </Nav>
        </>
      )}
    </nav>
  );
}
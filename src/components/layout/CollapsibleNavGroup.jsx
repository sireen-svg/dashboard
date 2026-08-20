import { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink, useLocation } from 'react-router-dom';

// A collapsible, route-driven nav group. Auto-expands when the current
// route falls under `basePath`.
export default function CollapsibleNavGroup({ label, icon, basePath, links }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(basePath);
  const [open, setOpen] = useState(isActive);
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
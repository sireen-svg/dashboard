import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import CollapsibleNavGroup from "./CollapsibleNavGroup";
import { DOCS_NAV } from "../../pages/docs/docsNav";

// Mirrors Sidebar.jsx's structure 1:1 (same `app-sidebar` / `sidebar-section`
// / `back-link` classes) so Documentation reads as a native section of the
// dashboard rather than a bolted-on page.
export default function DocsSidebar() {
  return (
    <nav className="app-sidebar">
      <NavLink to="/dashboard" className="back-link">
        <i className="bi bi-arrow-left"></i>
        Back to Dashboard
      </NavLink>

      <div className="sidebar-project-info">
        <div className="sidebar-project-name">Documentation</div>
        <div className="sidebar-project-id">HyperCore Platform</div>
      </div>

      {DOCS_NAV.map((entry) => (
        <div key={entry.section}>
          <div className="sidebar-divider"></div>
          <div className="sidebar-section">{entry.section}</div>
          <Nav className="flex-column">
            {entry.group && (
              <CollapsibleNavGroup
                label={entry.group.label}
                icon={entry.group.icon}
                basePath={entry.group.basePath}
                links={entry.group.links}
              />
            )}
            {entry.links?.map((link) => (
              <Nav.Item key={link.to}>
                <Nav.Link as={NavLink} to={link.to} end>
                  <i className={`bi ${link.icon}`}></i>
                  {link.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        </div>
      ))}
    </nav>
  );
}

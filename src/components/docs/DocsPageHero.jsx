import { Link } from 'react-router-dom';

// Shared hero block for every docs content page.
export default function DocsPageHero({ eyebrow, title, highlight, subtitle, breadcrumb }) {
  return (
    <div className="docs-hero">
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="docs-breadcrumb">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.label}>
              {i > 0 && <span className="docs-breadcrumb-sep">/</span>}
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="docs-hero-eyebrow">{eyebrow}</div>
      <h1 className="docs-hero-title">
        {title}
        {highlight && <span className="docs-hero-highlight"> {highlight}</span>}
      </h1>
      {subtitle && <p className="docs-hero-subtitle">{subtitle}</p>}
    </div>
  );
}
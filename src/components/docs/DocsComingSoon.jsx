import { Link } from 'react-router-dom';

export default function DocsComingSoon({ title }) {
  return (
    <div className="docs-coming-soon">
      <i className="bi bi-hourglass-split docs-coming-soon-icon"></i>
      <h2 className="docs-coming-soon-title">{title}</h2>
      <p className="docs-coming-soon-body">
        This section's content is being migrated into the dashboard and will be available shortly.
      </p>
      <Link to="/docs/introduction" className="btn btn-primary btn-sm">
        Back to Introduction
      </Link>
    </div>
  );
}
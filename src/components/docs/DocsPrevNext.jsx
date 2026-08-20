import { Link } from 'react-router-dom';
import { getPrevNext } from '../../pages/docs/docsNav';

export default function DocsPrevNext({ currentPath }) {
  const { prev, next } = getPrevNext(currentPath);
  if (!prev && !next) return null;

  return (
    <div className="docs-prev-next">
      {prev ? (
        <Link to={prev.to} className="docs-prev-next-link docs-prev-next-link--prev">
          <i className="bi bi-arrow-left"></i>
          <div>
            <div className="docs-prev-next-label">Previous</div>
            <div className="docs-prev-next-title">{prev.label}</div>
          </div>
        </Link>
      ) : <span />}
      {next ? (
        <Link to={next.to} className="docs-prev-next-link docs-prev-next-link--next">
          <div>
            <div className="docs-prev-next-label">Next</div>
            <div className="docs-prev-next-title">{next.label}</div>
          </div>
          <i className="bi bi-arrow-right"></i>
        </Link>
      ) : <span />}
    </div>
  );
}
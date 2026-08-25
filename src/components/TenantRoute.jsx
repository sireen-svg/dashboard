import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

/**
 * Guards the project-builder area — the routes that create projects, edit
 * schema and add entries.
 *
 * The platform operator (hyper_core) is sent to /platform instead. Their job is
 * to run the platform, not to author tenant content, so those screens are not
 * theirs to act on. Hiding the buttons in Header is not enough on its own: the
 * routes are reachable by URL, and the operator's /api/projects is unscoped, so
 * they could otherwise open any tenant's entry editor directly.
 */
export default function TenantRoute({ children }) {
  const { isAuthenticated, isHyperCore, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isHyperCore) {
    return <Navigate to="/platform" replace />;
  }

  return children;
}

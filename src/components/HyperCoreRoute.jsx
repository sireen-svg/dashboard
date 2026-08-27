import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

/**
 * Gate for the platform-operator area. The CMS enforces this server-side via
 * its `hypercore` middleware — this only keeps a non-operator from landing on
 * a page whose every request would come back 403.
 */
export default function HyperCoreRoute({ children }) {
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

  if (!isHyperCore) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

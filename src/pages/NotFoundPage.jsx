import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h4 className="mb-2" style={{ fontWeight: 400, color: '#202124', fontFamily: "'Google Sans', sans-serif" }}>
        Page not found
      </h4>
      <p style={{ color: '#5f6368', fontSize: 14 }} className="mb-4">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button as={Link} to="/dashboard" variant="primary" size="sm">
        Back to dashboard
      </Button>
    </div>
  );
}

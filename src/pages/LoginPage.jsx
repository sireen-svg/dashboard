import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (msg?.toLowerCase().includes('locked')) {
        setError('Account is temporarily locked due to too many failed attempts. Please try again later.');
      } else if (msg?.toLowerCase().includes('verified')) {
        setError('Please verify your email first. Check your inbox for the OTP.');
      } else {
        setError(msg || getApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4">
          <div className="mb-3">
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 48, borderRadius: 12, background: '#1a73e8', color: '#fff', fontSize: 22
            }}>
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </span>
          </div>
          <h2 style={{ fontWeight: 400, fontSize: 24, color: '#202124', fontFamily: "'Google Sans', sans-serif" }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: '#5f6368' }}>Use your account to continue</p>
        </div>

        <Card>
          <Card.Body className="p-4">
            {error && <Alert variant="danger" className="mb-3" style={{ fontSize: 13 }}>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="email"
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Form.Group>
              <Button type="submit" className="w-100 mb-3" disabled={!email.trim() || !password.trim() || loading}>
                {loading ? <Spinner size="sm" animation="border" /> : 'Sign in'}
              </Button>
              <div className="text-center">
                <span style={{ fontSize: 13, color: '#5f6368' }}>Don't have an account? </span>
                <Link to="/register" style={{ fontSize: 13 }}>Create account</Link>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

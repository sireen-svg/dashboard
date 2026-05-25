import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../lib/utils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp, isAuthenticated } = useAuth();

  // Steps: 'register' | 'otp'
  const [step, setStep] = useState('register');
  const [userId, setUserId] = useState(null);

  // Register form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // OTP form
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim(), password, passwordConfirmation);
      setUserId(data.user_id);
      setStep('otp');
      setSuccess('Account created! Check your email for the verification code.');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors).flat()[0];
        setError(firstError || getApiError(err));
      } else {
        setError(err.response?.data?.message || getApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await verifyOtp(userId, otp.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setSuccess('');
    try {
      await resendOtp(userId);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
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
            {step === 'register' ? 'Create account' : 'Verify your email'}
          </h2>
          <p style={{ fontSize: 14, color: '#5f6368' }}>
            {step === 'register'
              ? 'Sign up to get started with Headless CMS'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <Card>
          <Card.Body className="p-4">
            {error && <Alert variant="danger" className="mb-3" style={{ fontSize: 13 }}>{error}</Alert>}
            {success && <Alert variant="success" className="mb-3" style={{ fontSize: 13 }}>{success}</Alert>}

            {step === 'register' ? (
              <Form onSubmit={handleRegister}>
                <Form.Group className="mb-3">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    autoComplete="name"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Confirm password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Re-enter your password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className="w-100 mb-3"
                  disabled={!name.trim() || !email.trim() || !password || !passwordConfirmation || loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : 'Create account'}
                </Button>
                <div className="text-center">
                  <span style={{ fontSize: 13, color: '#5f6368' }}>Already have an account? </span>
                  <Link to="/login" style={{ fontSize: 13 }}>Sign in</Link>
                </div>
              </Form>
            ) : (
              <Form onSubmit={handleVerifyOtp}>
                <Form.Group className="mb-4">
                  <Form.Label>Verification code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                    }}
                    maxLength={6}
                    autoFocus
                    style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'monospace' }}
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className="w-100 mb-3"
                  disabled={otp.length !== 6 || loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : 'Verify'}
                </Button>
                <div className="text-center">
                  <span style={{ fontSize: 13, color: '#5f6368' }}>Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="btn btn-link p-0"
                    style={{ fontSize: 13 }}
                  >
                    Resend
                  </button>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

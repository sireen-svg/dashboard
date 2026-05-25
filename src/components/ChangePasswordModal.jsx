import { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../lib/utils';

export default function ChangePasswordModal({ show, onHide }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  }

  function handleClose() {
    reset();
    onHide();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess('Password changed successfully');
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title>Change password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" style={{ fontSize: 13 }}>{error}</Alert>}
        {success && <Alert variant="success" style={{ fontSize: 13 }}>{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Current password</Form.Label>
            <Form.Control
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>New password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Confirm new password</Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Form.Group>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={!currentPassword || !newPassword || !confirmPassword || loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Change password'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

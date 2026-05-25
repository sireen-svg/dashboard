import { useState, useEffect } from 'react';
import { Button, Spinner, Modal, Form } from 'react-bootstrap';
import { getAllUsers, assignRoleToUser, removeRoleFromUser } from '../api/auth';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 1, name: 'Owner', color: '#ab47bc' },
  { id: 2, name: 'Super Admin', color: '#ea4335' },
  { id: 3, name: 'Admin', color: '#f9ab00' },
  { id: 4, name: 'User', color: '#34a853' },
];

function getRoleBadge(role) {
  const def = ROLES.find((r) => r.id === role.id) || { color: '#5f6368' };
  return (
    <span
      key={role.id}
      className="admin-role-badge"
      style={{ '--role-color': def.color }}
    >
      {role.name}
    </span>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await getAllUsers();
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAssignModal(user) {
    setSelectedUser(user);
    const currentRole = user.roles?.[0];
    setSelectedRoleId(currentRole?.id || 4);
    setShowModal(true);
  }

  async function handleAssignRole() {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await assignRoleToUser(selectedUser.id, selectedRoleId);
      showToast('Role updated successfully', 'success');
      setShowModal(false);
      await loadUsers();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveRole(userId) {
    if (!confirm('Reset this user to the default "User" role?')) return;
    try {
      await removeRoleFromUser(userId);
      showToast('Role removed successfully', 'success');
      await loadUsers();
    } catch (err) {
      showToast(getApiError(err), 'error');
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="page-container d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">User Management</h2>
          <p className="admin-page-subtitle">
            {users.length} user{users.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-wrapper">
          <i className="bi bi-search admin-search-icon"></i>
          <input
            type="text"
            className="admin-search"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Roles</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4" style={{ color: '#5f6368' }}>
                  {search ? 'No users match your search' : 'No users found'}
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <div className="admin-user-avatar">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="fw-medium">{u.name || 'Unnamed'}</span>
                  </div>
                </td>
                <td style={{ color: '#5f6368' }}>{u.email}</td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    {(u.roles || []).map((r) => getRoleBadge(r))}
                    {(!u.roles || u.roles.length === 0) && (
                      <span style={{ color: '#9aa0a6', fontSize: 12 }}>No role</span>
                    )}
                  </div>
                </td>
                <td>
                  {u.id !== currentUser?.id && (
                    <div className="d-flex gap-1">
                      <button
                        className="admin-action-btn"
                        title="Change role"
                        onClick={() => openAssignModal(u)}
                      >
                        <i className="bi bi-shield-check"></i>
                      </button>
                      {u.roles?.some((r) => r.id !== 4) && (
                        <button
                          className="admin-action-btn admin-action-btn--danger"
                          title="Reset to User role"
                          onClick={() => handleRemoveRole(u.id)}
                        >
                          <i className="bi bi-shield-x"></i>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16, fontWeight: 500 }}>
            Change Role
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p style={{ fontSize: 13, color: '#5f6368', marginBottom: 16 }}>
                Changing role for <strong>{selectedUser.name || selectedUser.email}</strong>
              </p>
              <Form.Group>
                <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Role</Form.Label>
                <Form.Select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAssignRole} disabled={submitting}>
            {submitting ? <Spinner size="sm" animation="border" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Modal, Form } from 'react-bootstrap';
import {
  getAllUsers,
  addPermission,
  assignPermissionToRole,
  removePermissionFromRole,
} from '../api/auth';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

const ROLES = [
  { id: 1, name: 'Owner', color: '#ab47bc' },
  { id: 2, name: 'Super Admin', color: '#ea4335' },
  { id: 3, name: 'Admin', color: '#f9ab00' },
  { id: 4, name: 'User', color: '#34a853' },
];

export default function RolesPermissions() {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [rolePermMap, setRolePermMap] = useState({});
  const [showAddPerm, setShowAddPerm] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(null);

  const extractPermissions = useCallback((users) => {
    const permMap = {};
    const rpMap = {};

    users.forEach((u) => {
      (u.roles || []).forEach((role) => {
        (role.permessions || role.permissions || []).forEach((p) => {
          permMap[p.id] = p;
          if (!rpMap[role.id]) rpMap[role.id] = new Set();
          rpMap[role.id].add(p.id);
        });
      });
    });

    const serialized = {};
    for (const [roleId, permSet] of Object.entries(rpMap)) {
      serialized[roleId] = [...permSet];
    }

    setPermissions(Object.values(permMap).sort((a, b) => a.name.localeCompare(b.name)));
    setRolePermMap(serialized);
  }, []);

  async function loadData() {
    try {
      const res = await getAllUsers();
      const users = res.data?.data || res.data || [];
      extractPermissions(users);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function hasPermission(roleId, permId) {
    return rolePermMap[roleId]?.includes(permId) || false;
  }

  async function togglePermission(roleId, permId) {
    const key = `${roleId}-${permId}`;
    setToggling(key);
    try {
      if (hasPermission(roleId, permId)) {
        await removePermissionFromRole(permId, roleId);
        setRolePermMap((prev) => ({
          ...prev,
          [roleId]: (prev[roleId] || []).filter((id) => id !== permId),
        }));
        showToast('Permission removed', 'success');
      } else {
        await assignPermissionToRole(permId, roleId);
        setRolePermMap((prev) => ({
          ...prev,
          [roleId]: [...(prev[roleId] || []), permId],
        }));
        showToast('Permission assigned', 'success');
      }
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setToggling(null);
    }
  }

  async function handleAddPermission(e) {
    e.preventDefault();
    if (!newPermName.trim()) return;
    setSubmitting(true);
    try {
      await addPermission(newPermName.trim());
      showToast('Permission created', 'success');
      setNewPermName('');
      setShowAddPerm(false);
      setLoading(true);
      await loadData();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

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
          <h2 className="admin-page-title">Roles & Permissions</h2>
          <p className="admin-page-subtitle">
            Manage what each role can do across the platform
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddPerm(true)}>
          <i className="bi bi-plus-lg me-1"></i>Add Permission
        </Button>
      </div>

      {/* Role cards overview */}
      <div className="admin-roles-grid">
        {ROLES.map((role) => {
          const count = (rolePermMap[role.id] || []).length;
          return (
            <div key={role.id} className="admin-role-card">
              <div
                className="admin-role-card-indicator"
                style={{ background: role.color }}
              />
              <div className="admin-role-card-body">
                <div className="admin-role-card-name">{role.name}</div>
                <div className="admin-role-card-count">
                  {count} permission{count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="admin-table-card">
        {permissions.length === 0 ? (
          <div className="text-center py-5" style={{ color: '#5f6368' }}>
            <i className="bi bi-shield-lock" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
            No permissions defined yet. Add one to get started.
          </div>
        ) : (
          <table className="admin-table admin-matrix-table">
            <thead>
              <tr>
                <th>Permission</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="text-center" style={{ width: 120 }}>
                    <span className="admin-role-badge" style={{ '--role-color': r.color }}>
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.id}>
                  <td>
                    <code className="admin-perm-name">{perm.name}</code>
                  </td>
                  {ROLES.map((role) => {
                    const key = `${role.id}-${perm.id}`;
                    const active = hasPermission(role.id, perm.id);
                    return (
                      <td key={role.id} className="text-center">
                        <button
                          className={`admin-toggle ${active ? 'admin-toggle--active' : ''}`}
                          onClick={() => togglePermission(role.id, perm.id)}
                          disabled={toggling === key}
                          title={active ? 'Remove permission' : 'Grant permission'}
                        >
                          {toggling === key ? (
                            <Spinner size="sm" animation="border" />
                          ) : (
                            <i className={`bi ${active ? 'bi-check-lg' : 'bi-x-lg'}`}></i>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal show={showAddPerm} onHide={() => setShowAddPerm(false)} centered>
        <Form onSubmit={handleAddPermission}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: 16, fontWeight: 500 }}>
              Add Permission
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label style={{ fontSize: 13, fontWeight: 500 }}>Permission Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. manage_users, edit_content"
                value={newPermName}
                onChange={(e) => setNewPermName(e.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted">
                Use snake_case for permission names
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowAddPerm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting || !newPermName.trim()}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

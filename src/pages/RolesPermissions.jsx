import { useState, useEffect, useCallback } from 'react';
import { Button, Spinner, Modal, Form } from 'react-bootstrap';
import {
  getAllRoles,
  getAllPermissions,
  addPermission,
  assignPermissionToRole,
  removePermissionFromRole,
} from '../api/auth';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';

// Roles come from the auth service now. These colours keep the existing look for the
// built-in roles; anything new gets a colour from the fallback list by position.
const ROLE_COLORS = {
  owner: '#ab47bc',
  hyper_core: '#ea4335',
  admin: '#f9ab00',
  user: '#34a853',
};
const FALLBACK_COLORS = ['#1a73e8', '#00897b', '#e8710a', '#7b1fa2', '#5f6368'];

// `hyper_core` -> `Hyper Core`. Shows the real role name rather than a label that
// drifts from the backend, which is how this page came to call it "Super Admin".
function roleLabel(name) {
  return String(name || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function decorateRole(role, index) {
  return {
    ...role,
    label: roleLabel(role.name),
    color: ROLE_COLORS[role.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };
}

export default function RolesPermissions() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermMap, setRolePermMap] = useState({});
  const [showAddPerm, setShowAddPerm] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(null);

  const loadData = useCallback(async () => {
    try {
      // Roles arrive with their `permessions` relation, so the whole matrix comes from
      // these two catalog calls — every role and permission shows up even when no user
      // holds it, and the mapping no longer has to be scraped out of the users payload.
      const [rolesRes, permsRes] = await Promise.all([
        getAllRoles(),
        getAllPermissions(),
      ]);

      const roleList = rolesRes.data?.roles || rolesRes.data?.data || [];
      const permList = permsRes.data?.permissions || permsRes.data?.data || [];

      const rpMap = {};
      roleList.forEach((role) => {
        rpMap[role.id] = (role.permessions || role.permissions || []).map((p) => p.id);
      });

      setRoles([...roleList].sort((a, b) => a.id - b.id).map(decorateRole));
      setPermissions([...permList].sort((a, b) => a.name.localeCompare(b.name)));
      setRolePermMap(rpMap);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        {roles.map((role) => {
          const count = (rolePermMap[role.id] || []).length;
          return (
            <div key={role.id} className="admin-role-card">
              <div
                className="admin-role-card-indicator"
                style={{ background: role.color }}
              />
              <div className="admin-role-card-body">
                <div className="admin-role-card-name">{role.label}</div>
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
                {roles.map((r) => (
                  <th key={r.id} className="text-center" style={{ width: 120 }}>
                    <span className="admin-role-badge" style={{ '--role-color': r.color }}>
                      {r.label}
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
                  {roles.map((role) => {
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

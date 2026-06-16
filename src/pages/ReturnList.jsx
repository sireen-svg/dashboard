import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Card, Badge, Spinner, Button, Form } from 'react-bootstrap';
import { listReturnRequests, updateReturnRequest } from '../api/ecommerce';
import { extractList } from '../lib/commerce';
import { getApiError } from '../lib/utils';
import { showToast } from '../components/Toast';

const RETURN_VARIANT = {
  pending: 'secondary',
  approved: 'success',
  rejected: 'danger',
};

export default function ReturnList() {
  const { project } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (ecommerceEnabled) loadReturns(statusFilter);
  }, [ecommerceEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadReturns(status) {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await listReturnRequests(params);
      setReturns(extractList(res));
    } catch (err) {
      showToast(getApiError(err), 'error');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(value) {
    setStatusFilter(value);
    loadReturns(value);
  }

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      await updateReturnRequest(id, status);
      showToast(`Return ${status}`, status === 'approved' ? 'success' : 'info');
      loadReturns();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (!ecommerceEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>Return requests</h2>
          <p className="page-subtitle">
            {returns.length} request{returns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Form.Select
          size="sm"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </Form.Select>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-arrow-return-left"></i></div>
          <div className="empty-title">No return requests</div>
          <div className="empty-desc">
            Return requests submitted by customers will appear here for review.
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {returns.map((r) => {
            const pending = (r.status || 'pending') === 'pending';
            return (
              <Card key={r.id}>
                <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-medium" style={{ fontSize: 15, color: '#202124' }}>
                      Return #{r.id} · Order #{r.order_id}
                    </div>
                    <div className="d-flex gap-2 mt-1 align-items-center flex-wrap">
                      <Badge bg={RETURN_VARIANT[r.status] || 'secondary'}>{r.status || 'pending'}</Badge>
                      {r.quantity != null && (
                        <span style={{ fontSize: 12, color: '#5f6368' }}>Qty: {r.quantity}</span>
                      )}
                      {r.user_id && (
                        <span style={{ fontSize: 12, color: '#5f6368' }}>User #{r.user_id}</span>
                      )}
                    </div>
                    {r.description && (
                      <div className="mt-1" style={{ fontSize: 13, color: '#3c4043' }}>{r.description}</div>
                    )}
                  </div>
                  {pending && (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-success"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r.id, 'approved')}
                      >
                        {busyId === r.id ? <Spinner size="sm" animation="border" /> : 'Approve'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

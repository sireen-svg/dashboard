import { useState, useEffect } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { Card, Spinner, Row, Col, Table } from 'react-bootstrap';
import {
  getSalesSummary, getTopProducts, getTopCustomers, getReturnsAnalytics,
} from '../api/ecommerce';

function humanize(key) {
  return String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Render the scalar fields of an object as stat cards.
function StatCards({ data }) {
  if (!data || typeof data !== 'object') return null;
  const scalars = Object.entries(data).filter(
    ([, v]) => v == null || typeof v === 'number' || typeof v === 'string'
  );
  if (scalars.length === 0) return <div className="text-muted" style={{ fontSize: 13 }}>No data.</div>;
  return (
    <Row className="g-2">
      {scalars.map(([k, v]) => (
        <Col key={k} xs={6} md={3}>
          <Card className="h-100">
            <Card.Body className="p-3">
              <div style={{ fontSize: 12, color: '#5f6368' }}>{humanize(k)}</div>
              <div className="fw-medium" style={{ fontSize: 20, color: '#202124' }}>
                {v == null ? '—' : v}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// Render an array of objects as a simple table using the first row's keys.
function DataTable({ rows, emptyText }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return <div className="text-muted" style={{ fontSize: 13 }}>{emptyText || 'No data.'}</div>;
  }
  const cols = Object.keys(rows[0]).filter((k) => {
    const v = rows[0][k];
    return v == null || typeof v === 'number' || typeof v === 'string';
  });
  return (
    <Table size="sm" hover responsive className="mb-0">
      <thead>
        <tr>{cols.map((c) => <th key={c} style={{ fontSize: 12, color: '#5f6368' }}>{humanize(c)}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i}>
            {cols.map((c) => <td key={c} style={{ fontSize: 13 }}>{r[c] == null ? '—' : String(r[c])}</td>)}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? null;
}

export default function EcommerceAnalytics() {
  const { project } = useOutletContext();
  const projectSlug = project.slug;
  const ecommerceEnabled = (project.enabled_modules || []).includes('ecommerce');

  const [loading, setLoading] = useState(true);
  // Raw `data` objects from each endpoint (shapes documented inline below).
  const [sales, setSales] = useState(null);      // { period, orders: {total, total_revenue, ...} }
  const [products, setProducts] = useState(null); // { top_by_quantity: [], least_sold: [] }
  const [customers, setCustomers] = useState(null); // { summary: {...}, top_customers: [] }
  const [returns, setReturns] = useState(null);  // { summary: {...}, most_returned_products: [] }

  useEffect(() => {
    if (ecommerceEnabled) loadAll();
  }, [ecommerceEnabled]);

  async function loadAll() {
    setLoading(true);
    // Each call is independent — don't let one failure blank the whole page.
    const [s, p, c, r] = await Promise.allSettled([
      getSalesSummary(), getTopProducts(), getTopCustomers(), getReturnsAnalytics(),
    ]);
    if (s.status === 'fulfilled') setSales(unwrap(s.value));
    if (p.status === 'fulfilled') setProducts(unwrap(p.value));
    if (c.status === 'fulfilled') setCustomers(unwrap(c.value));
    if (r.status === 'fulfilled') setReturns(unwrap(r.value));
    setLoading(false);
  }

  if (!ecommerceEnabled) {
    return <Navigate to={`/projects/${projectSlug}`} replace />;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Commerce analytics</h2>
        <p className="page-subtitle">Sales, products, customers, and returns</p>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          <section>
            <h6 className="fw-medium mb-2" style={{ fontSize: 14 }}>Sales</h6>
            <StatCards data={sales?.orders} />
          </section>

          <section>
            <h6 className="fw-medium mb-2" style={{ fontSize: 14 }}>Customers</h6>
            <StatCards data={customers?.summary} />
          </section>

          <Row className="g-3">
            <Col md={6}>
              <Card>
                <Card.Body className="p-3">
                  <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>Top products</h6>
                  <DataTable rows={products?.top_by_quantity} emptyText="No product sales yet." />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body className="p-3">
                  <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>Top customers</h6>
                  <DataTable rows={customers?.top_customers} emptyText="No customers yet." />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <section>
            <h6 className="fw-medium mb-2" style={{ fontSize: 14 }}>Returns</h6>
            <StatCards data={returns?.summary} />
            <div className="mt-3">
              <Card>
                <Card.Body className="p-3">
                  <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>Most returned products</h6>
                  <DataTable rows={returns?.most_returned_products} emptyText="No returns yet." />
                </Card.Body>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

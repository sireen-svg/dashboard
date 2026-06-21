import { Card, Row, Col, Badge } from "react-bootstrap";
import KpiCard from "./KpiCard";
import { TrendChart } from "./AnalyticsCharts";
import { formatMoney, formatPercent } from "../../lib/analytics";

function SectionEmpty({ label }) {
  return (
    <div className="empty-state py-4">
      <div className="empty-icon">
        <i className="bi bi-bag-x"></i>
      </div>
      <div className="empty-title">No data</div>
      <div className="empty-desc">
        No {label} data available for the selected range.
      </div>
    </div>
  );
}

function SubHeading({ title }) {
  return <div className="section-label mt-3 mb-2">{title}</div>;
}

// ── Sales overview ────────────────────────────────────────────────────────────
function SalesSection({ sales }) {
  if (!sales) return <SectionEmpty label="sales" />;
  const orders = sales.orders || {};
  const items = sales.items || {};
  const returns = sales.returns || {};
  const byStatus = orders.by_status || {};

  return (
    <>
      <SubHeading title="Orders" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-bag-check"
            label="Total Orders"
            value={orders.total ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-currency-dollar"
            label="Total Revenue"
            value={formatMoney(orders.total_revenue)}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-receipt"
            label="Avg Order Value"
            value={formatMoney(orders.avg_order_value)}
            bg="#f3e8fd"
            color="#ab47bc"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-box-seam"
            label="Items Sold"
            value={items.total_sold ?? "—"}
            bg="#e0f7fa"
            color="#00bcd4"
            sub={`${items.unique_products ?? 0} unique products`}
          />
        </Col>
      </Row>
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-x-circle"
            label="Cancellation Rate"
            value={formatPercent(orders.cancellation_rate)}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-arrow-return-left"
            label="Return Rate"
            value={formatPercent(orders.return_rate)}
            bg="#fff3e0"
            color="#ff9800"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-arrow-return-left"
            label="Returns Approved"
            value={returns.approved ?? "—"}
            bg="#e6f4ea"
            color="#34a853"
            sub={`of ${returns.total ?? 0} requests`}
          />
        </Col>
      </Row>

      {Object.keys(byStatus).length > 0 && (
        <Card className="mb-3">
          <Card.Body className="p-3">
            <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
              Orders by status
            </h6>
            <div className="d-flex flex-wrap gap-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="fw-medium" style={{ fontSize: 20 }}>
                    {count}
                  </div>
                  <Badge bg="secondary" style={{ textTransform: "capitalize" }}>
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

// ── Sales trend ────────────────────────────────────────────────────────────────
function SalesTrendSection({ trend }) {
  if (!trend) return null;
  const ordersRows = (trend.data || []).map((r) => ({
    label: r.label,
    count: r.orders_count ?? 0,
  }));
  const revenueRows = (trend.data || []).map((r) => ({
    label: r.label,
    count: r.revenue ?? 0,
  }));

  return (
    <Row className="g-3 mb-3">
      <Col lg={6}>
        <Card className="h-100">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-1" style={{ fontSize: 14 }}>
              Orders trend
            </h6>
            <p className="mb-3" style={{ fontSize: 12, color: "#5f6368" }}>
              {trend.period} · {trend.from} → {trend.to}
            </p>
            <TrendChart
              data={ordersRows}
              color="#1a73e8"
              height={220}
              defaultType="bar"
            />
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6}>
        <Card className="h-100">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-1" style={{ fontSize: 14 }}>
              Revenue trend
            </h6>
            <p className="mb-3" style={{ fontSize: 12, color: "#5f6368" }}>
              {trend.period} · {trend.from} → {trend.to}
            </p>
            <TrendChart data={revenueRows} color="#34a853" height={220} />
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

// ── Top products ───────────────────────────────────────────────────────────────
function TopProductsSection({ topProducts }) {
  if (!topProducts) return null;
  const top = topProducts.top_by_quantity || [];
  const least = topProducts.least_sold || [];

  return (
    <Row className="g-3 mb-3">
      <Col lg={6}>
        <Card className="h-100">
          <Card.Body className="p-0">
            <div className="px-3 pt-3 pb-2">
              <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>
                Top selling products
              </h6>
            </div>
            {top.length === 0 ? (
              <div
                className="px-3 pb-3"
                style={{ fontSize: 13, color: "#9aa0a6" }}
              >
                No data.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table column-table mb-0">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Qty</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                      <th>Return %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((p) => (
                      <tr key={p.product_id}>
                        <td className="font-monospace" style={{ fontSize: 12 }}>
                          #{p.product_id}
                        </td>
                        <td>{p.total_quantity}</td>
                        <td>{formatMoney(p.total_revenue)}</td>
                        <td>{p.order_count}</td>
                        <td>
                          {p.return_rate > 0 ? (
                            <Badge bg="warning" text="dark">
                              {p.return_rate}%
                            </Badge>
                          ) : (
                            <span style={{ color: "#9aa0a6" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col lg={6}>
        <Card className="h-100">
          <Card.Body className="p-0">
            <div className="px-3 pt-3 pb-2">
              <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>
                Least selling products
              </h6>
            </div>
            {least.length === 0 ? (
              <div
                className="px-3 pb-3"
                style={{ fontSize: 13, color: "#9aa0a6" }}
              >
                No data.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table column-table mb-0">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Qty</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {least.map((p) => (
                      <tr key={p.product_id}>
                        <td className="font-monospace" style={{ fontSize: 12 }}>
                          #{p.product_id}
                        </td>
                        <td>{p.total_quantity}</td>
                        <td>{formatMoney(p.total_revenue)}</td>
                        <td>{p.order_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

// ── Offers ─────────────────────────────────────────────────────────────────────
function OffersSection({ offers }) {
  if (!offers) return null;
  const summary = offers.summary || {};
  const performance = offers.offers_performance || [];
  const subscribers = offers.code_offers_subscribers || [];

  return (
    <>
      <SubHeading title="Offers" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-tag"
            label="Total Offers"
            value={summary.total_offers ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
            sub={`${summary.active_offers ?? 0} active`}
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-percent"
            label="Automatic"
            value={summary.automatic_offers ?? "—"}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-upc-scan"
            label="Code Offers"
            value={summary.code_offers ?? "—"}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-currency-dollar"
            label="Total Discount Given"
            value={formatMoney(summary.total_discount_given)}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
      </Row>
      {performance.length > 0 && (
        <Card className="mb-3">
          <Card.Body className="p-0">
            <div className="px-3 pt-3 pb-2">
              <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>
                Offers performance
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table column-table mb-0">
                <thead>
                  <tr>
                    <th>Offer ID</th>
                    <th>Type</th>
                    <th>Code</th>
                    <th>Applied</th>
                    <th>Discount</th>
                    <th>Revenue after</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((o) => (
                    <tr key={o.offer_id}>
                      <td className="font-monospace" style={{ fontSize: 12 }}>
                        #{o.offer_id}
                      </td>
                      <td>
                        <Badge
                          bg={
                            o.benefit_type === "percentage"
                              ? "info"
                              : "secondary"
                          }
                        >
                          {o.benefit_type}
                        </Badge>
                      </td>
                      <td>
                        {o.code ? (
                          <span
                            className="font-monospace"
                            style={{ fontSize: 11 }}
                          >
                            {o.code}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{o.times_applied}</td>
                      <td>{formatMoney(o.total_discount_given)}</td>
                      <td>{formatMoney(o.total_revenue_after_discount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
      {subscribers.length > 0 && (
        <Card className="mb-3">
          <Card.Body className="p-3">
            <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
              Code offer subscribers
            </h6>
            <div className="d-flex flex-wrap gap-3">
              {subscribers.map((s) => (
                <div
                  key={s.offer_id}
                  className="text-center px-3 py-2"
                  style={{ border: "1px solid #e8eaed", borderRadius: 8 }}
                >
                  <div
                    className="font-monospace fw-medium"
                    style={{ fontSize: 15 }}
                  >
                    {s.code}
                  </div>
                  <div style={{ fontSize: 12, color: "#5f6368" }}>
                    {s.subscribers_count} subscribers
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

// ── Top customers ──────────────────────────────────────────────────────────────
function CustomersSection({ customers }) {
  if (!customers) return null;
  const summary = customers.summary || {};
  const list = customers.top_customers || [];

  return (
    <>
      <SubHeading title="Customers" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-people"
            label="Unique Customers"
            value={summary.unique_customers ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-person-plus"
            label="New Customers"
            value={summary.new_customers ?? "—"}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-arrow-repeat"
            label="Returning"
            value={summary.returning_customers ?? "—"}
            bg="#f3e8fd"
            color="#ab47bc"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-graph-up"
            label="New Customer Rate"
            value={formatPercent(summary.new_customer_rate)}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
      </Row>
      {list.length > 0 && (
        <Card className="mb-3">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table column-table mb-0">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Avg Order</th>
                    <th>Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.user_id}>
                      <td className="font-monospace" style={{ fontSize: 12 }}>
                        #{c.user_id}
                      </td>
                      <td>{c.total_orders}</td>
                      <td className="fw-medium">
                        {formatMoney(c.total_spent)}
                      </td>
                      <td>{formatMoney(c.avg_order_value)}</td>
                      <td style={{ fontSize: 12, color: "#5f6368" }}>
                        {c.last_order_at
                          ? new Date(c.last_order_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

// ── Returns ────────────────────────────────────────────────────────────────────
function ReturnsSection({ returns }) {
  if (!returns) return null;
  const summary = returns.summary || {};
  const most = returns.most_returned_products || [];
  const trendRows = (returns.trend || []).map((r) => ({
    label: r.label,
    count: r.count,
  }));

  return (
    <>
      <SubHeading title="Returns" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-arrow-return-left"
            label="Total Returns"
            value={summary.total ?? "—"}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-check-circle"
            label="Approved"
            value={summary.approved ?? "—"}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-percent"
            label="Approval Rate"
            value={formatPercent(summary.approval_rate)}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-graph-down"
            label="Return vs Orders"
            value={formatPercent(summary.return_vs_orders_rate)}
            bg="#fff3e0"
            color="#ff9800"
          />
        </Col>
      </Row>
      {most.length > 0 && (
        <Row className="g-3 mb-3">
          <Col lg={6}>
            <Card>
              <Card.Body className="p-0">
                <div className="px-3 pt-3 pb-2">
                  <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>
                    Most returned products
                  </h6>
                </div>
                <div className="table-responsive">
                  <table className="table column-table mb-0">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Requests</th>
                        <th>Qty Returned</th>
                        <th>Approved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {most.map((p) => (
                        <tr key={p.product_id}>
                          <td
                            className="font-monospace"
                            style={{ fontSize: 12 }}
                          >
                            #{p.product_id}
                          </td>
                          <td>{p.return_requests}</td>
                          <td>{p.total_returned_qty}</td>
                          <td>{p.approved_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {trendRows.length > 0 && (
            <Col lg={6}>
              <Card className="h-100">
                <Card.Body className="p-4">
                  <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
                    Returns trend
                  </h6>
                  <TrendChart
                    data={trendRows}
                    color="#ea4335"
                    height={180}
                    defaultType="bar"
                  />
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}
    </>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────
export default function EcommerceSection({ data }) {
  if (!data) return <SectionEmpty label="e-commerce" />;

  return (
    <div className="mb-4">
      <SalesSection sales={data.sales} />
      <SalesTrendSection trend={data["sales-trend"]} />
      <TopProductsSection topProducts={data["top-products"]} />
      <OffersSection offers={data.offers} />
      <CustomersSection customers={data["top-customers"]} />
      <ReturnsSection returns={data.returns} />
    </div>
  );
}

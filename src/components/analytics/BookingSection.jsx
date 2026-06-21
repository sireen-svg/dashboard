import { Card, Row, Col, Badge } from "react-bootstrap";
import KpiCard from "./KpiCard";
import { TrendChart } from "./AnalyticsCharts";
import { formatMoney, formatPercent } from "../../lib/analytics";

function SectionEmpty({ label }) {
  return (
    <div className="empty-state py-4">
      <div className="empty-icon">
        <i className="bi bi-calendar-x"></i>
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

// ── Summary KPI ────────────────────────────────────────────────────────────────
function BookingSummarySection({ summary }) {
  if (!summary) return <SectionEmpty label="booking summary" />;
  const b = summary.bookings || {};
  const r = summary.resources || {};
  const byStatus = b.by_status || {};

  return (
    <>
      <SubHeading title="Bookings overview" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-calendar-check"
            label="Total Bookings"
            value={b.total ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-currency-dollar"
            label="Total Revenue"
            value={formatMoney(b.total_revenue)}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-receipt"
            label="Avg Booking Value"
            value={formatMoney(b.avg_booking_value)}
            bg="#f3e8fd"
            color="#ab47bc"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-arrow-return-left"
            label="Total Refunded"
            value={formatMoney(b.total_refunded)}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
      </Row>
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-x-circle"
            label="Cancellation Rate"
            value={formatPercent(b.cancellation_rate)}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-check-circle"
            label="Completion Rate"
            value={formatPercent(b.completion_rate)}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-person-dash"
            label="No-Show Rate"
            value={formatPercent(b.no_show_rate)}
            bg="#fff3e0"
            color="#ff9800"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-calendar3"
            label="Resources"
            value={r.total ?? "—"}
            bg="#e0f7fa"
            color="#00bcd4"
            sub={`${r.active ?? 0} active · ${r.paid_resources ?? 0} paid`}
          />
        </Col>
      </Row>
      {Object.keys(byStatus).length > 0 && (
        <Card className="mb-3">
          <Card.Body className="p-3">
            <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
              Bookings by status
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

// ── Trend ─────────────────────────────────────────────────────────────────────
function BookingTrendSection({ trend }) {
  if (!trend) return null;
  const bookingsRows = (trend.data || []).map((r) => ({
    label: r.label,
    count: r.bookings_count ?? 0,
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
              Bookings trend
            </h6>
            <p className="mb-3" style={{ fontSize: 12, color: "#5f6368" }}>
              {trend.period} · {trend.from} → {trend.to}
            </p>
            <TrendChart data={bookingsRows} color="#1a73e8" height={220} />
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

// ── Resources table ────────────────────────────────────────────────────────────
function ResourcesSection({ resources }) {
  if (!resources) return null;
  const list = resources.resources || [];
  if (list.length === 0) return null;

  return (
    <>
      <SubHeading title="Resources performance" />
      <Card className="mb-3">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <table className="table column-table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Bookings</th>
                  <th>Completed</th>
                  <th>Cancelled</th>
                  <th>Revenue</th>
                  <th>Cancel%</th>
                </tr>
              </thead>
              <tbody>
                {list.map((res) => (
                  <tr key={res.resource_id}>
                    <td className="fw-medium">{res.name}</td>
                    <td>
                      <Badge bg="info">{res.type}</Badge>
                    </td>
                    <td>
                      <Badge
                        bg={res.payment_type === "paid" ? "warning" : "light"}
                        text={res.payment_type === "paid" ? "dark" : "dark"}
                      >
                        {res.payment_type === "paid"
                          ? `Paid · ${res.price}`
                          : "Free"}
                      </Badge>
                    </td>
                    <td>{res.total_bookings}</td>
                    <td>
                      <Badge bg="success">{res.completed}</Badge>
                    </td>
                    <td>
                      <Badge bg="danger">{res.cancelled}</Badge>
                    </td>
                    <td>{formatMoney(res.total_revenue)}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color:
                            res.cancellation_rate > 30 ? "#ea4335" : "#5f6368",
                        }}
                      >
                        {formatPercent(res.cancellation_rate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </>
  );
}

// ── Cancellations ──────────────────────────────────────────────────────────────
function CancellationsSection({ cancellations }) {
  if (!cancellations) return null;
  const s = cancellations.summary || {};
  const noShow = cancellations.no_show || {};
  const byResource = cancellations.by_resource || [];
  const trendRows = (cancellations.trend || []).map((r) => ({
    label: r.label,
    count: r.count,
  }));

  return (
    <>
      <SubHeading title="Cancellations" />
      <Row xs={1} sm={2} lg={4} className="g-3 mb-3">
        <Col>
          <KpiCard
            icon="bi-x-circle"
            label="Total Cancellations"
            value={s.total_cancellations ?? "—"}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-currency-dollar"
            label="Amount Cancelled"
            value={formatMoney(s.total_amount_cancelled)}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-arrow-return-left"
            label="Total Refunded"
            value={formatMoney(s.total_refunded)}
            bg="#fef7e0"
            color="#f9ab00"
            sub={`Rate: ${formatPercent(s.refund_rate)}`}
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-person-dash"
            label="No-Shows"
            value={noShow.total ?? "—"}
            bg="#fff3e0"
            color="#ff9800"
            sub={`Lost: ${formatMoney(noShow.revenue_lost)}`}
          />
        </Col>
      </Row>
      <Row className="g-3 mb-3">
        {byResource.length > 0 && (
          <Col lg={6}>
            <Card>
              <Card.Body className="p-0">
                <div className="px-3 pt-3 pb-2">
                  <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>
                    By resource
                  </h6>
                </div>
                <div className="table-responsive">
                  <table className="table column-table mb-0">
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Type</th>
                        <th>Cancellations</th>
                        <th>Refunded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byResource.map((r) => (
                        <tr key={r.resource_id}>
                          <td className="fw-medium">{r.resource_name}</td>
                          <td>
                            <Badge bg="secondary">{r.resource_type}</Badge>
                          </td>
                          <td>{r.cancellations}</td>
                          <td>{formatMoney(r.total_refunded)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
        {trendRows.length > 0 && (
          <Col lg={6}>
            <Card className="h-100">
              <Card.Body className="p-4">
                <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
                  Cancellations trend
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
    </>
  );
}

// ── Peak times ─────────────────────────────────────────────────────────────────
function PeakTimesSection({ peakTimes }) {
  if (!peakTimes) return null;
  const byDay = (peakTimes.by_day_of_week || []).map((d) => ({
    label: d.day_name,
    count: d.bookings_count,
  }));
  const byHour = (peakTimes.by_hour || []).map((h) => ({
    label: h.hour_label,
    count: h.bookings_count,
  }));

  return (
    <>
      <SubHeading title="Peak times" />
      <Row className="g-3 mb-3">
        <Col lg={6}>
          <Card>
            <Card.Body className="p-4">
              <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
                By day of week
              </h6>
              <TrendChart
                data={byDay}
                color="#1a73e8"
                height={200}
                defaultType="bar"
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card>
            <Card.Body className="p-4">
              <h6 className="fw-medium mb-3" style={{ fontSize: 14 }}>
                By hour of day
              </h6>
              <TrendChart
                data={byHour}
                color="#ab47bc"
                height={200}
                defaultType="bar"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────
export default function BookingSection({ data }) {
  if (!data) return <SectionEmpty label="booking" />;

  return (
    <div className="mb-4">
      <BookingSummarySection summary={data.summary} />
      <BookingTrendSection trend={data.trend} />
      <ResourcesSection resources={data.resources} />
      <CancellationsSection cancellations={data.cancellations} />
      <PeakTimesSection peakTimes={data["peak-times"]} />
    </div>
  );
}

import { Card, Row, Col, Badge, ProgressBar } from "react-bootstrap";
import KpiCard from "./KpiCard";
import {
  TrendChart,
  DonutDistribution,
  HorizontalBarDistribution,
} from "./AnalyticsCharts";
import EcommerceSection from "./EcommerceSection";
import BookingSection from "./BookingSection";
import {
  ENTRY_STATUS_VARIANTS,
  formatPercent,
  formatRating,
  getRatingDistributionRows,
  normalizeTrendRows,
  pickSection,
} from "../../lib/analytics";

function SectionEmpty({ label }) {
  return (
    <div className="empty-state py-4">
      <div className="empty-icon">
        <i className="bi bi-bar-chart"></i>
      </div>
      <div className="empty-title">No data</div>
      <div className="empty-desc">
        No {label} data is available for the selected range.
      </div>
    </div>
  );
}

function publishRatePercent(value) {
  const n = Number(value) || 0;
  const pct = n <= 1 ? n * 100 : n;
  return Math.min(100, Math.max(0, pct));
}

// ── Content Summary ────────────────────────────────────────────────────────────
function ContentSummarySection({ summary }) {
  if (!summary) return <SectionEmpty label="content summary" />;
  const dataTypes = summary.data_types || [];
  const collections = summary.collections || {};

  return (
    <div className="mb-4">
      <div className="section-label">Collections</div>
      <Row xs={1} sm={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard
            icon="bi-collection"
            label="Total"
            value={collections.total ?? "—"}
            bg="#f3e8fd"
            color="#ab47bc"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-hand-index"
            label="Manual"
            value={collections.manual ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-lightning"
            label="Dynamic"
            value={collections.dynamic ?? "—"}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-tag"
            label="Offer Collections"
            value={collections.offer_collections ?? "—"}
            bg="#fce8e6"
            color="#ea4335"
            sub={`${collections.active ?? 0} active`}
          />
        </Col>
      </Row>

      <div className="section-label">Data types</div>
      {dataTypes.length === 0 ? (
        <SectionEmpty label="data type" />
      ) : (
        <Card>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table column-table mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Total</th>
                    <th>Published</th>
                    <th>Drafts</th>
                    <th>Scheduled</th>
                    <th>Archived</th>
                    <th style={{ width: 160 }}>Publish rate</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTypes.map((dt) => (
                    <tr key={dt.data_type_id ?? dt.id ?? dt.name}>
                      <td className="fw-medium">{dt.name}</td>
                      <td>{dt.total_entries ?? 0}</td>
                      <td>{dt.published ?? 0}</td>
                      <td>{dt.drafts ?? 0}</td>
                      <td>{dt.scheduled ?? 0}</td>
                      <td>{dt.archived ?? 0}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={publishRatePercent(dt.publish_rate)}
                            style={{ flex: 1, height: 6 }}
                            variant="success"
                          />
                          <span
                            style={{
                              fontSize: 12,
                              color: "#5f6368",
                              minWidth: 42,
                            }}
                          >
                            {formatPercent(dt.publish_rate)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>
                          <i
                            className="bi bi-star-fill"
                            style={{ color: "#f9ab00", fontSize: 11 }}
                          ></i>{" "}
                          {formatRating(dt.avg_rating ?? dt.average_rating)}
                          <span style={{ color: "#9aa0a6" }}>
                            {" "}
                            ({dt.total_ratings ?? 0})
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

// ── Content Growth ─────────────────────────────────────────────────────────────
function ContentGrowthSection({ growth }) {
  if (!growth) return <SectionEmpty label="content growth" />;
  const rows = normalizeTrendRows(growth.data);

  return (
    <Card className="mb-4">
      <Card.Body className="p-4">
        <div className="mb-3">
          <h6 className="fw-medium mb-1" style={{ fontSize: 15 }}>
            Content growth
          </h6>
          <p className="mb-0" style={{ fontSize: 12, color: "#5f6368" }}>
            {growth.period || "—"} · {growth.from || "—"} → {growth.to || "—"}
          </p>
        </div>
        <TrendChart data={rows} color="#34a853" />
      </Card.Body>
    </Card>
  );
}

// ── Top Rated ──────────────────────────────────────────────────────────────────
function TopRatedSection({ rows }) {
  // The response wraps top-rated in { entries: [...] }
  const list = Array.isArray(rows) ? rows : (rows?.entries ?? []);
  if (list.length === 0) return <SectionEmpty label="top rated" />;
  return (
    <Card className="mb-4">
      <Card.Body className="p-0">
        <div className="table-responsive">
          <table className="table column-table mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Slug</th>
                <th>Data type</th>
                <th>Status</th>
                <th>Ratings</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="font-monospace" style={{ fontSize: 12 }}>
                    #{r.id}
                  </td>
                  <td className="fw-medium">{r.slug}</td>
                  <td style={{ fontSize: 13, color: "#5f6368" }}>
                    {r.data_type?.name ?? r.data_type ?? "—"}
                  </td>
                  <td>
                    <Badge bg={ENTRY_STATUS_VARIANTS[r.status] || "secondary"}>
                      {r.status}
                    </Badge>
                  </td>
                  <td>{r.ratings_count ?? 0}</td>
                  <td>
                    <Badge bg="warning" text="dark">
                      <i className="bi bi-star-fill me-1"></i>
                      {formatRating(r.ratings_avg ?? r.average_rating)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
}

// ── Ratings Report ─────────────────────────────────────────────────────────────
function RatingsReportSection({ report }) {
  if (!report) return <SectionEmpty label="ratings report" />;
  const content = report.content_ratings || {};
  const project = report.project_ratings || {};
  const distRows = getRatingDistributionRows(content.distribution);
  const trendRows = normalizeTrendRows(content.trend);
  const period = report.period || {};

  return (
    <div className="mb-4">
      <Row xs={1} sm={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard
            icon="bi-star-fill"
            label="Content Ratings"
            value={content.total ?? "—"}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-star-half"
            label="Avg Rating"
            value={formatRating(content.avg_rating ?? content.average_rating)}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-chat-left-text"
            label="With Review"
            value={content.with_review ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-flag"
            label="Project Avg Rating"
            value={formatRating(project.avg_rating ?? project.average_rating)}
            bg="#e6f4ea"
            color="#34a853"
            sub={`${project.total ?? 0} ratings`}
          />
        </Col>
      </Row>

      {period.from && (
        <p style={{ fontSize: 12, color: "#5f6368" }} className="mb-3">
          Period: {period.from} → {period.to}
        </p>
      )}

      <Row className="g-3 mb-4">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Body className="p-4">
              <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
                Rating distribution
              </h6>
              <DonutDistribution rows={distRows} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Body className="p-4">
              <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
                By stars
              </h6>
              <HorizontalBarDistribution rows={distRows} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {trendRows.length > 0 && (
        <Card>
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
              Ratings trend
            </h6>
            <TrendChart data={trendRows} color="#f9ab00" />
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────
export default function ProjectOwnerAnalyticsView({ data, visibleSections }) {
  const show = (key) =>
    visibleSections.length === 0 || visibleSections.includes(key);

  return (
    <>
      {show("content-summary") && (
        <ContentSummarySection summary={pickSection(data, "content-summary")} />
      )}
      {show("content-growth") && (
        <ContentGrowthSection growth={pickSection(data, "content-growth")} />
      )}
      {show("top-rated") && (
        <TopRatedSection rows={pickSection(data, "top-rated")} />
      )}
      {show("ratings-report") && (
        <RatingsReportSection report={pickSection(data, "ratings-report")} />
      )}
      {show("ecommerce") && data?.ecommerce&& (
        <div className="mb-4">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>
              <i className="bi bi-cart3 me-2" style={{ color: "#1a73e8" }}></i>
              E-commerce Analytics
            </h2>
          </div>
          <EcommerceSection data={data.ecommerce} />
        </div>
      )}
      {show("booking") && data?.booking && (
        <div className="mb-4">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>
              <i
                className="bi bi-calendar-check me-2"
                style={{ color: "#f9ab00" }}
              ></i>
              Booking Analytics
            </h2>
          </div>
          <BookingSection data={data.booking} />
        </div>
      )}
    </>
  );
}

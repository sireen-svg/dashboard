import { Card, Row, Col } from "react-bootstrap";
import KpiCard from "./KpiCard";
import { TrendChart } from "./AnalyticsCharts";
import {
  formatPercent,
  formatRating,
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

function PlatformOverviewSection({ overview }) {
  if (!overview) return <SectionEmpty label="platform overview" />;
  console.log(overview);
  const projects = overview.projects || {};
  const modules = overview.modules_usage || {};
  const content = overview.content || {};
  const ratings = overview.ratings || {};

  const statusBreakdown = [
    { label: "Published", value: content.published_entries, color: "#34a853" },
    { label: "Draft", value: content.draft_entries, color: "#5f6368" },
    { label: "Scheduled", value: content.scheduled_entries, color: "#1a73e8" },
    { label: "Archived", value: content.archived_entries, color: "#f9ab00" },
  ];

  return (
    <div className="mb-4">
      <div className="section-label">Projects &amp; modules</div>
      <Row xs={1} sm={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard
            icon="bi-folder2"
            label="Total Projects"
            value={projects.total ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-folder-plus"
            label="New Projects"
            value={projects.new ?? "—"}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-cart3"
            label="Ecommerce Enabled"
            value={modules.ecommerce_enabled ?? "—"}
            bg="#fce8e6"
            color="#ea4335"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-calendar-check"
            label="Booking Enabled"
            value={modules.booking_enabled ?? "—"}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
      </Row>

      <div className="section-label">Content statistics</div>
      <Row xs={1} sm={2} lg={4} className="g-3 mb-4">
        <Col>
          <KpiCard
            icon="bi-table"
            label="Data Types"
            value={content.total_data_types ?? "—"}
            bg="#e8f0fe"
            color="#1a73e8"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-collection"
            label="Collections"
            value={content.total_collections ?? "—"}
            bg="#f3e8fd"
            color="#ab47bc"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-file-earmark-text"
            label="Total Entries"
            value={content.total_entries ?? "—"}
            bg="#e0f7fa"
            color="#00bcd4"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-graph-up-arrow"
            label="Publish Rate"
            value={formatPercent(content.publish_rate)}
            bg="#e6f4ea"
            color="#34a853"
          />
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body className="p-4">
          <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
            Entries by status
          </h6>
          <Row className="g-3">
            {statusBreakdown.map((s) => (
              <Col key={s.label} xs={6} md={3}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className="analytics-dot"
                    style={{ background: s.color }}
                  ></span>
                  <span style={{ fontSize: 13, color: "#5f6368" }}>
                    {s.label}
                  </span>
                </div>
                <div className="fw-medium" style={{ fontSize: 20 }}>
                  {s.value ?? "—"}
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      <div className="section-label">Ratings</div>
      <Row xs={1} sm={2} lg={4} className="g-3">
        <Col>
          <KpiCard
            icon="bi-star-fill"
            label="Total Ratings"
            value={ratings.total ?? "—"}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
        <Col>
          <KpiCard
            icon="bi-star-half"
            label="Average Rating"
            value={formatRating(ratings.avg_rating)}
            bg="#fef7e0"
            color="#f9ab00"
          />
        </Col>
      </Row>
    </div>
  );
}

function ProjectsGrowthSection({ growth }) {
  if (!growth) return <SectionEmpty label="projects growth" />;
  const rows = normalizeTrendRows(growth.data);

  return (
    <Card className="mb-4">
      <Card.Body className="p-4">
        <div className="mb-3">
          <h6 className="fw-medium mb-1" style={{ fontSize: 15 }}>
            Projects growth
          </h6>
          <p className="mb-0" style={{ fontSize: 12, color: "#5f6368" }}>
            {growth.period || "—"} · {growth.from || "—"} → {growth.to || "—"}
          </p>
        </div>
        <TrendChart data={rows} color="#1a73e8" />
      </Card.Body>
    </Card>
  );
}

export default function AdminAnalyticsView({ data, visibleSections }) {
  const show = (key) =>
    visibleSections.length === 0 || visibleSections.includes(key);

  return (
    <>
      {show("platform-overview") && (
        <PlatformOverviewSection
          overview={pickSection(data, "platform-overview")}
        />
      )}
      {show("projects-growth") && (
        <ProjectsGrowthSection growth={pickSection(data, "projects-growth")} />
      )}
    </>
  );
}

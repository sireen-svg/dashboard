import { useState, useEffect, useCallback } from "react";
import { Button } from "react-bootstrap";
import { getAdminAnalytics, getProjectOwnerAnalytics } from "../api/cms";
import { getApiError } from "../lib/utils";
import {
  ADMIN_SECTIONS,
  OWNER_SECTIONS,
  getUserRole,
  isAdminRole,
  unwrapAnalytics,
} from "../lib/analytics";
import AnalyticsFilters from "../components/analytics/AnalyticsFilters";
import AdminAnalyticsView from "../components/analytics/AdminAnalyticsView";
import ProjectOwnerAnalyticsView from "../components/analytics/ProjectOwnerAnalyticsView";

function defaultFilters() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to), period: "daily", sections: [] };
}

// Skeleton loader reusing .stat-card shell + the shimmer animation from index.css
function AnalyticsSkeleton() {
  return (
    <div className="row g-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="col-sm-6 col-lg-3">
          <div className="card stat-card h-100">
            <div className="card-body py-3 px-4">
              <div
                className="analytics-skeleton-line"
                style={{ width: "50%", height: 12 }}
              ></div>
              <div
                className="analytics-skeleton-line mt-3"
                style={{ width: "35%", height: 24 }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Derives which sections are actually available based on the data returned.
// For project owner, ecommerce and booking are excluded when null.
function resolveAvailableSections(isAdmin, data) {
  if (isAdmin) return ADMIN_SECTIONS;
  return OWNER_SECTIONS.filter((s) => {
    if (s.key === "ecommerce") return data?.ecommerce != null;
    if (s.key === "booking") return data?.booking != null;
    return true;
  });
}

export default function AnalyticsDashboard() {
  const role = getUserRole();
  const isAdmin = isAdminRole(role);

  const [filters, setFilters] = useState(defaultFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        from: filters.from || undefined,
        to: filters.to || undefined,
        period: filters.period || undefined,
      };
      const res = isAdmin
        ? await getAdminAnalytics(params)
        : await getProjectOwnerAnalytics(params);
      setData(unwrapAnalytics(res));
    } catch (err) {
      setError(getApiError(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterChange(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  // Available sections depend on what the API actually returned (null = module disabled)
  const availableSections = resolveAvailableSections(isAdmin, data);

  // Only show section filter badges whose data exists in the response
const filterSections = resolveAvailableSections(isAdmin, data);

  const hasAnyData = data && Object.keys(data).length > 0;

  return (
    <div className="page-container">
      <div className="page-header d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <h2>Analytics</h2>
          <p className="page-subtitle">
            {isAdmin
              ? "Platform-wide analytics across all projects"
              : "Analytics for your project"}
          </p>
        </div>
      </div>

      <AnalyticsFilters
        filters={filters}
        onChange={handleFilterChange}
        availableSections={filterSections}
        disabled={loading}
      />

      {loading ? (
        <AnalyticsSkeleton />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-exclamation-circle"></i>
          </div>
          <div className="empty-title">Couldn't load analytics</div>
          <div className="empty-desc">{error}</div>
          <Button variant="primary" size="sm" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1"></i>Retry
          </Button>
        </div>
      ) : !hasAnyData ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-bar-chart"></i>
          </div>
          <div className="empty-title">No analytics yet</div>
          <div className="empty-desc">
            There's no analytics data for the selected range.
          </div>
        </div>
      ) : isAdmin ? (
        <AdminAnalyticsView data={data} visibleSections={filters.sections} />
      ) : (
        <ProjectOwnerAnalyticsView
          data={data}
          visibleSections={filters.sections}
        />
      )}
    </div>
  );
}

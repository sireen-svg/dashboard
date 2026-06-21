import { getCookie } from "./utils";

// Shared analytics constants and helpers. Kept in its own module — same separation
// pattern as lib/commerce.js (ecommerce helpers) — so lib/utils.js stays generic.

export const ROLE_COOKIE_NAME = "role";
export const ADMIN_ROLE_VALUE = "admin";

export const ADMIN_SECTIONS = [
  { key: "platform-overview", label: "Platform Overview" },
  { key: "projects-growth", label: "Projects Growth" },
];

export const OWNER_SECTIONS = [
  { key: "content-summary", label: "Content Summary" },
  { key: "content-growth", label: "Content Growth" },
  { key: "top-rated", label: "Top Rated" },
  { key: "ratings-report", label: "Ratings Report" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "booking", label: "Booking" },
];

export const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Mirrors STATUS_VARIANTS used in EntryList.jsx so badges look identical across the app.
export const ENTRY_STATUS_VARIANTS = {
  draft: "secondary",
  published: "success",
  scheduled: "primary",
  archived: "warning",
};

export function getUserRole() {
  return getCookie(ROLE_COOKIE_NAME);
}

export function isAdminRole(roleValue) {
  return (roleValue || "").toLowerCase() === ADMIN_ROLE_VALUE;
}

// Unwraps the common `{ data: {...} }` response envelope used across this
// codebase's APIs (same idea as extractList() in lib/commerce.js, but for a
// keyed object of sections instead of a list).
export function unwrapAnalytics(res) {
  const body = res?.data ?? res;
  return body?.data ?? body ?? {};
}

export function pickSection(payload, key) {
  if (!payload || typeof payload !== "object") return null;
  return payload[key] ?? null;
}

export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  // The backend may send either a 0–1 ratio or an already-computed 0–100 value.
  const pct = n <= 1 ? n * 100 : n;
  return `${pct.toFixed(1)}%`;
}

export function formatRating(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(1);
}

export function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Normalizes a `{ "1": n, "2": n, ... }` or `{ 1: n, ... }` distribution object
// into an ordered array (5 stars first) for the chart components.
export function getRatingDistributionRows(distribution) {
  const dist = distribution || {};
  return [5, 4, 3, 2, 1].map((star) => {
    // جلب البيانات الخاصة بكل نجمة (ستكون عبارة عن object يحتوي على count و percentage)
    const starData = dist[star] ?? dist[String(star)] ?? {};

    return {
      star,
      // قراءة الـ count تحديداً من الكائن
      count: Number(starData.count ?? 0),
    };
  });
}

// Normalizes a growth/trend series (projects-growth, content-growth, ratings trend)
// into `{ label, count }` rows regardless of which key name the backend used.
export function normalizeTrendRows(series) {
  return (series || []).map((row) => ({
    label: row.period_label || row.label || row.date || row.period || "",
    count: Number(row.count ?? row.total ?? row.average ?? 0),
  }));
}

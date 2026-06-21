export function generateId() {
  return crypto.randomUUID();
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Maps frontend field types to CMS backend field types
const FRONTEND_TO_BACKEND = {
  string: "text",
  text: "rich-text",
  number: "number",
  boolean: "boolean",
  date: "date",
  datetime: "date",
  email: "text",
  url: "text",
  media: "file",
  json: "text",
  enum: "text",
};

// Maps CMS backend field types to frontend field types
const BACKEND_TO_FRONTEND = {
  text: "string",
  "rich-text": "text",
  number: "number",
  boolean: "boolean",
  date: "date",
  file: "media",
  relation: "string",
};

export function toBackendFieldType(frontendType) {
  return FRONTEND_TO_BACKEND[frontendType] || "text";
}

export function toFrontendFieldType(backendType) {
  return BACKEND_TO_FRONTEND[backendType] || "string";
}

export function getApiError(err) {
  return err.response?.data?.message || err.message || "Something went wrong";
}

// Reads a single cookie by name. Used by the analytics dashboard to read the
// `role` cookie that decides which analytics endpoint (admin vs project owner)
// to call. Returns null when the cookie isn't set or document isn't available.
export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

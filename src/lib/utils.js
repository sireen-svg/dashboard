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
  // HyperCore stores both single-line and multiline content as `text`.
  // `rich-text` is an editor concern and is not a supported backend strategy.
  text: "text",
  number: "number",
  boolean: "boolean",
  // The CMS has no date type — FieldTypeFactory supports only text/number/boolean/
  // select/json/relation/file. Dates ride on `text` as ISO strings.
  date: "text",
  datetime: "text",
  email: "text",
  url: "text",
  media: "file",
  json: "text",
  enum: "text",
  // Icons ride on the backend `select` type: the value is one lucide icon name
  // chosen from settings.options. `text` cannot carry the marker, because
  // TextFieldStrategy::normalizeSettings keeps only placeholder/default.
  icon: "select",
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

export const LONG_TEXT_VALIDATION_RULE = "max:65535";

// Both a real constraint and the marker that restores the date editor, mirroring the
// way LONG_TEXT_VALIDATION_RULE marks multiline. Safe as a marker because rules are
// only checked by name when the field is created — they are never applied to entry
// values — and settings.* cannot be used here, since TextFieldStrategy keeps only
// placeholder/default.
export const DATE_VALIDATION_RULE = "regex:/^\\d{4}-\\d{2}-\\d{2}$/";

export function isDateField(field) {
  return field?.validation_rules?.includes(DATE_VALIDATION_RULE) ?? false;
}

// The rules a newly created field starts with, keyed by the editor type the user picked.
export function defaultValidationRules(frontendType) {
  if (frontendType === "text") return [LONG_TEXT_VALIDATION_RULE];
  if (frontendType === "date" || frontendType === "datetime") return [DATE_VALIDATION_RULE];

  return [];
}

export function isMultilineTextField(field) {
  if (!field) return false;

  return field.type === "rich-text"
    || field.settings?.editor === "rich-text"
    || field.settings?.multiline === true
    || field.validation_rules?.includes(LONG_TEXT_VALIDATION_RULE);
}

// SelectFieldStrategy preserves only options/default/multiple, so there is nowhere
// to put an explicit marker — an icon field is recognised by its option list instead.
// A hand-authored select never has hundreds of options, let alone lucide's names.
const ICON_OPTION_SENTINEL = "stethoscope";
const ICON_OPTION_MIN = 500;

export function isIconField(field) {
  const options = field?.settings?.options;

  return (
    Array.isArray(options) &&
    options.length >= ICON_OPTION_MIN &&
    options.includes(ICON_OPTION_SENTINEL)
  );
}

export function toFrontendFieldType(backendType, field) {
  if (backendType === "select" && isIconField(field)) return "icon";
  if (backendType === "text" && isDateField(field)) return "date";
  if (backendType === "text" && isMultilineTextField(field)) return "text";
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

// Booking `start_at` / `end_at` are clinic wall-clock times that the API mislabels as
// UTC: the row holds "2026-08-24 14:00:00" and the Eloquent datetime cast serializes it
// as "2026-08-24T14:00:00.000000Z". Trusting that Z re-anchors the value to a real
// instant, so the admin renders it shifted by its own offset (14:00 -> 5:00 PM at +03).
// Read the clock digits instead. Not for created_at/updated_at, which really are UTC —
// use timeAgo for those.
export function formatClinicDateTime(value) {
  if (!value) return "-";

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (!match) return "-";

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute), Number(second || 0)
  );

  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

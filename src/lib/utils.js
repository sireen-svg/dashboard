export function generateId() {
  return crypto.randomUUID();
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Maps frontend field types to CMS backend field types
const FRONTEND_TO_BACKEND = {
  string: 'text',
  text: 'rich-text',
  number: 'number',
  boolean: 'boolean',
  date: 'date',
  datetime: 'date',
  email: 'text',
  url: 'text',
  media: 'file',
  json: 'text',
  enum: 'text',
};

// Maps CMS backend field types to frontend field types
const BACKEND_TO_FRONTEND = {
  text: 'string',
  'rich-text': 'text',
  number: 'number',
  boolean: 'boolean',
  date: 'date',
  file: 'media',
  relation: 'string',
};

export function toBackendFieldType(frontendType) {
  return FRONTEND_TO_BACKEND[frontendType] || 'text';
}

export function toFrontendFieldType(backendType) {
  return BACKEND_TO_FRONTEND[backendType] || 'string';
}

export function getApiError(err) {
  return err.response?.data?.message || err.message || 'Something went wrong';
}

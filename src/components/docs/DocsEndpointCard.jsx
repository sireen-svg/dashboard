import { useState } from 'react';

const METHOD_COLORS = {
  GET: 'var(--fb-blue)',
  POST: 'var(--fb-green)',
  PUT: 'var(--fb-yellow)',
  PATCH: 'var(--fb-yellow)',
  DELETE: 'var(--fb-red)',
};

const AUTH_TONE_CLASS = {
  public: 'docs-endpoint-auth--public',
  protected: 'docs-endpoint-auth--protected',
  service: 'docs-endpoint-auth--service',
};

// Collapsible API-endpoint card (method badge + path + auth tag + expandable
// body).
export default function DocsEndpointCard({ method, path, authTag, authTone = 'protected', description, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card docs-endpoint-card">
      <button type="button" className="docs-endpoint-header" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="docs-endpoint-method" style={{ background: METHOD_COLORS[method] || 'var(--fb-blue)' }}>
          {method}
        </span>
        <span className="docs-endpoint-path">{path}</span>
        {authTag && <span className={`docs-endpoint-auth ${AUTH_TONE_CLASS[authTone] || ''}`}>{authTag}</span>}
        {description && <span className="docs-endpoint-desc">{description}</span>}
        <i className={`bi bi-chevron-right docs-endpoint-chevron${open ? ' docs-endpoint-chevron--open' : ''}`}></i>
      </button>
      {open && <div className="docs-endpoint-body">{children}</div>}
    </div>
  );
}
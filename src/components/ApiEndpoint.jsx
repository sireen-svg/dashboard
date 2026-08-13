import { useState } from 'react';
import { Badge } from 'react-bootstrap';
import CodeBlock from './CodeBlock';
import { SERVICES, toCurl } from '../lib/apiDocs';

const METHOD_COLORS = {
  GET: '#1a73e8',
  POST: '#137333',
  PATCH: '#e37400',
  PUT: '#e37400',
  DELETE: '#d93025',
};

export default function ApiEndpoint({ endpoint, projectKey }) {
  const [open, setOpen] = useState(false);
  const service = SERVICES[endpoint.service];
  const color = METHOD_COLORS[endpoint.method] || '#5f6368';

  return (
    <div className="api-endpoint">
      <button
        type="button"
        className="api-endpoint__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="api-endpoint__method" style={{ background: color }}>
          {endpoint.method}
        </span>
        <code className="api-endpoint__path">{endpoint.path}</code>
        <span className="api-endpoint__summary">{endpoint.summary}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} api-endpoint__chev`}></i>
      </button>

      {open && (
        <div className="api-endpoint__body">
          <div className="mb-2" style={{ fontSize: 12, color: '#5f6368' }}>
            <Badge bg="light" text="dark">{service.label}</Badge>{' '}
            <code>{service.baseUrl}</code>
          </div>

          {endpoint.params && (
            <>
              <div className="api-endpoint__label">Query parameters</div>
              <div className="table-responsive mb-3">
                <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                  <tbody>
                    {endpoint.params.map(([name, desc]) => (
                      <tr key={name}>
                        <td style={{ width: 170 }}><code>{name}</code></td>
                        <td style={{ color: '#5f6368' }}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <CodeBlock label="Request" code={toCurl(endpoint, projectKey)} />

          {endpoint.body && (
            <CodeBlock
              label="Request body"
              variant="light"
              code={JSON.stringify(endpoint.body, null, 2)}
            />
          )}

          <CodeBlock
            label="Response 200"
            variant="light"
            code={JSON.stringify(endpoint.response, null, 2)}
          />

          {endpoint.notes?.filter(Boolean).length > 0 && (
            <ul className="api-endpoint__notes">
              {endpoint.notes.filter(Boolean).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

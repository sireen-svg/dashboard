import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Form, Alert } from 'react-bootstrap';
import ApiEndpoint from '../components/ApiEndpoint';
import CodeBlock from '../components/CodeBlock';
import { buildDocs, SERVICES, TOKEN_PLACEHOLDER } from '../lib/apiDocs';

export default function ApiDocs() {
  const { project, dataTypes, dataTypesLoading } = useOutletContext();
  const [selectedId, setSelectedId] = useState('');

  const dataType = useMemo(() => {
    if (!dataTypes?.length) return null;
    const found = dataTypes.find((d) => String(d.id) === String(selectedId));
    return found || dataTypes[0];
  }, [dataTypes, selectedId]);

  const sections = useMemo(
    () => buildDocs({ project, dataType }),
    [project, dataType],
  );

  const projectKey = project?.public_id || '{project-public-id}';

  function jump(id) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      <div className="page-header">
        <h2>API docs</h2>
        <p className="page-subtitle">
          Ready-to-run examples for <strong>{project.name}</strong>, using this project&apos;s real
          keys and schema.
        </p>
      </div>

      <div className="api-docs">
        {/* ---- section nav ---- */}
        <nav className="api-docs__nav">
          {sections.map((s) => (
            <button key={s.id} type="button" onClick={() => jump(s.id)} className="api-docs__navitem">
              <i className={`bi ${s.icon}`}></i>
              <span>{s.title}</span>
            </button>
          ))}

          <div className="api-docs__picker">
            <Form.Label style={{ fontSize: 12, color: '#5f6368' }}>Examples for</Form.Label>
            <Form.Select
              size="sm"
              value={dataType?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!dataTypes?.length}
            >
              {dataTypesLoading && <option>Loading…</option>}
              {!dataTypesLoading && !dataTypes?.length && <option>No data types</option>}
              {dataTypes?.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </Form.Select>
            <div style={{ fontSize: 11, color: '#5f6368', marginTop: 6 }}>
              Entry and product examples are rebuilt from this type&apos;s fields.
            </div>
          </div>
        </nav>

        {/* ---- content ---- */}
        <div className="api-docs__content">
          {!dataTypesLoading && !dataTypes?.length && (
            <Alert variant="warning" className="py-2" style={{ fontSize: 13 }}>
              This project has no data types yet, so entry examples use a placeholder slug.
              Create one in Schema Builder and the examples fill in automatically.
            </Alert>
          )}

          {sections.map((section) => (
            <section key={section.id} id={`sec-${section.id}`} className="api-docs__section">
              <h5 className="api-docs__title">
                <i className={`bi ${section.icon} me-2`}></i>{section.title}
              </h5>
              {section.intro && <p className="api-docs__intro">{section.intro}</p>}

              {section.id === 'getting-started' ? (
                <GettingStarted projectKey={projectKey} />
              ) : (
                section.endpoints.map((ep) => (
                  <ApiEndpoint key={ep.id} endpoint={ep} projectKey={projectKey} />
                ))
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function GettingStarted({ projectKey }) {
  return (
    <>
      <div className="table-responsive mb-3">
        <table className="table table-sm" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Service</th>
              <th>Base URL</th>
              <th>Project header</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(SERVICES).map(([key, s]) => (
              <tr key={key}>
                <td>{s.label}</td>
                <td><code>{s.baseUrl}</code></td>
                <td>
                  {s.projectHeader
                    ? <code>{s.projectHeader}</code>
                    : <span style={{ color: '#5f6368' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Alert variant="info" className="py-2" style={{ fontSize: 13 }}>
        <strong>Watch the header name.</strong> The value is the same for every service — this
        project&apos;s public id — but CMS reads it from <code>X-Project-Key</code> while Booking
        and E-Commerce read <code>X-Project-Id</code>. Sending the wrong one returns
        <code> 400 header is required</code>.
      </Alert>

      <CodeBlock
        label="Headers on every project-scoped request"
        code={[
          `Authorization: Bearer ${TOKEN_PLACEHOLDER}`,
          'Accept: application/json',
          '',
          `# CMS (${SERVICES.cms.baseUrl})`,
          `X-Project-Key: ${projectKey}`,
          '',
          `# Booking (${SERVICES.booking.baseUrl}) and E-Commerce (${SERVICES.ecommerce.baseUrl})`,
          `X-Project-Id: ${projectKey}`,
        ].join('\n')}
      />

      <CodeBlock
        label="Get a token"
        code={[
          'curl -X POST \\',
          '  -H "Content-Type: application/json" \\',
          `  -d '{"email":"you@example.com","password":"secret"}' \\`,
          `  "${SERVICES.auth.baseUrl}/login"`,
          '',
          '# -> { "access_token": "eyJ0eXAiOiJKV1Qi...", "token_type": "bearer" }',
        ].join('\n')}
      />
    </>
  );
}

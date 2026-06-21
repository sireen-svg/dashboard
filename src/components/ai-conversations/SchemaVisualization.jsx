import { useState } from "react";
import { Card, Accordion, Badge } from "react-bootstrap";
import { MODULE_LABELS } from "../../lib/constants";

const RELATION_KIND_LABELS = {
  belongs_to: "M : 1",
  has_many: "1 : M",
  many_to_many: "M : M",
  "one-to-one": "1 : 1",
  "one-to-many": "1 : M",
  "many-to-many": "M : M",
};

// Reuses .review-summary / .review-label / .review-value from NewProjectWizard.jsx.
function ProjectInfoSection({ info }) {
  if (!info || typeof info !== "object") return null;
  const entries = Object.entries(info).filter(
    ([, v]) =>
      v == null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean",
  );
  if (entries.length === 0) return null;
  return (
    <div className="review-summary mb-3">
      <div className="row g-3">
        {entries.map(([key, value]) => (
          <div key={key} className="col-6 col-md-4">
            <div className="review-label">{key.replace(/_/g, " ")}</div>
            <div className="review-value">
              {value == null || value === "" ? "—" : String(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reuses the Badge-toggle visual language (just non-interactive badges here) and
// MODULE_LABELS from lib/constants.js — same labels used across the rest of the app.
function ModulesSection({ modules }) {
  if (!modules) return null;
  const keys = Array.isArray(modules)
    ? modules
    : Object.keys(modules).filter((k) => modules[k]);
  if (keys.length === 0) return null;
  return (
    <div className="mb-3 d-flex flex-wrap gap-2">
      {keys.map((m) => (
        <Badge key={m} bg="primary">
          {MODULE_LABELS[m] || m}
        </Badge>
      ))}
    </div>
  );
}

function LanguagesSection({ languages }) {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="mb-3 d-flex flex-wrap gap-2">
      {languages.map((l) => (
        <Badge key={l} bg="info">
          {l}
        </Badge>
      ))}
    </div>
  );
}

// Reuses .column-table / .field-badge exactly as defined for TableEditor.jsx.
function FieldsTable({ fields }) {
  if (!fields || fields.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#9aa0a6" }}>No fields defined.</div>
    );
  }
  return (
    <div className="table-responsive">
      <table className="table column-table mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th className="text-center" style={{ width: 80 }}>
              Required
            </th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => {
            const rules = f.validation_rules || f.rules || [];
            return (
              <tr key={f.id ?? f.name ?? i}>
                <td className="fw-medium">{f.name}</td>
                <td>
                  <span className={`field-badge ${f.type || "string"}`}>
                    {f.type || "string"}
                  </span>
                </td>
                <td className="text-center">
                  {f.required && (
                    <i
                      className="bi bi-check-circle-fill"
                      style={{ color: "#34a853", fontSize: 14 }}
                    ></i>
                  )}
                </td>
                <td>
                  {rules.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                      {rules.map((r, ri) => (
                        <span
                          key={ri}
                          className="badge bg-light text-dark border"
                          style={{ fontSize: 10 }}
                        >
                          {typeof r === "string"
                            ? r
                            : r.rule || JSON.stringify(r)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DataTypesSection({ dataTypes }) {
  if (!dataTypes || dataTypes.length === 0) return null;
  return (
    <Accordion className="mb-3">
      {dataTypes.map((dt, i) => (
        <Accordion.Item
          eventKey={String(i)}
          key={dt.id ?? dt.slug ?? dt.name ?? i}
        >
          <Accordion.Header>
            <span className="fw-medium">{dt.name}</span>
            {dt.slug && (
              <span
                className="font-monospace ms-2"
                style={{ fontSize: 12, color: "#9aa0a6" }}
              >
                {dt.slug}
              </span>
            )}
            <span className="ms-2" style={{ fontSize: 12, color: "#5f6368" }}>
              · {(dt.fields || []).length} field
              {(dt.fields || []).length !== 1 ? "s" : ""}
            </span>
          </Accordion.Header>
          <Accordion.Body>
            <FieldsTable fields={dt.fields} />
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

// Reuses .rel-card / .rel-arrow / .rel-badge / .rel-table-name exactly as defined
// for RelationshipBuilder.jsx.
function RelationsSection({ relations }) {
  if (!relations || relations.length === 0) return null;
  return (
    <div className="d-flex flex-column gap-2 mb-3">
      {relations.map((rel, i) => (
        <div key={i} className="rel-card d-flex justify-content-between ">
          <div className="rel-arrow">
            <span className="rel-table-name">
              {rel.source_data_type || rel.from || rel.source}
            </span>
            <span className="rel-badge">
              {RELATION_KIND_LABELS[rel.kind || rel.type] ||
                rel.kind ||
                rel.type ||
                "—"}
            </span>
            <span className="rel-table-name">
              {rel.target_data_type || rel.to || rel.target}
            </span>
          </div>
          <div className="rel-fieldName">
            <span className="bi rel-arrow-icon">field-name: </span>
            <span style={{ color: "var(--fb-header-bg)" , fontWeight: "bold"}}>
              {rel.settings.related_data_type_name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NativeModulesNotesSection({ notes }) {
  if (!notes) return null;
  const entries =
    typeof notes === "string" ? [["notes", notes]] : Object.entries(notes);
  if (entries.length === 0) return null;
  return (
    <Card className="mb-1">
      <Card.Body className="p-3">
        <h6 className="fw-medium mb-2" style={{ fontSize: 13 }}>
          Native modules notes
        </h6>
        {entries.map(([key, value]) => (
          <p
            key={key}
            className="mb-1"
            style={{ fontSize: 13, color: "#5f6368" }}
          >
            {key !== "notes" && (
              <strong className="me-1">{MODULE_LABELS[key] || key}:</strong>
            )}
            {String(value)}
          </p>
        ))}
      </Card.Body>
    </Card>
  );
}

// Renders an AI-generated project schema (an assistant message's `schema` field)
// without ever dumping raw JSON — every section reuses a visual pattern that
// already exists elsewhere in the app instead of inventing a new one.
export default function SchemaVisualization({ schema }) {
  const [expanded, setExpanded] = useState(true);
  if (!schema || typeof schema !== "object") return null;

  const projectInfo =
    schema.project_info || schema.project || schema.info;
  const modules = schema.modules;
  const languages = schema.languages || schema.supported_languages;
  const dataTypes =
    schema.data_types || schema.custom_data_types || schema.dataTypes;
  const relations = schema.relations;
  const notes = schema.native_modules_notes || schema.notes;

  return (
    <div className="ai-schema-card">
      <button
        type="button"
        className="ai-schema-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <i className="bi bi-diagram-3"></i>
        <span>Generated project schema</span>
        <i className={`bi bi-chevron-${expanded ? "up" : "down"}`}></i>
      </button>
      {expanded && (
        <div className="ai-schema-body">
          <ProjectInfoSection info={projectInfo} />
          <ModulesSection modules={modules} />
          <LanguagesSection languages={languages} />
          <DataTypesSection dataTypes={dataTypes} />
          <RelationsSection relations={relations} />
          <NativeModulesNotesSection notes={notes} />
        </div>
      )}
    </div>
  );
}

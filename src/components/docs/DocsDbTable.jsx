const BADGE_CLASS = {
  PK: 'docs-db-badge--pk',
  FK: 'docs-db-badge--fk',
  UNIQUE: 'docs-db-badge--uk',
};

// A single database table block: header (table name + description) then a
// row per column (name / type / description / optional PK-FK-UNIQUE badge).
// From the CMS Database Schema page — generic enough to reuse for every
// other module's schema pages and the ERD & Architecture step.
export default function DocsDbTable({ name, description, fields }) {
  return (
    <div className="docs-db-table">
      <div className="docs-db-table-header">
        <span className="docs-db-table-name">{name}</span>
        <span className="docs-db-table-desc">{description}</span>
      </div>
      {fields.map((f) => (
        <div className="docs-db-field" key={f.name}>
          <span className="docs-db-fname">{f.name}</span>
          <span className="docs-db-ftype">{f.type}</span>
          <span className="docs-db-fdesc">{f.desc}</span>
          {f.badge && <span className={`docs-db-badge ${BADGE_CLASS[f.badge] || ''}`}>{f.badge}</span>}
        </div>
      ))}
    </div>
  );
}
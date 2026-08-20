// Row-list of key → value (+ optional note), used for "Required Headers"
// and single-header examples inside an endpoint card.
export default function DocsHeaderBox({ rows }) {
  return (
    <div className="docs-header-box">
      {rows.map((row) => (
        <div className="docs-header-box-row" key={row.key}>
          <div className="docs-hb-key">{row.key}</div>
          <div className="docs-hb-val">{row.value}</div>
          {row.note && <div className="docs-hb-note">{row.note}</div>}
        </div>
      ))}
    </div>
  );
}
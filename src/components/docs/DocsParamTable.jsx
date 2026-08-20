// Request/response field table — used inside endpoint cards to list body
// fields, their type, and notes (required / validation rule / description).
export default function DocsParamTable({ rows }) {
  return (
    <table className="docs-param-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.field}>
            <td>
              {row.field}
              {row.required && <span className="docs-badge-req">required</span>}
            </td>
            <td className="docs-param-type">{row.type}</td>
            <td className="docs-param-notes">{row.notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
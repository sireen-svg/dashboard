// Generic simple data table — headers + rows of arbitrary React nodes per
// cell. Reused wherever a plain reference table is needed (Relation Field
// properties here; later for Security & NFR tables, etc.)
export default function DocsTable({ headers, rows }) {
  return (
    <table className="docs-simple-table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
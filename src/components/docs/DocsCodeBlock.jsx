import { useState } from 'react';

function highlightSnippet(code) {
  const pattern = /("(?:\\.|[^"\\])*"|\/\/[^\n]*|\b(?:true|false|null)\b|\b\d+\.?\d*\b)/g;
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  while ((m = pattern.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const tok = m[0];
    const isKey = /^\s*:/.test(code.slice(pattern.lastIndex));
    if (tok.startsWith('//')) out.push(<span key={key++} className="docs-tok-com">{tok}</span>);
    else if (tok === 'true' || tok === 'false') out.push(<span key={key++} className="docs-tok-bool">{tok}</span>);
    else if (tok === 'null') out.push(<span key={key++} className="docs-tok-null">{tok}</span>);
    else if (tok.startsWith('"')) out.push(<span key={key++} className={isKey ? 'docs-tok-key' : 'docs-tok-str'}>{tok}</span>);
    else out.push(<span key={key++} className="docs-tok-num">{tok}</span>);
    last = pattern.lastIndex;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export default function DocsCodeBlock({ language = 'text', label, code, dotColor }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable — fail silently.
    }
  }

  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-lang">
          <span className="docs-code-dot" style={dotColor ? { background: dotColor } : undefined}></span>
          {label || language}
        </span>
        <button type="button" className="docs-code-copy" onClick={handleCopy}>
          <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`}></i>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="docs-code-body">
        <code>{language === 'json' ? highlightSnippet(code) : code}</code>
      </pre>
    </div>
  );
}
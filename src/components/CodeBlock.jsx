import { useState } from 'react';

/**
 * Scrollable code block with a copy button.
 *
 * Wide content scrolls inside the block rather than pushing the page sideways,
 * which matters for curl commands and JSON bodies.
 */
export default function CodeBlock({ code, label, variant = 'dark' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is unavailable over plain http on some browsers — leave the
      // text selectable so it can still be copied by hand.
      setCopied(false);
    }
  }

  const dark = variant === 'dark';

  return (
    <div className="api-code" style={{ background: dark ? '#202124' : '#f8f9fa' }}>
      <div className="api-code__bar">
        <span className="api-code__label" style={{ color: dark ? '#9aa0a6' : '#5f6368' }}>
          {label}
        </span>
        <button type="button" className="api-code__copy" onClick={copy}>
          <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`}></i>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ color: dark ? '#e8eaed' : '#202124' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

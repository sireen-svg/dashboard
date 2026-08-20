import { useState } from 'react';

// Switches between multiple response examples inside one endpoint card
// (e.g. ✅ 201 Created / ❌ 422 Validation / ❌ 401 Unauthorized). From the
// Projects API endpoint — reused anywhere an endpoint needs more than one
// example response shown side by side instead of stacked.
export default function DocsResponseTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div className="docs-response-tabs">
      <div className="docs-response-tabs-list">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            className={`docs-response-tab docs-response-tab--${tab.tone}${tab.key === active ? ' docs-response-tab--active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="docs-response-panel">{activeTab?.content}</div>
    </div>
  );
}
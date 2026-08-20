const NUM_TONE_CLASS = {
  teal: 'docs-step-num--teal',
  green: 'docs-step-num--green',
};

// Numbered step chain (e.g. an ordered pipeline of operations), each with a
// name, description, and an optional success note (green) and/or failure
// note (red). A step can optionally set `tone` ('teal' | 'green') to
// highlight its number circle — used for pipeline steps the source docs
// call out as critical (e.g. stock checks) with a ✅ marker.
export default function DocsStepList({ steps }) {
  return (
    <div className="docs-step-list">
      {steps.map((step, i) => (
        <div className="docs-step" key={step.name}>
          <div className={`docs-step-num ${NUM_TONE_CLASS[step.tone] || ''}`}>{i + 1}</div>
          <div className="docs-step-content">
            <div className="docs-step-name">{step.name}</div>
            <div className="docs-step-desc">{step.desc}</div>
            {step.ok && <div className="docs-step-ok">{step.ok}</div>}
            {step.fail && <div className="docs-step-fail">{step.fail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
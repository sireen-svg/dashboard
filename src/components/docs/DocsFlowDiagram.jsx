export default function DocsFlowDiagram({ steps }) {
  return (
    <div className="docs-flow">
      {steps.map((step, i) => (
        <div className="docs-flow-item" key={step.label}>
          <div className={`docs-flow-step${step.variant ? ` docs-flow-step--${step.variant}` : ''}`}>
            <div className="docs-flow-step-label">{step.label}</div>
            {step.sub && <div className="docs-flow-step-sub">{step.sub}</div>}
          </div>
          {i < steps.length - 1 && <i className="bi bi-arrow-right docs-flow-arrow"></i>}
        </div>
      ))}
    </div>
  );
}
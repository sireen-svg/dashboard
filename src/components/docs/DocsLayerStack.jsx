export default function DocsLayerStack({ layers }) {
  return (
    <div className="docs-layer-stack">
      {layers.map((layer) => (
        <div className="docs-layer" key={layer.name}>
          <div className="docs-layer-name">{layer.name}</div>
          <div className="docs-layer-chips">
            {layer.chips.map((chip, i) => (
              <span key={chip} className={`docs-chip${i === 0 ? ' docs-chip--accent' : ''}`}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
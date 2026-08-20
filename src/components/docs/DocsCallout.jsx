const ICONS = {
  info: 'bi-info-circle-fill',
  warn: 'bi-exclamation-triangle-fill',
  danger: 'bi-x-octagon-fill',
  tip: 'bi-lightbulb-fill',
};

export default function DocsCallout({ type = 'info', children }) {
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <i className={`bi ${ICONS[type] || ICONS.info} docs-callout-icon`}></i>
      <div>{children}</div>
    </div>
  );
}
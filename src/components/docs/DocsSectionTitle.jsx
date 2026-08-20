const VARIANT_COLORS = {
  blue: { bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  teal: { bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)' },
  green: { bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)' },
  amber: { bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)' },
  red: { bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)' },
  purple: { bg: 'var(--fb-purple-bg)', fg: 'var(--fb-purple)' },
};

export default function DocsSectionTitle({ icon, children, variant = 'blue' }) {
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.blue;
  return (
    <div className="docs-section-title">
      {icon && (
        <span className="docs-section-icon" style={{ background: colors.bg, color: colors.fg }}>
          <i className={`bi ${icon}`}></i>
        </span>
      )}
      {children}
    </div>
  );
}
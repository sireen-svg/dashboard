import { statusStyle } from '../../lib/health';

/**
 * Compact status chip for one probed component. `error` is surfaced as the
 * tooltip so a red pill always says why, not just that.
 */
export default function HealthPill({ component }) {
  const s = statusStyle(component.status);

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 100,
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
      title={component.error || `${component.label}: ${s.label}`}
    >
      <i className={`bi ${s.icon} me-1`} style={{ fontSize: 10 }}></i>
      {component.label}
    </span>
  );
}

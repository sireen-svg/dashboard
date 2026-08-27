// Status palette for the platform health views. Lives outside the component
// files so both the pill and the health table can import it without tripping
// react-refresh/only-export-components.

const STATUS_STYLE = {
  up: { bg: 'var(--fb-green-bg)', color: 'var(--fb-green)', icon: 'bi-check-circle-fill', label: 'up' },
  down: { bg: 'var(--fb-red-bg)', color: 'var(--fb-red)', icon: 'bi-x-circle-fill', label: 'down' },
  unreachable: { bg: 'var(--fb-red-bg)', color: 'var(--fb-red)', icon: 'bi-plug-fill', label: 'unreachable' },
  unknown: { bg: 'var(--fb-yellow-bg)', color: 'var(--fb-yellow)', icon: 'bi-question-circle-fill', label: 'unknown' },
};

export function statusStyle(status) {
  return STATUS_STYLE[status] ?? STATUS_STYLE.unknown;
}

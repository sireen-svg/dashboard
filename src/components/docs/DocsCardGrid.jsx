import { Link } from 'react-router-dom';

export default function DocsCardGrid({ items, columns = 3 }) {
  return (
    <div className={`docs-card-grid docs-card-grid--${columns}`}>
      {items.map((item) => {
        const Wrapper = item.to ? Link : 'div';
        const wrapperProps = item.to ? { to: item.to } : {};
        return (
          <Wrapper
            key={item.title}
            {...wrapperProps}
            className={`card docs-card${item.to ? ' card-hover' : ''}`}
          >
            <div className="docs-card-icon" style={{ background: item.bg || 'var(--fb-blue-bg)' }}>
              <i className={`bi ${item.icon}`} style={{ color: item.fg || 'var(--fb-blue)' }}></i>
            </div>
            <div className="docs-card-title">{item.title}</div>
            <div className="docs-card-body">{item.body}</div>
          </Wrapper>
        );
      })}
    </div>
  );
}
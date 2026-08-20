import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import DocsSidebar from '../../components/layout/DocsSidebar';

// Mirrors ProjectLayout.jsx's `d-flex` + `.content-area` shell exactly, so
// Documentation shares the same page geometry as every project page.
export default function DocsLayout() {
  return (
    <div className="d-flex">
      <DocsSidebar />
      <div className="content-area">
        <Suspense
          fallback={
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
              <Spinner animation="border" variant="primary" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
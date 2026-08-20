import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsVersionsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Entries', to: '/docs/cms/entries' }, { label: 'Versioning' }]}
        eyebrow="Content"
        title="Entry"
        highlight="Versioning"
        subtitle="كل تعديل على entry يُحفَظ كـ version مستقل — يمكن الاسترجاع لأي نقطة في التاريخ."
      />

      <DocsCallout type="info">
        <strong>Auto Versioning:</strong> كل <code>update()</code> على entry يُنشئ سجلاً في <code>data_entry_versions</code>{' '}
        مع snapshot كامل للقيم قبل التعديل. <code>created_by</code> يُحفَظ لكل version.
      </DocsCallout>

      <DocsEndpointCard method="GET" path="/api/cms/entries/{entrySlug}/versions" authTag="🔐 auth.user" authTone="protected" description="قائمة versions للـ entry" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Parameters</div>
        <DocsParamTable
          rows={[
            { field: 'page', required: false, type: 'integer', notes: 'default: 1' },
            { field: 'per_page', required: false, type: 'integer', notes: 'default: 15' },
            { field: 'with_snapshot', required: false, type: 'boolean', notes: 'يشمل snapshot كامل للقيم' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response</div>
        <DocsCodeBlock language="json" code={`{
  "data": [
    {
      "id":         15,
      "entry_id":   88,
      "version":    3,
      "created_by": 42,
      "created_at": "2026-06-24T09:00:00Z",
      "snapshot":   { ... }  // لو with_snapshot=true
    }
  ],
  "meta": { "total": 3, "current_page": 1 }
}`} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/cms/data-entries/versions/{version}/restore" authTag="🔐 auth.user" authTone="protected" description="استرجاع entry لـ version سابق">
        <p><code>VersionRestoreService::restore($versionId, $userId)</code> يُطبِّق snapshot الـ version المحدد على الـ entry الحالي.</p>
        <DocsCodeBlock language="json" code={`{ "message": "Version restored successfully" }`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/versions" />
    </div>
  );
}
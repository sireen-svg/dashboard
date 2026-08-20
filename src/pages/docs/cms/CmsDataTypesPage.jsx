import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsDataTypesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'DataTypes API' }]}
        eyebrow="Schema Builder"
        title="DataTypes"
        highlight="API"
        subtitle="إنشاء وإدارة أنواع البيانات — كل DataType هو Schema مخصص (Article، Product، Hotel، Room...) بدون migrations."
      />

      <DocsCallout type="info">
        <strong>Soft Deletes:</strong> DataType المحذوف يذهب لـ <code>trashed</code> — يمكن استرجاعه بـ{' '}
        <code>/restore</code> أو حذفه نهائياً بـ <code>/force-delete</code>.
      </DocsCallout>

      {/* POST create */}
      <DocsEndpointCard method="POST" path="/api/cms/data-types" authTag="permission: cms.datatype.create" authTone="protected" description="إنشاء DataType جديد" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation Rules — CreateDataTypeRequest</div>
        <DocsParamTable
          rows={[
            { field: 'name', required: true, type: 'string', notes: 'max:255' },
            { field: 'slug', required: true, type: 'string', notes: 'max:255 — unique per project (enforced in Service)' },
            { field: 'description', required: false, type: 'string', notes: 'nullable' },
            { field: 'is_active', required: false, type: 'boolean', notes: 'default: true' },
            { field: 'settings', required: false, type: 'array', notes: 'إعدادات مخصصة JSON' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body</div>
        <DocsCodeBlock language="json" code={`{
  "name":        "Article",
  "slug":        "article",
  "description": "Blog articles and news posts",
  "is_active":   true
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response 201</div>
        <DocsCodeBlock language="json" label="201 Created" dotColor="var(--fb-green)" code={`{
  "message": "DataType created successfully",
  "data": {
    "id":          5,
    "project_id":  1,
    "name":        "Article",
    "slug":        "article",
    "is_active":   true,
    "created_at":  "2026-06-24T10:00:00Z"
  }
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Error Cases</div>
        <DocsCodeBlock language="json" code={`// Slug تكرار في نفس المشروع
{ "message": "DataType with this slug already exists in this project" }  // 422

// بدون permission
{ "message": "Forbidden" }  // 403`} />
      </DocsEndpointCard>

      {/* GET all */}
      <DocsEndpointCard method="GET" path="/api/cms/data-types" authTag="🔐 auth.user" authTone="protected" description="كل DataTypes للمشروع الحالي">
        <p>يُعيد كل DataTypes للـ <code>currentProject</code> بما فيها عدد الـ entries لكل type. مُجمَّع من <code>DataTypeReadService::list()</code>.</p>
        <DocsCodeBlock language="json" label="200 OK" dotColor="var(--fb-green)" code={`// مصفوفة مباشرة — بدون wrapper
[
  { "id": 5, "project_id": 1, "name": "Article", "slug": "article", "is_active": true, "settings": null },
  { "id": 6, "project_id": 1, "name": "Product", "slug": "product", "is_active": true, "settings": null }
]`} />
      </DocsEndpointCard>

      {/* GET single */}
      <DocsEndpointCard method="GET" path="/api/cms/data-types/{slug}" authTag="🔐 auth.user" authTone="protected" description="DataType محدد بالـ slug">
        <DocsCodeBlock language="json" code={`{ "message": "DataType not found" }  // 404`} />
      </DocsEndpointCard>

      {/* PUT update */}
      <DocsEndpointCard method="PUT" path="/api/cms/data-types/{dataType}" authTag="permission: cms.datatype.update" authTone="protected" description="تعديل DataType">
        <DocsCodeBlock language="json" code={`{
  "name":      "Blog Post",
  "is_active": true
}`} />
        <DocsCodeBlock language="json" code={`{ "message": "DataType updated successfully", "data": {...} }  // 200`} />
      </DocsEndpointCard>

      {/* DELETE */}
      <DocsEndpointCard method="DELETE" path="/api/cms/data-types/{dataType}" authTag="permission: cms.datatype.delete" authTone="protected" description="حذف ناعم (SoftDelete)">
        <p>يُنقل لـ trashed — يمكن استرجاعه. الـ Entries المرتبطة لا تُحذف فوراً.</p>
        <DocsResponseTabs
          tabs={[
            { key: 'ok', label: '✅ 200 OK', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "DataType deleted successfully" }  // SoftDelete`} /> },
            { key: '403', label: '❌ 403', tone: 'error', content: <DocsCodeBlock language="json" code={`{ "message": "Forbidden" }  // 403 — بدون permission: cms.datatype.delete`} /> },
          ]}
        />
      </DocsEndpointCard>

      {/* GET trashed */}
      <DocsEndpointCard method="GET" path="/api/cms/data-types/trashed" authTag="🔐 auth.user" authTone="protected" description="DataTypes المحذوفة قابلة للاسترجاع">
        <DocsCodeBlock language="json" code={`{ "message": "No trashed DataTypes found" }  // 404 لو فاضية`} />
      </DocsEndpointCard>

      {/* POST restore */}
      <DocsEndpointCard method="POST" path="/api/cms/data-types/{id}/restore" authTag="🔐 auth.user" authTone="protected" description="استرجاع DataType محذوف">
        <DocsCodeBlock language="json" code={`{ "message": "DataType restored successfully" }`} />
      </DocsEndpointCard>

      {/* DELETE force */}
      <DocsEndpointCard method="DELETE" path="/api/cms/data-types/{id}/force-delete" authTag="🔐 auth.user" authTone="protected" description="حذف نهائي غير قابل للاسترجاع">
        <DocsCallout type="danger">
          <strong>لا رجعة:</strong> يحذف الـ DataType وكل Fields وEntries المرتبطة نهائياً من قاعدة البيانات.
        </DocsCallout>
      </DocsEndpointCard>

      {/* GET entries by type */}
      <DocsEndpointCard method="GET" path="/api/projects/{project}/data-types/{slug}/entries" authTag="🔐 auth.user" authTone="protected" description="كل entries لـ DataType محدد">
        <p>يُعيد كل entries من نوع محدد للمشروع. Paginated.</p>
        <DocsCodeBlock language="text" label="curl" code={`GET /api/projects/1/data-types/article/entries?page=1&per_page=15
Authorization: Bearer {token}
X-Project-ID: {public_id}`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/data-types" />
    </div>
  );
}
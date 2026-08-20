import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsEntriesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Entries API' }]}
        eyebrow="Content"
        title="Data Entries"
        highlight="API"
        subtitle="إنشاء وإدارة المحتوى — كل entry هو سجل من DataType محدد مع Values وSEO وRelations وVersioning."
      />

      {/* POST create */}
      <DocsEndpointCard method="POST" path="/api/cms/data-types/{dataType:slug}/entries" authTag="🔐 auth.user + resolve.project" authTone="protected" description="إنشاء entry جديد" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation Rules — DataEntryRequest</div>
        <DocsParamTable
          rows={[
            { field: 'values', required: true, type: 'array', notes: 'القيم كـ {field_id: {locale: value}}' },
            { field: 'slug', required: false, type: 'string', notes: 'unique per project — يُولَّد من title لو فاضي' },
            { field: 'title', required: false, type: 'string', notes: 'required_without:slug — يُستخدَم لتوليد الـ slug' },
            { field: 'status', required: false, type: 'string', notes: 'draft | published | scheduled — default: draft' },
            { field: 'scheduled_at', required: false, type: 'date', notes: 'required_if:status,scheduled' },
            { field: 'seo', required: false, type: 'array', notes: 'SEO metadata' },
            { field: 'relations', required: false, type: 'array', notes: '[{relation_id, related_entry_ids:[]}]' },
            { field: 'files', required: false, type: 'array', notes: 'multipart files' },
          ]}
        />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body — Draft Entry</div>
        <DocsCodeBlock language="json" code={`POST /api/cms/data-types/article/entries

{
  "slug":   "my-first-article",
  "status": "draft",
  "values": {
    "12": { "en": "My First Article", "ar": "مقالتي الأولى" },
    "13": { "default": "Article body content here..." },
    "14": { "default": 1500 }
  },
  "seo": {
    "meta_title":       "My First Article | Blog",
    "meta_description": "A comprehensive guide to...",
    "og_image":         "https://cdn.example.com/og.jpg"
  },
  "relations": [
    {
      "relation_id":      3,   // field_id of the relation field
      "related_entry_ids": [8, 12]
    }
  ]
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body — Scheduled Entry</div>
        <DocsCodeBlock language="json" code={`{
  "slug":         "ramadan-special",
  "status":       "scheduled",
  "scheduled_at": "2026-03-01T00:00:00Z",
  "values": { ... }
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response</div>
        <DocsResponseTabs
          tabs={[
            {
              key: '201',
              label: '✅ 201 Created',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" label="201 Created — DataEntryController::store() يُعيد $entry مباشرة" dotColor="var(--fb-green)" code={`{
  "id":           88,
  "slug":         "my-first-article",
  "data_type_id": 5,
  "project_id":   1,
  "status":       "draft",
  "published_at": null,
  "scheduled_at": null,
  "created_by":   42,
  "updated_by":   null,
  "deleted_at":   null,
  "created_at":   "2026-06-24T10:00:00.000000Z",
  "updated_at":   "2026-06-24T10:00:00.000000Z"
}`} />
                  <DocsParamTable
                    rows={[
                      { field: 'status', type: 'enum', notes: 'draft | published | scheduled | archived' },
                      { field: 'created_by', type: 'integer', notes: 'user_id من JWT تلقائياً' },
                      { field: 'published_at', type: 'null|datetime', notes: 'يُملأ عند النشر' },
                      { field: 'scheduled_at', type: 'null|datetime', notes: 'يُملأ لو status=scheduled' },
                    ]}
                  />
                  <DocsCallout type="tip">
                    <strong>Auto Slug:</strong> لو ما أرسلت <code>slug</code>، يُولَّد من{' '}
                    <code>values.{'{title_field}'}.en</code> أو <code>ar</code> بـ <code>Str::slug()</code>.
                  </DocsCallout>
                </>
              ),
            },
            {
              key: '422',
              label: '❌ 422',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "The slug has already been taken." }  // 422
{ "message": "The values field is required.", "errors": {...} }  // 422`} />,
            },
            {
              key: '401',
              label: '❌ 401',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Unauthorized" }  // 401`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* GET entry */}
      <DocsEndpointCard method="GET" path="/api/cms/entries/{entry:slug}" authTag="🔐 auth.user" authTone="protected" description="entry محدد بالـ slug">
        <DocsCodeBlock language="text" label="curl" code={`GET /api/cms/entries/my-first-article
Authorization: Bearer {token}
X-Project-ID: {public_id}`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "id":           88,
  "slug":         "my-first-article",
  "data_type_id": 5,
  "project_id":   1,
  "status":       "published",
  "published_at": "2026-06-20T10:00:00.000000Z",
  "scheduled_at": null,
  "created_by":   42,
  "updated_by":   42,
  "created_at":   "2026-06-24T10:00:00.000000Z",
  "values": [
    { "field_id": 12, "locale": "en", "value": "My First Article" },
    { "field_id": 12, "locale": "ar", "value": "مقالتي الأولى" }
  ]
}`} />,
            },
            {
              key: '404',
              label: '❌ 404',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "No query results for model [DataEntry]." }  // 404`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* GET with-relations */}
      <DocsEndpointCard method="GET" path="/api/cms/entries/{entry:slug}/with-relations" authTag="🔐 auth.user" authTone="protected" description="entry مع كل العلاقات المحمَّلة">
        <p>يُعيد الـ entry كاملاً مع الـ DataEntries المرتبطة محمَّلة بالكامل — مناسب لـ detail pages.</p>
      </DocsEndpointCard>

      {/* GET same-type */}
      <DocsEndpointCard method="GET" path="/api/cms/entries/{entry:slug}/same-type" authTag="🔐 auth.user" authTone="protected" description="entries من نفس النوع — Related Content">
        <p>مفيد لـ "مقالات ذات صلة" أو "منتجات مشابهة".</p>
      </DocsEndpointCard>

      {/* POST bulk */}
      <DocsEndpointCard method="POST" path="/api/cms/entries/bulk" authTag="🔐 auth.user" authTone="protected" description="جلب entries متعددة بـ slugs">
        <DocsCodeBlock language="json" code={`{ "slugs": ["article-one", "article-two", "article-three"] }`} />
      </DocsEndpointCard>

      {/* PUT update */}
      <DocsEndpointCard method="PUT" path="/api/cms/data-types/{dataType:slug}/entries/{entry:slug}" authTag="🔐 auth.user" authTone="protected" description="تعديل entry كامل">
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "message": "Data updated successfully",
  "entry": {
    "id": 88, "slug": "my-first-article",
    "status": "draft", "updated_by": 42,
    "updated_at": "2026-06-24T11:00:00.000000Z"
  }
}`} />
                  <DocsCallout type="info">كل save يُنشئ version جديد تلقائياً في <code>data_entry_versions</code>.</DocsCallout>
                </>
              ),
            },
            {
              key: '404',
              label: '❌ 404',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "No query results for model [DataEntry]." }  // 404`} />,
            },
            {
              key: '422',
              label: '❌ 422',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "The slug has already been taken.", "errors": { "slug": [...] } }  // 422`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* PATCH partial */}
      <DocsEndpointCard method="PATCH" path="/api/cms/data-entries/{entry:slug}" authTag="🔐 auth.user" authTone="protected" description="تعديل جزئي — Partial Update">
        <p>يستخدم <code>sometimes</code> rules — يُرسَل الـ values المراد تعديله فقط بدون الباقي.</p>
      </DocsEndpointCard>

      {/* DELETE */}
      <DocsEndpointCard method="DELETE" path="/api/cms/entries/{entry:slug}" authTag="🔐 auth.user" authTone="protected" description="حذف entry (SoftDelete)">
        <DocsResponseTabs
          tabs={[
            { key: 'ok', label: '✅ 200 OK', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "Data deleted successfully" }  // SoftDelete`} /> },
            { key: '404', label: '❌ 404', tone: 'error', content: <DocsCodeBlock language="json" code={`{ "message": "No query results for model [DataEntry]." }  // 404`} /> },
          ]}
        />
      </DocsEndpointCard>

      {/* GET all in project */}
      <DocsEndpointCard method="GET" path="/api/cms/projects/{project}/entries" authTag="🔐 auth.user" authTone="protected" description="كل entries للمشروع — All Types">
        <p>يُعيد كل entries بجميع DataTypes للمشروع. Paginated.</p>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/entries" />
    </div>
  );
}
import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsHeaderBox from '../../../components/docs/DocsHeaderBox';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsProjectsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Projects API' }]}
        eyebrow="CMS Service"
        title="Projects"
        highlight="API"
        subtitle="إنشاء وإدارة المشاريع — كل مشروع هو بيئة معزولة مستقلة بـ modules وlanguages."
      />

      <DocsCallout type="info">
        <strong>project_id vs public_id:</strong> الـ <code>id</code> internal للـ DB. الـ <code>public_id</code> هو UUID
        يُستخدَم في الـ API. الـ <code>resolve.project</code> middleware يُترجم من <code>X-Project-ID</code> (public_id)
        إلى الـ internal id.
      </DocsCallout>

      {/* POST /projects */}
      <DocsEndpointCard method="POST" path="/api/projects" authTag="🔐 auth.user" authTone="protected" description="إنشاء مشروع جديد" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation Rules — CreateProjectRequest</div>
        <DocsParamTable
          rows={[
            { field: 'name', required: true, type: 'string', notes: 'max:255' },
            { field: 'supported_languages', required: false, type: 'array', notes: '["ar","en","fr"]' },
            { field: 'enabled_modules', required: false, type: 'array', notes: '["cms","ecommerce","booking"]' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body</div>
        <DocsCodeBlock language="json" code={`{
  "name":                "My Hotel Platform",
  "supported_languages": ["ar", "en"],
  "enabled_modules":     ["cms", "booking", "ecommerce"]
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
                  <DocsCodeBlock language="json" label="201 Created — Project model مباشرة" dotColor="var(--fb-green)" code={`{
  "id":                  1,
  "public_id":           "550e8400-e29b-41d4-a716-446655440000",
  "slug":                "my-hotel-platform",
  "name":                "My Hotel Platform",
  "owner_id":            42,
  "supported_languages": ["ar", "en"],
  "enabled_modules":     ["cms", "booking"],
  "ratings_count":       0,
  "ratings_avg":         null,
  "created_at":          "2026-06-24T10:00:00.000000Z",
  "updated_at":          "2026-06-24T10:00:00.000000Z"
}`} />
                  <DocsParamTable
                    rows={[
                      { field: 'public_id', type: 'UUID', notes: 'يُستخدَم كـ X-Project-ID في كل requests' },
                      { field: 'owner_id', type: 'integer', notes: 'من JWT تلقائياً — لا يُرسَل في الـ body' },
                      { field: 'slug', type: 'string', notes: 'يُولَّد من name تلقائياً' },
                    ]}
                  />
                </>
              ),
            },
            {
              key: '422',
              label: '❌ 422 Validation',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "The name field is required.", "errors": { "name": ["The name field is required."] } }`} />,
            },
            {
              key: '401',
              label: '❌ 401 Unauthorized',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Unauthorized" }  // 401 — no token or invalid session`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* GET /projects */}
      <DocsEndpointCard method="GET" path="/api/projects" authTag="🔐 auth.user + resolve.project" authTone="protected" description="قائمة مشاريع المستخدم">
        <p>يُعيد جميع المشاريع المرتبطة بالمستخدم الحالي.</p>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Required Headers</div>
        <DocsHeaderBox
          rows={[
            { key: 'Authorization', value: 'Bearer {access_token}' },
            { key: 'X-Project-ID', value: '{public_id}' },
          ]}
        />
      </DocsEndpointCard>

      {/* GET /projects/{project} */}
      <DocsEndpointCard method="GET" path="/api/projects/{project}" authTag="🔐 auth.user" authTone="protected" description="تفاصيل مشروع محدد">
        <DocsParamTable rows={[{ field: 'project', required: true, type: 'integer', notes: 'project DB id' }]} />
      </DocsEndpointCard>

      {/* POST /projects/{project} */}
      <DocsEndpointCard method="POST" path="/api/projects/{project}" authTag="🔐 auth.user" authTone="protected" description="تعديل مشروع">
        <DocsCodeBlock language="json" code={`{
  "name": "Updated Project Name",
  "supported_languages": ["ar", "en", "fr"]
}`} />
      </DocsEndpointCard>

      {/* DELETE /projects/{project} */}
      <DocsEndpointCard method="DELETE" path="/api/projects/{project}" authTag="🔐 auth.user" authTone="protected" description="حذف مشروع — Cascade">
        <DocsCallout type="danger">
          <strong>Cascade Delete:</strong> حذف المشروع يحذف كل DataTypes وFields وEntries المرتبطة به. هذا العمل غير
          قابل للاسترجاع (SoftDelete على الـ project فقط).
        </DocsCallout>
        <DocsCodeBlock language="json" code={`{ "message": "Project deleted successfully" }  // 200`} />
      </DocsEndpointCard>

      {/* GET /projects/resolve */}
      <DocsEndpointCard method="GET" path="/api/projects/resolve" authTag="🔐 resolve.project" authTone="protected" description="معلومات المشروع الحالي من الـ token">
        <p>يُعيد بيانات المشروع الذي يُعرِّفه الـ X-Project-ID header. مفيد لتحميل context المشروع عند بدء الجلسة.</p>
      </DocsEndpointCard>

      {/* POST /check-project-access */}
      <DocsEndpointCard method="POST" path="/api/check-project-access" authTag="🔐 resolve.project" authTone="protected" description="التحقق من صلاحية الوصول">
        <p>يتحقق إذا كان المستخدم الحالي لديه صلاحية الوصول للمشروع المحدد.</p>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/projects" />
    </div>
  );
}
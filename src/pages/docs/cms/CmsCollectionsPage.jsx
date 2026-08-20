import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCardGrid from '../../../components/docs/DocsCardGrid';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const TYPES = [
  { title: 'Manual Collection', body: 'تُحدِّد يدوياً أي entries تدخل المجموعة — مثال: "مقالات مميزة"، "منتجات الصفحة الرئيسية".', icon: 'bi-pencil-square', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  { title: 'Dynamic Collection', body: 'تُحدِّد conditions — مثال: كل articles التي rating > 4 أو price < 100. تتحدث تلقائياً.', icon: 'bi-lightning-charge', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)' },
];

export default function CmsCollectionsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Collections API' }]}
        eyebrow="Content"
        title="Collections"
        highlight="API"
        subtitle="تجميع Entries في مجموعات — Manual (يدوي) أو Dynamic (شروط تلقائية)."
      />

      <DocsCardGrid items={TYPES} columns={2} />

      {/* POST create */}
      <DocsEndpointCard method="POST" path="/api/cms/collections" authTag="🔐 auth.user" authTone="protected" description="إنشاء collection" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation — CreateDataCollectionRequest</div>
        <DocsParamTable
          rows={[
            { field: 'name', required: true, type: 'string', notes: '' },
            { field: 'slug', required: true, type: 'string', notes: '' },
            { field: 'type', required: true, type: 'string', notes: 'in:manual,dynamic' },
            { field: 'conditions', required: false, type: 'array', notes: '[{field, operator, value}] — للـ dynamic' },
            { field: 'conditions_logic', required: false, type: 'string', notes: 'in:and,or — default: and' },
            { field: 'description', required: false, type: 'string', notes: '' },
            { field: 'is_active', required: false, type: 'boolean', notes: 'default: true' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Manual Collection</div>
        <DocsCodeBlock language="json" code={`{
  "name":        "Featured Articles",
  "slug":        "featured-articles",
  "type":        "manual",
  "description": "Handpicked editorial content"
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Dynamic Collection</div>
        <DocsCodeBlock language="json" code={`{
  "name":             "Top Rated",
  "slug":             "top-rated",
  "type":             "dynamic",
  "conditions": [
    { "field": "ratings_avg", "operator": ">", "value": "4.0" },
    { "field": "status",      "operator": "=", "value": "published" }
  ],
  "conditions_logic": "and"
}`} />
      </DocsEndpointCard>

      {/* POST insert */}
      <DocsEndpointCard method="POST" path="/api/cms/collections/{collectionSlug}/insert" authTag="🔐 auth.user" authTone="protected" description="إضافة entries لـ manual collection">
        <DocsCodeBlock language="json" code={`{ "entry_ids": [88, 91, 95] }`} />
        <DocsCodeBlock language="json" code={`{ "message": "Items added successfully" }`} />
      </DocsEndpointCard>

      {/* DELETE items */}
      <DocsEndpointCard method="DELETE" path="/api/cms/collections/{collectionSlug}/items" authTag="🔐 auth.user" authTone="protected" description="إزالة entries من collection">
        <DocsCodeBlock language="json" code={`{ "entry_ids": [88] }`} />
      </DocsEndpointCard>

      {/* POST reorder */}
      <DocsEndpointCard method="POST" path="/api/cms/collections/{collectionSlug}/items/reorder" authTag="🔐 auth.user" authTone="protected" description="إعادة ترتيب items">
        <DocsCodeBlock language="json" code={`{ "ordered_ids": [95, 88, 91] }  // الترتيب الجديد`} />
      </DocsEndpointCard>

      {/* GET entries */}
      <DocsEndpointCard method="GET" path="/api/cms/collections/{collectionSlug}/entries" authTag="🔐 auth.user" authTone="protected" description="entries الـ collection">
        <p>للـ manual: يُعيد الـ entries المضافة يدوياً بالترتيب المحدد. للـ dynamic: يُطبِّق الـ conditions ويُعيد النتائج المطابقة.</p>
      </DocsEndpointCard>

      {/* PATCH deactivate */}
      <DocsEndpointCard method="PATCH" path="/api/cms/collections/{collectionSlug}/deactivate" authTag="🔐 auth.user" authTone="protected" description="تعطيل collection">
        <DocsCodeBlock language="json" code={`{ "message": "Collection deactivated" }`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/collections" />
    </div>
  );
}
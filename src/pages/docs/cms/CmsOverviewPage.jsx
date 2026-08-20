import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsStatsRow from '../../../components/docs/DocsStatsRow.jsx';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsCardGrid from '../../../components/docs/DocsCardGrid';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const STATS = [
  { value: '6', suffix: '+', label: 'Field Types' },
  { value: '3', label: 'Entry States' },
  { value: '6', label: 'Analytics Reports' },
  { value: '∞', label: 'Custom Schemas' },
  { value: 'AI', label: 'Auto-provisioning' },
];

const CARDS = [
  { title: 'Projects', body: 'Multi-tenant isolation — كل project معزول بـ project_id مع supported_languages وenabled_modules', icon: 'bi-folder', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)', to: '/docs/cms/projects' },
  { title: 'DataTypes', body: 'Schema builder ديناميكي — أنشئ أي نوع بيانات (Article، Product، Hotel) بدون migrations', icon: 'bi-puzzle', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)', to: '/docs/cms/data-types' },
  { title: 'Entries', body: 'المحتوى الفعلي — Draft / Published / Scheduled مع Versioning وRelations وSEO', icon: 'bi-file-text', bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)', to: '/docs/cms/entries' },
  { title: 'Collections', body: 'تجميع Entries بشكل Manual أو Dynamic بـ conditions محددة', icon: 'bi-collection', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)', to: '/docs/cms/collections' },
  { title: 'AI Provisioning', body: 'توليد schema كامل من جملة واحدة بالعربية أو الإنجليزية', icon: 'bi-robot', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)', to: '/docs/cms/ai' },
  { title: 'Analytics', body: '6 تقارير جاهزة — overview، growth، ratings، top content', icon: 'bi-bar-chart', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)', to: '/docs/cms/analytics' },
];

const RESPONSE_PATTERNS = `// Pattern A — message + data (DataTypeController, FieldController)
201 → { "message": "DataType created successfully", "data": { id, project_id, name, slug, is_active, created_at } }
200 → { "message": "DataType updated successfully", "data": { ...updated } }
200 → { "message": "DataType deleted successfully" }
200 → { "message": "DataType restored successfully" }
200 → { "message": "DataType force deleted successfully" }
201 → { "message": "Field created successfully", "data": { id, data_type_id, name, type, required, translatable, validation_rules, sort_order } }
200 → { "message": "Field updated successfully", "data": {...} }
200 → { "message": "Data-Type Field deleted successfully" }

// Pattern B — Model مباشرة (ProjectController, DataEntryController, DataEntryPublishController)
201 POST /projects      → { id, public_id, slug, name, owner_id, enabled_modules, created_at }
201 POST /cms/entries   → { id, slug, data_type_id, project_id, status:"draft", published_at:null, created_by, created_at }
200 POST /publish       → { id, slug, status:"published", published_at:"2026-06-24T...", updated_by }
200 PUT  /entries       → { "message": "Data updated successfully", "entry": {...} }
200 DEL  /entries       → { "message": "Data deleted successfully" }

// Pattern C — success + data (AiConversationController, CmsAnalyticsController)
201 POST /ai/conversations → { "success": true, "data": { conversation_id, reply, schema:{modules,data_types}, provisioned:true } }
200 GET  /analytics/admin/overview  → { "success": true, "period":{from,to}, "data":{total_projects, total_entries, avg_rating} }
200 GET  /analytics/projects/content → { "success": true, "data":[{data_type, total, published, drafts, publish_rate, avg_rating}] }
5xx AI  → { "success": false, "message": "All AI providers failed to respond." }

// Error Responses — موحَّدة
401 → { "message": "Unauthorized" }
403 → { "message": "Forbidden" }
404 → { "message": "DataType not found" }
404 → { "message": "No trashed DataTypes found" }
404 → { "message": "No query results for model [DataEntry]." }  // firstOrFail()
422 → { "message": "The slug has already been taken.", "errors": { field:[messages] } }
500 → { "message": "Already published." }           // State Machine Exception
500 → { "message": "Unsupported field type 'video'." }  // FieldTypeFactory`;

export default function CmsOverviewPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="CMS Service — Core Module"
        title="Content Management"
        highlight="System"
        subtitle="القلب المركزي لـ HyperCore — نظام إدارة محتوى ديناميكي يُمكِّن بناء أي data schema من الصفر دون كتابة كود، مع دعم AI provisioning وIR Search وSubscriptions وPayments."
      />

      <DocsStatsRow stats={STATS} />

      <DocsSectionTitle icon="bi-bullseye" variant="blue">لماذا CMS هو القلب؟</DocsSectionTitle>
      <p className="docs-lead">
        كل module آخر (E-Commerce، Booking) يرتكز على CMS كـ data layer. المنتجات في E-Commerce هي <em>DataEntries</em> من
        نوع "Product". الفنادق في Booking هي DataEntries من نوع "Hotel". الـ CMS يوفِّر الـ Schema Builder، الـ Search
        Index، الـ Versioning، والـ Subscriptions لكل المنصة.
      </p>
      <DocsCardGrid items={CARDS} columns={3} />

      <DocsCallout type="info">
        <strong>resolve.project Middleware:</strong> كل CMS endpoint يمر عبر <code>resolve.project</code> الذي يقرأ الـ
        project context من الـ JWT ويُحدِّد <code>app('currentProject')</code> تلقائياً — يضمن عزل البيانات بين
        المشاريع.
      </DocsCallout>

      <DocsSectionTitle icon="bi-list-check" variant="purple">Response Patterns — CMS Service</DocsSectionTitle>
      <DocsCodeBlock language="text" label="HTTP Responses — من الكود الفعلي" code={RESPONSE_PATTERNS} />

      <DocsPrevNext currentPath="/docs/cms" />
    </div>
  );
}
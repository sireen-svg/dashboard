import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsAnalyticsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Analytics' }]}
        eyebrow="Analytics"
        title="CMS Analytics"
        highlight="API"
        subtitle="6 تقارير جاهزة — Admin Overview، Projects Growth، Content Summary، Ratings. كلها تدعم date filtering."
      />

      <DocsCallout type="info">
        <strong>Response Format موحَّد:</strong> كل analytics endpoints تُعيد{' '}
        <code>{'{ "success": true, "data": {...} }'}</code> — مع <code>period: {'{from, to}'}</code> في الـ Admin
        endpoints.
      </DocsCallout>

      {/* Admin Overview */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/admin/overview" authTag="🔐 auth.user" authTone="protected" description="نظرة عامة للمنصة — Admin" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Params</div>
        <DocsParamTable
          rows={[
            { field: 'from', required: false, type: 'date', notes: '2026-01-01' },
            { field: 'to', required: false, type: 'date', notes: '2026-06-30' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response</div>
        <DocsCodeBlock language="json" code={`{
  "success": true,
  "period": { "from": "2026-01-01", "to": "2026-06-30" },
  "data": {
    "total_projects":    48,
    "total_data_types":  156,
    "total_entries":     4280,
    "active_modules":   ["cms", "ecommerce", "booking"],
    "avg_rating":       4.3,
    "total_ratings":    892
  }
}`} />
      </DocsEndpointCard>

      {/* Projects Growth */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/admin/projects-growth" authTag="🔐 auth.user" authTone="protected" description="نمو المشاريع عبر الزمن">
        <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": [
    { "date": "2026-01", "count": 8,  "cumulative": 8  },
    { "date": "2026-02", "count": 12, "cumulative": 20 },
    { "date": "2026-03", "count": 15, "cumulative": 35 }
  ]
}`} />
      </DocsEndpointCard>

      {/* Content Summary */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/projects/content" authTag="🔐 auth.user + resolve.project" authTone="protected" description="ملخص المحتوى للمشروع">
        <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": [
    {
      "data_type":    "article",
      "total":        120,
      "published":    98,
      "drafts":       15,
      "scheduled":    7,
      "archived":     0,
      "publish_rate": "81.6%",
      "avg_rating":   4.1
    }
  ]
}`} />
      </DocsEndpointCard>

      {/* Content Growth */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/projects/content-growth" authTag="🔐 auth.user + resolve.project" authTone="protected" description="نمو المحتوى المنشور">
        <p>يُعيد عدد الـ entries المنشورة بشكل يومي/أسبوعي/شهري حسب الـ granularity المحدد.</p>
      </DocsEndpointCard>

      {/* Top Rated */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/projects/top-rated" authTag="🔐 auth.user + resolve.project" authTone="protected" description="أعلى المحتوى تقييماً">
        <DocsCodeBlock language="json" code={`{
  "data": [
    { "slug": "best-article", "ratings_avg": 4.9, "ratings_count": 87 }
  ]
}`} />
      </DocsEndpointCard>

      {/* Ratings Report */}
      <DocsEndpointCard method="GET" path="/api/cms/analytics/projects/ratings" authTag="🔐 auth.user + resolve.project" authTone="protected" description="تقرير التقييمات التفصيلي">
        <DocsCodeBlock language="json" code={`{
  "data": {
    "overall_avg": 4.2,
    "distribution": {
      "5": "42%", "4": "33%", "3": "15%",
      "2": "7%",  "1": "3%"
    },
    "trend": [
      { "month": "2026-05", "avg": 4.1 },
      { "month": "2026-06", "avg": 4.3 }
    ]
  }
}`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/analytics" />
    </div>
  );
}
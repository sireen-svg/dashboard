import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsSearchPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Search APIs' }]}
        eyebrow="IR Search Engine"
        title="Search"
        highlight="APIs"
        subtitle="محرك بحث IR بـ 9 ranking signals — Intent Detection، Typo Correction، 3-tier Cache، Debug Mode."
      />

      {/* GET main search */}
      <DocsEndpointCard method="GET" path="/api/search?q={query}" authTag="🔐 auth.user + resolve.project" authTone="protected" description="البحث الرئيسي مع IR Ranking" defaultOpen>
        <DocsParamTable
          rows={[
            { field: 'q', required: true, type: 'string', notes: 'نص البحث — عربي أو إنجليزي' },
            { field: 'type', required: false, type: 'string', notes: 'data_type slug للفلترة' },
            { field: 'per_page', required: false, type: 'integer', notes: 'default: 15' },
          ]}
        />
        <DocsCallout type="info">
          <strong>Ranking من 9 مصادر:</strong> FULLTEXT (3.0×) + Phrase match (+8 title, +3 content) + Intent boost +
          User preference + CTR signals + click_count + view_count + freshness + popularity_score
        </DocsCallout>
        <DocsCallout type="tip">
          <strong>3-tier Cache:</strong> Hot Cache 20 ثانية → Main Cache 10 دقائق → Trending Cache 30 دقيقة (للـ
          queries ذات 50+ نتيجة أو single-word).
        </DocsCallout>
      </DocsEndpointCard>

      {/* POST click */}
      <DocsEndpointCard method="POST" path="/api/search/click" authTag="🔐 auth.user" authTone="protected" description="تسجيل نقرة — يُحدِّث Ranking Signals">
        <DocsCodeBlock language="json" code={`{ "entry_id": 88, "query": "فنادق فاخرة", "position": 1 }`} />
      </DocsEndpointCard>

      {/* GET suggestions */}
      <DocsEndpointCard method="GET" path="/api/search/suggestions?q={query}" authTag="Public — resolve.project" authTone="public" description="اقتراحات البحث — لا يحتاج auth">
        <p>مناسب للـ search-as-you-type. لا يشترط authentication.</p>
      </DocsEndpointCard>

      {/* GET popular */}
      <DocsEndpointCard method="GET" path="/api/search/popular" authTag="Public — resolve.project" authTone="public" description="أكثر الـ queries شيوعاً">
        <p>من جدول <code>popular_searches</code> — يُحدَّث بـ <code>RecomputePopularSearchesCommand</code>.</p>
      </DocsEndpointCard>

      <DocsSectionTitle>Admin / Debug Search APIs</DocsSectionTitle>

      {/* POST debug */}
      <DocsEndpointCard method="POST" path="/api/admin/search/debug" authTag="🔐 auth.user" authTone="protected" description="Debug Mode — كيف حُسِبت الـ Scores">
        <DocsCodeBlock language="json" code={`{ "query": "laptop gaming", "show_scores": true }`} />
        <DocsCodeBlock language="json" code={`{
  "results": [...],
  "debug": {
    "query_tokens":   ["laptop", "gaming"],
    "intent":         "buy",
    "typo_corrected": false,
    "ranking_breakdown": [
      { "entry_id": 5, "fulltext": 2.4, "phrase": 8, "ctr": 0.3, "final": 10.7 }
    ]
  }
}`} />
      </DocsEndpointCard>

      {/* POST compare */}
      <DocsEndpointCard method="POST" path="/api/admin/search/compare" authTag="🔐 auth.user" authTone="protected" description="مقارنة نتائج query-ين">
        <DocsCodeBlock language="json" code={`{ "query_a": "laptop", "query_b": "gaming laptop" }`} />
      </DocsEndpointCard>

      {/* GET logs */}
      <DocsEndpointCard method="GET" path="/api/admin/search/logs" authTag="🔐 auth.user" authTone="protected" description="سجلات البحث والنقرات">
        <p>يُعيد <code>UserSearchLog</code> + <code>UserClickLog</code> مع CTR لكل query.</p>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/search" />
    </div>
  );
}
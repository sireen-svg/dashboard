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
      <DocsEndpointCard method="POST" path="/api/admin/search/debug" authTag="🔐 auth.user" authTone="protected" description="تفكيك بحث واحد إلى مراحله">
        <DocsCodeBlock language="json" code={`{ "keyword": "iphone released in 2020", "language": "en", "project_id": 2 }`} />
        <DocsCodeBlock language="json" code={`{
  "execution_time_ms": 31.4,
  "text_pipeline": {
    "folded":         "iphone released in 2020",
    "script_profile": { "Latn": 1.0 },
    "needs_ngram":    false,
    "tokens":         ["iphone", "released", "in", "2020"]
  },
  "plan": {
    "terms":      ["iphone"],
    "expansions": [],
    "must_not":   [],
    "filters":    [
      { "key": "year", "operator": "eq", "value": 2020, "confidence": 0.9, "hard": true }
    ],
    "intent":     { "intent": "general", "confidence": 0 },
    "source":     "local"
  },
  "retrieval": {
    "boolean_queries":      ["+iphone*", "iphone*"],
    "relaxation_step_used": 0,
    "match_target":         "ft_fold (default parser)",
    "total_matches":        3,
    "window": { "size": 200, "sql_offset": 0, "reranked": true }
  },
  "rescue":  { "attempted": false, "accepted": null, "tried": [] },
  "refiner": { "used": false, "source": "local" },
  "results": [
    {
      "entry_id": 5,
      "title": "iPhone 12",
      "score": {
        "bm25f": 6.21, "phrase_bonus": 0, "signals": 4.9,
        "base": 11.11, "personalization_multiplier": 1.0, "final": 11.11
      }
    }
  ]
}`} />
      </DocsEndpointCard>

      {/* POST terms */}
      <DocsEndpointCard method="POST" path="/api/admin/search/terms" authTag="🔐 auth.user" authTone="protected" description="وزن IDF لكل مصطلح في متن المشروع">
        <DocsCodeBlock language="json" code={`{ "keyword": "iphone pro", "language": "en", "project_id": 2 }`} />
        <DocsCodeBlock language="json" code={`{
  "corpus": { "document_count": 46, "avg_title_terms": 3.2, "avg_content_terms": 87.4 },
  "terms": [
    { "term": "iphone", "document_frequency": 2,  "idf": 3.09, "is_expansion": false },
    { "term": "pro",    "document_frequency": 18, "idf": 0.94, "is_expansion": false }
  ]
}`} />
      </DocsEndpointCard>

      {/* GET problems */}
      <DocsEndpointCard method="GET" path="/api/admin/search/problems" authTag="🔐 auth.user" authTone="protected" description="الاستعلامات المتعثّرة ومرشّحو المعجم">
        <p>
          <code>lexicon_candidates</code> تسرد ما عجز عنه المسار المحلّي وأنقذه النموذج —
          نقلها إلى <code>resources/search/lexicon/</code> يُلغي استدعاء الشبكة لها نهائياً.
        </p>
      </DocsEndpointCard>

      {/* GET logs */}
      <DocsEndpointCard method="GET" path="/api/admin/search/logs" authTag="🔐 auth.user" authTone="protected" description="سجلات البحث والنقرات">
        <p>يُعيد <code>UserSearchLog</code> + <code>UserClickLog</code> مع CTR لكل query.</p>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/search" />
    </div>
  );
}
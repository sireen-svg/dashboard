import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsRatingsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Ratings' }]}
        eyebrow="Features"
        title="Ratings"
        highlight="API"
        subtitle="نظام تقييم متعدد الكيانات — يدعم DataEntries وProjects بـ Polymorphic Relations."
      />

      <DocsCallout type="info">
        <strong>Denormalized Ratings:</strong> <code>ratings_count</code> و<code>ratings_avg</code> مُخزَّنة مباشرة في
        جدولَي <code>data_entries</code> و<code>projects</code> لأداء أفضل في الاستعلامات.
      </DocsCallout>

      <DocsEndpointCard method="POST" path="/api/ratings" authTag="🔐 auth.user + resolve.project" authTone="protected" description="إضافة تقييم" defaultOpen>
        <DocsCodeBlock language="json" code={`{
  "rateable_type": "DataEntry",
  "rateable_id":   88,
  "rating":        5,
  "comment":       "Excellent article!"
}`} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ratings/stats" authTag="🔐 auth.user" authTone="protected" description="إحصاءات التقييمات">
        <DocsCodeBlock language="json" code={`{ "avg": 4.2, "count": 892, "distribution": { ... } }`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/ratings" />
    </div>
  );
}
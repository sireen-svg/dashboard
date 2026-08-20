import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsTable from '../../../components/docs/DocsTable';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const STATES = [
  { label: 'draft', sub: 'Default state — قابل للتعديل', variant: 'accent' },
  { label: 'published', sub: 'مرئي للعموم — published_at مُملَّأ', variant: 'green' },
  { label: 'scheduled', sub: 'ينتشر تلقائياً في scheduled_at', variant: 'teal' },
  { label: 'archived', sub: 'مؤرشَف — لا يظهر في البحث' },
];

const PUBLISH_LOGIC = `// 1. تحديد الحالة الحالية
$state = $resolver->resolve($entry);  // DraftState | PublishedState

// 2. تنفيذ publish — يرمي Exception لو published
$state->publish($entry);

// 3. تحديث DB
$entry->update(['status' => 'published', 'published_at' => now()]);`;

export default function CmsStatesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Entries', to: '/docs/cms/entries' }, { label: 'State Machine' }]}
        eyebrow="Content"
        title="Entry"
        highlight="State Machine"
        subtitle="State Pattern حقيقي — كل entry في حالة واحدة، والانتقال يُطبِّق قواعد محددة."
      />

      <DocsFlowDiagram steps={STATES} />

      <DocsSectionTitle icon="bi-clipboard-check" variant="blue">Transitions المتاحة</DocsSectionTitle>
      <DocsTable
        headers={['من', 'إلى', 'التفاصيل']}
        rows={[
          ['draft', 'published', 'POST /entries/{slug}/publish — يضع published_at = now()'],
          ['draft', 'scheduled', 'إرسال status=scheduled + scheduled_at في الـ store'],
          ['published', <span key="1" style={{ color: 'var(--fb-red)' }}>✗ published</span>, <span key="2" style={{ color: 'var(--fb-red)' }}>Exception: Already published</span>],
          ['published', <span key="3" style={{ color: 'var(--fb-red)' }}>✗ scheduled</span>, <span key="4" style={{ color: 'var(--fb-red)' }}>Exception: Cannot schedule a published entry</span>],
        ]}
      />

      <DocsSectionTitle icon="bi-broadcast" variant="teal">Publish Endpoint</DocsSectionTitle>
      <DocsEndpointCard method="POST" path="/api/cms/entries/{entry:slug}/publish" authTag="🔐 auth.user" authTone="protected" description="نشر entry — Draft → Published" defaultOpen>
        <p>يُحدِّد الـ state الحالي عبر <code>DataEntryStateResolver</code> ثم يُنفِّذ <code>publish()</code> على الـ state المناسب.</p>
        <DocsCodeBlock language="text" label="PublishDataEntryAction — Logic" code={PUBLISH_LOGIC} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Responses</div>
        <DocsCodeBlock language="json" code={`{ "status": "published", "published_at": "2026-06-24T10:00:00Z" }  // 200
{ "message": "Already published." }  // 500 — من Exception`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/states" />
    </div>
  );
}
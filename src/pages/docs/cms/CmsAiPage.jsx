import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const FALLBACK_CHAIN = [
  { label: 'Gemini Key 1', sub: 'Primary — falls back on failure', variant: 'accent' },
  { label: 'Gemini Key 2', sub: 'Secondary — falls back on failure', variant: 'accent' },
  { label: 'OpenRouter', sub: 'Final Fallback', variant: 'teal' },
];

const PIPELINE_FLOW = [
  { label: 'User Message', sub: '"أريد منصة..."' },
  { label: 'AIProviderChain', sub: 'Gemini → OpenRouter', variant: 'accent' },
  { label: 'JSON Schema', sub: 'AI response' },
  { label: 'ProvisionAction', sub: 'DB Transaction', variant: 'teal' },
  { label: 'Project + Types', sub: '+ Fields (2-pass)', variant: 'green' },
];

export default function CmsAiPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'AI Agents' }]}
        eyebrow="Advanced — AI Agents"
        title="AI"
        highlight="Provisioning"
        subtitle="توليد مشاريع backend كاملة من جملة واحدة — Cascading Provider Fallback وConversation Continuity."
      />

      <DocsSectionTitle icon="bi-link-45deg" variant="amber">Provider Fallback Chain</DocsSectionTitle>
      <DocsFlowDiagram steps={FALLBACK_CHAIN} />

      <DocsCallout type="info">
        <strong>Conversation Continuity:</strong> كل رسالة تُرسَل مع كامل history المحادثة — الـ AI يتذكر الـ schema
        السابق ويُعدِّله بدون إعادة البدء. Bilingual: يكتشف اللغة تلقائياً ويرد بنفسها.
      </DocsCallout>

      {/* GET conversations */}
      <DocsEndpointCard method="GET" path="/api/ai/conversations" authTag="🔐 auth.user" authTone="protected" description="قائمة المحادثات" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Params</div>
        <DocsParamTable rows={[{ field: 'per_page', required: false, type: 'integer', notes: 'default: 15' }]} />
      </DocsEndpointCard>

      {/* POST new conversation */}
      <DocsEndpointCard method="POST" path="/api/ai/conversations" authTag="🔐 auth.user" authTone="protected" description="إرسال رسالة / بدء محادثة">
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation</div>
        <DocsParamTable
          rows={[
            { field: 'content', required: true, type: 'string', notes: 'min:3 | max:3000' },
            { field: 'conversation_id', required: false, type: 'integer', notes: 'exists:ai_conversations,id — للمتابعة' },
            { field: 'action', required: false, type: 'string', notes: 'in:chat,provision' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request — مشروع جديد</div>
        <DocsCodeBlock language="json" code={`{
  "content": "أريد منصة حجز فنادق مع دفع إلكتروني ودعم متعدد اللغات",
  "action":  "provision"
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response 201</div>
        <DocsCodeBlock language="json" label="201 Created" dotColor="var(--fb-green)" code={`{
  "success": true,
  "data": {
    "conversation_id": 15,
    "reply": "سأساعدك في إنشاء منصة الحجز. أُنشأت البنية التالية...",
    "schema": {
      "modules": ["booking", "cms", "ecommerce"],
      "data_types": [
        { "name": "Hotel",   "fields": ["name", "location", "rating", "price_per_night"] },
        { "name": "Room",    "fields": ["type", "capacity", "price", "amenities"] },
        { "name": "Booking", "fields": ["check_in", "check_out", "guests", "total"] }
      ]
    },
    "provisioned": true  // DB Transaction — كل شيء أو لا شيء
  }
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request — متابعة محادثة (تعديل)</div>
        <DocsCodeBlock language="json" code={`{
  "content":         "أضف حقل pool وgym للفندق",
  "conversation_id": 15,  // نفس المحادثة — الـ AI يتذكر السياق
  "action":          "provision"
}`} />
      </DocsEndpointCard>

      {/* GET conversation */}
      <DocsEndpointCard method="GET" path="/api/ai/conversations/{id}" authTag="🔐 auth.user" authTone="protected" description="محادثة مع كامل الـ messages history">
        <p>يُعيد المحادثة مع كل الرسائل. يتحقق من ownership — المستخدم يرى محادثاته فقط.</p>
      </DocsEndpointCard>

      {/* DELETE */}
      <DocsEndpointCard method="DELETE" path="/api/ai/conversations/{id}" authTag="🔐 auth.user" authTone="protected" description="حذف محادثة">
        <DocsCodeBlock language="json" code={`{ "message": "Conversation deleted successfully." }`} />
      </DocsEndpointCard>

      <DocsSectionTitle icon="bi-gear" variant="green">Provisioning Pipeline</DocsSectionTitle>
      <DocsFlowDiagram steps={PIPELINE_FLOW} />
      <DocsCallout type="tip">
        <strong>Two-Pass Provisioning:</strong> (1) تُنشأ كل DataTypes أولاً. (2) تُعالَج الـ Relation fields بعدها —
        لأن <code>related_data_type_id</code> يحتاج الـ types موجودة أولاً. كل شيء داخل DB Transaction واحد.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/cms/ai" />
    </div>
  );
}
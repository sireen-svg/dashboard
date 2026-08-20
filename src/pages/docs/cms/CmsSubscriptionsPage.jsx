import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsSubscriptionsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Subscriptions' }]}
        eyebrow="Subscriptions"
        title="Subscriptions"
        highlight="API"
        subtitle="نظام Plans وSubscriptions وFeature Rules — يتحكم بالوصول للميزات بناءً على الاشتراك."
      />

      {/* POST plan */}
      <DocsEndpointCard method="POST" path="/api/subscriptions/plans" authTag="🔐 auth.user" authTone="protected" description="إنشاء خطة اشتراك" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation — CreatePlanRequest</div>
        <DocsParamTable
          rows={[
            { field: 'name', required: true, type: 'string', notes: 'max:255' },
            { field: 'slug', required: true, type: 'string', notes: 'max:255' },
            { field: 'price', required: true, type: 'numeric', notes: 'min:0' },
            { field: 'currency', required: true, type: 'string', notes: 'size:3 — "USD","SAR","JOD"' },
            { field: 'duration_days', required: true, type: 'integer', notes: 'min:1' },
            { field: 'features', required: false, type: 'array', notes: '[{feature_key, feature_type, feature_value}]' },
            { field: 'description', required: false, type: 'string', notes: '' },
            { field: 'is_active', required: false, type: 'boolean', notes: '' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body</div>
        <DocsCodeBlock language="json" code={`{
  "name":          "Professional",
  "slug":          "professional",
  "price":         99.00,
  "currency":      "USD",
  "duration_days": 30,
  "features": [
    { "feature_key": "max_projects",     "feature_type": "limit",   "feature_value": 10 },
    { "feature_key": "ai_provisioning",  "feature_type": "boolean", "feature_value": true },
    { "feature_key": "search_analytics", "feature_type": "boolean", "feature_value": true }
  ]
}`} />
      </DocsEndpointCard>

      {/* POST subscribe */}
      <DocsEndpointCard method="POST" path="/api/subscriptions" authTag="🔐 auth.user" authTone="protected" description="الاشتراك في خطة">
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation — SubscribeUserRequest</div>
        <DocsParamTable
          rows={[
            { field: 'plan_id', required: true, type: 'integer', notes: 'exists:subscription_plans,id' },
            { field: 'gateway', required: true, type: 'string', notes: 'stripe | paypal | local' },
            { field: 'payment_type', required: true, type: 'string', notes: 'in:full,installment' },
            { field: 'auto_renew', required: false, type: 'boolean', notes: 'default: true' },
            { field: 'metadata', required: false, type: 'array', notes: 'بيانات إضافية' },
          ]}
        />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body</div>
        <DocsCodeBlock language="json" code={`{
  "plan_id":      2,
  "gateway":      "stripe",
  "payment_type": "full",
  "auto_renew":   true
}`} />
        <DocsCallout type="info">
          <strong>user_id</strong> يُأخَذ تلقائياً من الـ JWT (<code>auth_user.id</code>) —{' '}
          <code>SubscribeUserDTO.fromRequest()</code>.
        </DocsCallout>
      </DocsEndpointCard>

      {/* POST renew */}
      <DocsEndpointCard method="POST" path="/api/subscriptions/{subscription}/renew" authTag="🔐 auth.user" authTone="protected" description="تجديد اشتراك">
        <DocsCodeBlock language="json" code={`{ "data": { "status": "active", "expires_at": "2026-07-24T..." } }`} />
      </DocsEndpointCard>

      {/* POST cancel */}
      <DocsEndpointCard method="POST" path="/api/subscriptions/{subscription}/cancel" authTag="🔐 auth.user" authTone="protected" description="إلغاء اشتراك">
        <DocsCodeBlock language="json" code={`{ "data": { "status": "cancelled", "cancelled_at": "2026-06-24T..." } }`} />
      </DocsEndpointCard>

      {/* Feature rules */}
      <DocsEndpointCard method="POST" path="/api/subscription-feature-rules" authTag="🔐 auth.user" authTone="protected" description="إضافة قاعدة feature لـ subscription">
        <p>تُحدِّد ما إذا كانت feature معيَّنة مُتاحة لـ subscription محدد وبأي قيود.</p>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/subscriptions" />
    </div>
  );
}
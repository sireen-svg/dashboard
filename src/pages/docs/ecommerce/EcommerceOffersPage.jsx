import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceOffersPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Offers API' }]}
        eyebrow="E-Commerce"
        title="Offers"
        highlight="API"
      />

      <DocsCallout type="info">
        <strong>Offer = Collection + Benefit:</strong> كل offer مرتبط بـ CMS Collection (مجموعة منتجات). الـ
        benefit_type يحدد نوع الخصم والـ benefit_config يحدد قيمته.
      </DocsCallout>

      <DocsEndpointCard method="POST" path="/api/ecommerce/offers" authTag="permission: offer.create" authTone="protected" description="إنشاء offer" defaultOpen>
        <DocsParamTable rows={[
          { field: 'name', required: true, type: 'string', notes: '' },
          { field: 'type', required: true, type: 'string', notes: 'in:manual,dynamic' },
          { field: 'data_type_id', required: true, type: 'integer', notes: 'DataType في CMS' },
          { field: 'conditions', required: false, type: 'array', notes: '[{field, operator, value}] — للـ dynamic' },
          { field: 'conditions_logic', required: false, type: 'string', notes: 'in:and,or' },
          { field: 'is_code_offer', required: true, type: 'boolean', notes: 'false=عام | true=كود خصم' },
          { field: 'offer_duration', required: true, type: 'numeric', notes: 'required_if:is_code_offer=true — بالساعات' },
          { field: 'benefit_type', required: true, type: 'string', notes: 'in:percentage,fixed_amount,buy_x_get_y,quantity,total_price' },
          { field: 'benefit_config', required: true, type: 'array', notes: 'حسب الـ benefit_type' },
          { field: 'start_at', required: false, type: 'date', notes: 'nullable' },
          { field: 'end_at', required: false, type: 'date', notes: 'nullable | after_or_equal:start_at' },
          { field: 'is_active', required: false, type: 'boolean', notes: 'default: true' },
        ]} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Example — Percentage Offer (General)</div>
        <DocsCodeBlock language="json" code={`{
  "name":          "Summer Sale",
  "type":          "manual",
  "data_type_id":  6,
  "is_code_offer": false,
  "benefit_type":  "percentage",
  "benefit_config": { "percentage": 20 },
  "start_at":      "2026-07-01T00:00:00Z",
  "end_at":        "2026-07-31T23:59:59Z"
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Example — Code Offer</div>
        <DocsCodeBlock language="json" code={`{
  "name":           "Flash Deal",
  "type":           "dynamic",
  "data_type_id":   6,
  "conditions": [{ "field": "price", "operator": ">", "value": "100" }],
  "is_code_offer":  true,
  "offer_duration": 24,
  "benefit_type":   "fixed_amount",
  "benefit_config": { "fixed_amount": 15 }
}`} />

        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 201', tone: 'success',
            content: <DocsCodeBlock language="json" code={`{ "message": "Offer created successfully" }  // 201`} />,
          },
          {
            key: 'err', label: '❌ Errors', tone: 'error',
            content: (
              <DocsCodeBlock language="json" code={`{ "message": "Forbidden" }  // 403 — بدون permission
{ "message": "The benefit type field must be in: percentage, fixed_amount..." }  // 422
// BenefitStrategyFactory Exception — unsupported type
{ "message": "Unsupported benefit_type: foobar" }  // 500`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/offers" authTag="🔐 ecommerce.enabled" authTone="protected" description="كل offers للمشروع">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "data": [
    { "id": 3, "collection_id": 10, "benefit_type": "percentage", "is_active": true,
      "benefit_config": { "percentage": 20 }, "start_at": "2026-07-01", "end_at": "2026-07-31" }
  ]
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/offers/{collectionSlug}" authTag="🔐 ecommerce.enabled" authTone="protected" description="offer محدد">
        <DocsResponseTabs tabs={[
          { key: 'ok', label: '✅ 200', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "data": { /* offer object */ } }`} /> },
          { key: '404', label: '❌ 404', tone: 'error', content: <DocsCodeBlock language="json" code={`{ "message": "Offer not found" }  // 404`} /> },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="PATCH" path="/api/ecommerce/offers/{collectionSlug}" authTag="permission: offer.update" authTone="protected" description="تعديل offer">
        <DocsResponseTabs tabs={[
          { key: 'ok', label: '✅ 200', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "Offer updated successfully", "data": { /* updated offer */ } }`} /> },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="DELETE" path="/api/ecommerce/offers/{collectionSlug}" authTag="permission: offer.delete" authTone="protected" description="حذف offer">
        <DocsResponseTabs tabs={[
          { key: 'ok', label: '✅ 200', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "Offer deleted successfully" }`} /> },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/offers/{collectionSlug}/insert" authTag="permission: offer.update" authTone="protected" description="إضافة منتجات للـ offer">
        <DocsCodeBlock language="json" code={`{ "entry_ids": [55, 56, 57] }`} />
        <DocsResponseTabs tabs={[
          { key: 'ok', label: '✅ 200', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "Items added successfully" }`} /> },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/offers/{collectionSlug}/deactivate" authTag="permission: offer.update" authTone="protected" description="تعطيل offer">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{ "message": "Offer deactivated successfully" }
// Activate: POST /offers/{slug}/activate → { "message": "Offer activated successfully" }`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/offers/{collectionSlug}/subscribe" authTag="🔐 ecommerce.enabled" authTone="protected" description="الاشتراك في code offer">
        <p>يُسجِّل المستخدم للحصول على كود خصم محدد المدة. يُنشئ سجلاً في <code>user_offers</code> مع تاريخ انتهاء بناءً على offer_duration.</p>
        <DocsResponseTabs tabs={[
          { key: 'ok', label: '✅ 200', tone: 'success', content: <DocsCodeBlock language="json" code={`{ "message": "Offer subscribed successfully" }`} /> },
        ]} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/offers" />
    </div>
  );
}
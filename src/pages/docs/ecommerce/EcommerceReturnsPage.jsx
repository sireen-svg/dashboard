import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceReturnsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Return Requests API' }]}
        eyebrow="E-Commerce"
        title="Return Requests"
        highlight="API"
      />

      <DocsEndpointCard method="POST" path="/api/ecommerce/return-requests" authTag="🔐 ecommerce.enabled" authTone="protected" description="إنشاء طلب إرجاع" defaultOpen>
        <DocsParamTable rows={[
          { field: 'order_id', required: true, type: 'integer', notes: 'exists:orders,id' },
          { field: 'order_item_id', required: true, type: 'integer', notes: 'exists:order_items,id' },
          { field: 'description', required: false, type: 'string', notes: 'nullable — سبب الإرجاع' },
          { field: 'quantity', required: false, type: 'integer', notes: 'nullable | min:1 — null = إرجاع كامل' },
        ]} />
        <DocsCodeBlock language="json" code={`{
  "order_id":      881,
  "order_item_id": 201,
  "description":   "المنتج وصل تالفاً",
  "quantity":      1   // null = إرجاع كامل
}`} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Return request created",
  "data": {
    "id":            15,
    "user_id":       42,
    "order_id":      881,
    "order_item_id": 201,
    "quantity":      1,
    "description":   "المنتج وصل تالفاً",
    "status":        "pending",
    "created_at":    "2026-06-24T10:00:00Z"
  }
}`} />
            ),
          },
          {
            key: 'err', label: '❌ Errors', tone: 'error',
            content: (
              <DocsCodeBlock language="json" code={`{ "message": "The order id field is required." }  // 422
{ "message": "The selected order item id is invalid." }  // 422 — order_item_id غير موجود`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/admin/return-requests" authTag="permission: return.viewAll" authTone="protected" description="كل طلبات الإرجاع — Admin">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Return requests fetched successfully",
  "data": [
    { "id": 15, "status": "pending", "order_id": 881, "user_id": 42, "quantity": 1 }
  ]
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="PATCH" path="/api/ecommerce/admin/return-requests/{id}" authTag="permission: return.update" authTone="protected" description="قبول أو رفض طلب الإرجاع">
        <DocsCodeBlock language="json" code={`{ "status": "approved" }  // أو "rejected"`} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Return request updated",
  "data": { "id": 15, "status": "approved", /* ... */ }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/returns" />
    </div>
  );
}
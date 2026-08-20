import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceOrdersPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Orders API' }]}
        eyebrow="E-Commerce"
        title="Orders"
        highlight="API"
      />

      <DocsEndpointCard method="GET" path="/api/ecommerce/orders" authTag="🔐 ecommerce.enabled" authTone="protected" description="طلبات المستخدم الحالي" defaultOpen>
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <>
                <DocsCodeBlock language="json" code={`{
  "message": "Orders fetched successfully",
  "data": [
    { "id": 881, "status": "paid", "total_price": 1099.18, "currency": "USD", "created_at": "..." }
  ]
}`} />
                <DocsCallout type="info">Cached: <code>user:{'{userId}'}:project:{'{projectId}'}:orders</code></DocsCallout>
              </>
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/orders/{orderId}" authTag="🔐 ecommerce.enabled" authTone="protected" description="تفاصيل طلب محدد">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Order fetched successfully",
  "data": {
    "id":          881,
    "project_id":  1,
    "user_id":     42,
    "status":      "paid",
    "total_price": 1099.18,
    "currency":    "USD",
    "address":     { "city": "Amman", "phone": "..." },
    "items": [
      { "id": 201, "product_id": 55, "quantity": 2, "price": 519.60, "total": 1039.20, "status": "pending" }
    ],
    "created_at":  "2026-06-24T10:00:00Z"
  }
}`} />
            ),
          },
          {
            key: 'err', label: '❌ Errors', tone: 'error',
            content: (
              <DocsCodeBlock language="json" code={`{ "message": "Order not found" }  // 404
// يتحقق من ownership — المستخدم يرى طلباته فقط`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/allorders" authTag="permission: order.viewAll" authTone="protected" description="كل الطلبات — Admin">
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Parameters</div>
        <DocsParamTable rows={[
          { field: 'status', required: false, type: 'string', notes: 'فلترة بحالة الطلب' },
          { field: 'user_id', required: false, type: 'integer', notes: 'فلترة بمستخدم محدد' },
        ]} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <>
                <DocsCodeBlock language="json" code={`{
  "message": "Admin orders fetched successfully",
  "data": [ /* paginated orders */ ]
}`} />
                <DocsCallout type="info">Cached with <code>Cache::tags(['admin_orders'])</code> — يُلغى مع كل checkout جديد.</DocsCallout>
              </>
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="PATCH" path="/api/ecommerce/orders/{orderId}/status" authTag="permission: order.updateStatus" authTone="protected" description="تحديث حالة الطلب">
        <DocsParamTable rows={[
          { field: 'status', required: true, type: 'string', notes: 'in:pending,paid,shipped,delivered,cancelled,returned,partially_returned' },
        ]} />
        <DocsCodeBlock language="json" code={`{ "status": "shipped" }`} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: <DocsCodeBlock language="json" code={`{
  "message": "Order status updated successfully",
  "data": { "id": 881, "status": "shipped", /* ... */ }
}`} />,
          },
          {
            key: 'err', label: '❌ Errors', tone: 'error',
            content: <DocsCodeBlock language="json" code={`{ "message": "The status field must be in: pending, paid, shipped..." }  // 422
{ "message": "Forbidden" }  // 403 — بدون permission`} />,
          },
        ]} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/orders" />
    </div>
  );
}
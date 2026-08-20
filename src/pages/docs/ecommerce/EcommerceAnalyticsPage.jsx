import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceAnalyticsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Analytics' }]}
        eyebrow="Analytics"
        title="E-Commerce"
        highlight="Analytics"
      />

      <DocsCallout type="info">
        <strong>Response Pattern:</strong> كل analytics endpoints تُعيد <code>{'{"success":true,"data":{...}}'}</code>{' '}
        من EcommerceAnalyticsController. تدعم query params: <code>from</code>، <code>to</code>، <code>period</code>{' '}
        (day/week/month).
      </DocsCallout>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/sales" authTag="🔐 auth.user" authTone="protected" description="ملخص المبيعات" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Parameters</div>
        <DocsParamTable rows={[
          { field: 'from', required: false, type: 'date', notes: '2026-01-01' },
          { field: 'to', required: false, type: 'date', notes: '2026-06-30' },
        ]} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": {
    "period": { "from": "2026-01-01", "to": "2026-06-30" },
    "orders": {
      "total":           340,
      "total_revenue":   45200.00,
      "avg_order_value": 132.94,
      "by_status": {
        "pending": 12, "paid": 198, "shipped": 85,
        "delivered": 40, "cancelled": 5
      },
      "cancellation_rate": 1.47,
      "return_rate":       0.88
    },
    "items": {
      "total_sold":      892,
      "unique_products": 48
    },
    "returns": {
      "total": 3, "approved": 2, "pending": 1, "rejected": 0
    }
  }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/sales/trend" authTag="🔐 auth.user" authTone="protected" description="نمو المبيعات عبر الزمن">
        <DocsParamTable rows={[
          { field: 'period', required: false, type: 'string', notes: 'day | week | month — default: day' },
          { field: 'from', required: false, type: 'date', notes: '' },
          { field: 'to', required: false, type: 'date', notes: '' },
        ]} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": {
    "period": "month", "from": "2026-01-01", "to": "2026-06-30",
    "data": [
      { "label": "2026-01", "orders_count": 45, "revenue": 5980.00, "avg_order_value": 132.89 },
      { "label": "2026-02", "orders_count": 62, "revenue": 8240.50, "avg_order_value": 132.91 }
    ]
  }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/products/top" authTag="🔐 auth.user" authTone="protected" description="أعلى المنتجات مبيعاً">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": {
    "top_by_sales": [
      { "product_id": 55, "total_quantity": 120, "total_revenue": 15600.00,
        "order_count": 85, "avg_price": 130.00, "return_rate": 1.2 }
    ],
    "least_by_sales": [/* أقل المنتجات */]
  }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/customers/top" authTag="🔐 auth.user" authTone="protected" description="أكثر العملاء إنفاقاً">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": [
    { "user_id": 42, "order_count": 12, "total_spent": 1580.00,
      "avg_order_value": 131.67, "first_order": "2026-01-15", "last_order": "2026-06-20" }
  ]
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/offers" authTag="🔐 auth.user" authTone="protected" description="أداء الـ offers">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": [
    { "offer_id": 3, "benefit_type": "percentage", "subscribers": 48,
      "total_orders": 35, "total_discount_given": 2400.00, "revenue_generated": 9600.00 }
  ]
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/analytics/returns" authTag="🔐 auth.user" authTone="protected" description="تحليل الإرجاعات">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "success": true,
  "data": {
    "total_return_requests": 28,
    "approved": 18, "pending": 5, "rejected": 5,
    "approval_rate": 64.29,
    "top_returned_products": [
      { "product_id": 58, "return_count": 8, "return_rate": 6.5 }
    ]
  }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/analytics" />
    </div>
  );
}
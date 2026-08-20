import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceCartPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Cart API' }]}
        eyebrow="E-Commerce"
        title="Cart"
        highlight="API"
      />

      <DocsCallout type="info">
        <strong>One Cart per (user + project):</strong> UNIQUE constraint على (project_id, user_id). محاولة إنشاء
        سلة ثانية = تحديث للسلة الموجودة.
      </DocsCallout>

      <DocsEndpointCard method="POST" path="/api/ecommerce/cart" authTag="🔐 ecommerce.enabled" authTone="protected" description="إضافة items للسلة" defaultOpen>
        <DocsParamTable
          rows={[
            { field: 'items', required: true, type: 'array', notes: 'min:1' },
            { field: 'items.*.item_id', required: true, type: 'integer', notes: 'DataEntry.id من CMS' },
            { field: 'items.*.quantity', required: true, type: 'integer', notes: 'min:1' },
          ]}
        />
        <DocsCodeBlock language="json" code={`{
  "items": [
    { "item_id": 55, "quantity": 2 },
    { "item_id": 56, "quantity": 1 }
  ]
}`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <DocsCodeBlock language="json" code={`{
  "message": "Cart created successfully",
  "data": {
    "id":         12,
    "project_id": 1,
    "user_id":    42,
    "items": [
      { "id": 88, "cart_id": 12, "item_id": 55, "quantity": 2 },
      { "id": 89, "cart_id": 12, "item_id": 56, "quantity": 1 }
    ],
    "created_at": "2026-06-24T10:00:00Z"
  }
}`} />
              ),
            },
            {
              key: '422',
              label: '❌ 422',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`{ "message": "The items field is required.", "errors": { "items": [...] } }  // 422
{ "message": "The items.0.quantity must be at least 1." }  // 422`} />
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/cart" authTag="🔐 ecommerce.enabled" authTone="protected" description="سلة المستخدم الحالي">
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <DocsCodeBlock language="json" code={`{
  "message": "Cart fetched successfully",
  "data": {
    "id": 12, "project_id": 1, "user_id": 42,
    "items": [ { "item_id": 55, "quantity": 2 } ]
  }
}
// لو ما فيه سلة → data: null`} />
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsEndpointCard method="PUT" path="/api/ecommerce/cart" authTag="🔐 ecommerce.enabled" authTone="protected" description="تحديث كميات items">
        <DocsCodeBlock language="json" code={`{ "items": [{ "item_id": 55, "quantity": 3 }] }`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{ "message": "Cart updated successfully", "data": { /* updated cart */ } }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsEndpointCard method="DELETE" path="/api/ecommerce/cart/items" authTag="🔐 ecommerce.enabled" authTone="protected" description="حذف items محددة">
        <DocsCodeBlock language="json" code={`{ "item_ids": [55, 56] }`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{ "message": "Items removed successfully", "data": { /* updated cart */ } }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsEndpointCard method="DELETE" path="/api/ecommerce/cart" authTag="🔐 ecommerce.enabled" authTone="protected" description="تفريغ السلة كاملة">
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{ "message": "Cart cleared successfully", "data": null }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/cart" />
    </div>
  );
}
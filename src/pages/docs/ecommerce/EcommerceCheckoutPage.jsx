import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceCheckoutPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Checkout API' }]}
        eyebrow="E-Commerce"
        title="Checkout"
        highlight="API"
      />

      <DocsEndpointCard method="POST" path="/api/ecommerce/checkout" authTag="🔐 ecommerce.enabled" authTone="protected" description="Checkout — 8-step pipeline in DB Transaction" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation — CheckoutRequest</div>
        <DocsParamTable
          rows={[
            { field: 'cart_id', required: true, type: 'integer', notes: 'exists:carts,id' },
            { field: 'payment_method', required: true, type: 'string', notes: 'in:online,cod' },
            { field: 'gateway', required: true, type: 'string', notes: 'required_if:online — in:stripe,paypal,wallet' },
            { field: 'payment_type', required: true, type: 'string', notes: 'required_if:online — in:full,installment' },
            { field: 'address', required: true, type: 'object', notes: 'full_address + city + street + phone' },
            { field: 'address.full_address', required: true, type: 'string', notes: '' },
            { field: 'address.city', required: true, type: 'string', notes: '' },
            { field: 'address.street', required: true, type: 'string', notes: '' },
            { field: 'address.phone', required: true, type: 'mixed', notes: '' },
          ]}
        />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request — Online Payment</div>
        <DocsCodeBlock language="json" code={`{
  "cart_id":        12,
  "payment_method": "online",
  "gateway":        "stripe",
  "payment_type":   "full",
  "address": {
    "full_address": "123 King Street, Amman",
    "city":         "Amman",
    "street":       "King Street",
    "phone":        "+962791234567"
  }
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request — Cash on Delivery</div>
        <DocsCodeBlock language="json" code={`{
  "cart_id":        12,
  "payment_method": "cod",
  "address": { "full_address": "...", "city": "...", "street": "...", "phone": "..." }
}
// gateway + payment_type غير مطلوبَين مع COD`} />

        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "message": "Checkout completed successfully",
  "data": {
    "id":          881,
    "project_id":  1,
    "user_id":     42,
    "total_price": 1099.18,
    "status":      "paid",
    "currency":    "USD",
    "address": { "city": "Amman", "street": "...", "phone": "..." },
    "items": [
      { "id": 201, "product_id": 55, "quantity": 2, "price": 519.60, "total": 1039.20, "status": "pending" }
    ],
    "created_at": "2026-06-24T10:00:00Z"
  }
}`} />
                  <DocsCallout type="tip">
                    <strong>COD:</strong> status = "pending". <strong>Online:</strong> status = payment status من
                    الـ gateway ("paid" أو "pending").
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'stock',
              label: '❌ Stock Error',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`// Step 3 — Stock check fails
{ "message": "Product MacBook Pro 14 only has 1 left" }  // 500 — Exception`} />
              ),
            },
            {
              key: 'pay',
              label: '❌ Payment Failed',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`// Step 4 — Payment gateway fails
{ "message": "Payment failed" }  // 500 — DB Transaction rollback`} />
              ),
            },
            {
              key: 'cart',
              label: '❌ Cart Errors',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`{ "message": "Cart is empty" }       // 500
{ "message": "Unauthorized cart" }  // 500 — cart_id لمستخدم آخر`} />
              ),
            },
            {
              key: '422',
              label: '❌ 422',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`{ "message": "The cart id field is required." }  // 422
{ "message": "The payment method field must be in: online, cod." }  // 422
{ "message": "The gateway field is required when payment method is online." }  // 422`} />
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/checkout" />
    </div>
  );
}
import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommercePaymentsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Payments API' }]}
        eyebrow="E-Commerce"
        title="Payments"
        highlight="API"
      />

      <DocsCallout type="tip">
        <strong>PCI DSS Compliant:</strong> لا يُخزَّن card_number أو CVV. <code>payments</code> table يحفظ فقط:
        gateway, amount, currency, status.
      </DocsCallout>

      <DocsEndpointCard method="POST" path="/api/ecommerce/payments/pay" authTag="🔐 ecommerce.enabled" authTone="protected" description="معالجة دفع" defaultOpen>
        <DocsCodeBlock language="json" code={`{
  "amount":      150.00,
  "currency":    "USD",
  "gateway":     "stripe",
  "entity_type": "order",
  "entity_id":   881
}`} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 201', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message":            "Payment processed successfully.",
  "payment_id":         200,
  "transaction_id":     "txn_3Mz4N...",
  "payment_method":     "stripe",
  "status":             "paid",
  "installment_number": null
}`} />
            ),
          },
          {
            key: 'err', label: '❌ Failed', tone: 'error',
            content: (
              <DocsCodeBlock language="json" code={`{ "message": "Payment failed. Please try again.", "status": "failed" }  // 422`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/payments/installment" authTag="🔐 ecommerce.enabled" authTone="protected" description="دفع قسط">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message":            "Installment paid successfully.",
  "installment_number": 2,
  "remaining":          2,
  "plan_status":        "active"
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/payments/refund" authTag="permission: payment.refund" authTone="protected" description="استرداد دفعة — Admin only">
        <DocsCodeBlock language="json" code={`{ "payment_id": 200, "amount": 75.00, "reason": "Customer request" }`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/payments" />
    </div>
  );
}
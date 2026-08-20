import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsPaymentsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Payments API' }]}
        eyebrow="Payments"
        title="Payments"
        highlight="API"
        subtitle="معالجة المدفوعات عبر gateway — دعم Full Payment وInstallments وRefunds وWallet Top-up."
      />

      <DocsCallout type="tip">
        <strong>PCI DSS Compliant:</strong> لا يُخزَّن أي رقم كارت أو CVV. كل بيانات الكارت تذهب مباشرة للـ payment
        gateway — جدول <code>payments</code> يحفظ فقط gateway, amount, currency, status.
      </DocsCallout>

      {/* POST charge */}
      <DocsEndpointCard method="POST" path="/api/payments/pay" authTag="🔐 auth.user + resolve.project" authTone="protected" description="معالجة دفع" defaultOpen>
        <DocsCodeBlock language="json" code={`{
  "amount":     150.00,
  "currency":   "USD",
  "gateway":    "stripe",
  "entity_type": "booking",
  "entity_id":  77
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response 201</div>
        <DocsCodeBlock language="json" label="201 Created" dotColor="var(--fb-green)" code={`{
  "message":           "Payment processed successfully.",
  "payment_id":        200,
  "transaction_id":    "txn_3Mz...",
  "payment_method":    "stripe",
  "status":            "succeeded",
  "installment_number": null
}`} />
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Error Response</div>
        <DocsCodeBlock language="json" code={`{ "message": "Payment failed. Please try again.", "status": "failed" }  // 422`} />
      </DocsEndpointCard>

      {/* POST installment */}
      <DocsEndpointCard method="POST" path="/api/payments/installment" authTag="🔐 auth.user" authTone="protected" description="دفع قسط">
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response</div>
        <DocsCodeBlock language="json" code={`{
  "message":            "Installment paid successfully.",
  "installment_number": 2,
  "remaining":          2,
  "plan_status":        "active"
}`} />
      </DocsEndpointCard>

      {/* POST refund */}
      <DocsEndpointCard method="POST" path="/api/payments/refund" authTag="🔐 auth.user" authTone="protected" description="استرداد دفعة">
        <DocsCodeBlock language="json" code={`{ "payment_id": 200, "amount": 75.00, "reason": "Customer request" }`} />
      </DocsEndpointCard>

      {/* POST wallet topup */}
      <DocsEndpointCard method="POST" path="/api/wallet/topup" authTag="permission: wallet.topup" authTone="protected" description="تعبئة رصيد — Admin only">
        <DocsCodeBlock language="json" code={`{ "user_id": 42, "amount": 500.00, "currency": "USD" }`} />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/payments" />
    </div>
  );
}
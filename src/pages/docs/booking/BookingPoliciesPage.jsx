import { Link } from 'react-router-dom';
import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsTable from '../../../components/docs/DocsTable';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const MATCH_FLOW = [
  { label: 'hours = now → start_at', sub: 'diffInHours', variant: 'accent' },
  { label: 'hours <= 0 ?', sub: 'العودة بـ 0', variant: 'red' },
  { label: 'السياسات تنازلياً', sub: 'ORDER BY hours_before DESC', variant: 'amber' },
  { label: 'أول hours >= hours_before', sub: 'first match wins', variant: 'teal' },
  { label: 'amount × pct / 100', sub: 'refund_amount', variant: 'green' },
];

const EXAMPLE_ROWS = [
  ['قبل 72 ساعة', '72 ≥ 48 ✔ (أول تطابق)', '100%', '200.00'],
  ['قبل 50 ساعة', '50 ≥ 48 ✔ (أول تطابق)', '100%', '200.00'],
  ['قبل 30 ساعة', '30 < 48 ✘ ثم 30 ≥ 24 ✔', '50%', '100.00'],
  ['قبل 12 ساعة', '12 < 48 ✘ ، 12 < 24 ✘ ، 12 ≥ 6 ✔', '25%', '50.00'],
  ['قبل 3 ساعات', 'لا تطابق مع أي عتبة', '0%', '0.00'],
  ['بعد وقت البدء', 'hours ≤ 0 — خروج مبكر', '0%', '0.00'],
];

export default function BookingPoliciesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Cancellation Policies' }]}
        eyebrow="Booking"
        title="Cancellation"
        highlight="Policies"
        subtitle="سياسات استرداد متدرّجة لكل مورد — كلما ألغى العميل أبكر، كان الاسترداد أعلى."
      />

      <DocsCallout type="info">
        السياسة سطر واحد بسيط: <strong>«إذا ألغيت قبل <code>hours_before</code> ساعة على الأقل، تسترد
        <code>refund_percentage</code>٪»</strong>. القوة تأتي من تجميع عدة أسطر لبناء أي سلّم استرداد.
      </DocsCallout>

      <DocsSectionTitle icon="bi-shield-check" variant="purple">Endpoint</DocsSectionTitle>

      <DocsEndpointCard
        method="POST"
        path="/api/booking/resources/{id}/policy"
        authTag="permission: resource.update"
        authTone="protected"
        description="ضبط سياسات الإلغاء (استبدال كامل)"
        defaultOpen
      >
        <DocsParamTable
          rows={[
            { field: 'policies', required: true, type: 'array', notes: 'min:1' },
            { field: 'policies.*.hours_before', required: true, type: 'integer', notes: 'min:0 — العتبة بالساعات قبل الموعد' },
            { field: 'policies.*.refund_percentage', required: true, type: 'integer', notes: 'between:0,100' },
            { field: 'policies.*.description', required: false, type: 'string', notes: 'max:255 — نص يُعرَض للعميل' },
          ]}
        />
        <DocsCallout type="warn">
          <strong>استبدال لا إضافة</strong> — تماماً كنوافذ التوفر: <code>setPolicies()</code> يحذف كل سياسات
          المورد ثم يُدرج المصفوفة المُرسَلة. أرسل السلّم كاملاً في كل مرة.
        </DocsCallout>
        <DocsCodeBlock
          language="json"
          label="request"
          code={`{
  "policies": [
    { "hours_before": 48, "refund_percentage": 100, "description": "استرداد كامل قبل يومين" },
    { "hours_before": 24, "refund_percentage": 50,  "description": "نصف المبلغ قبل يوم" },
    { "hours_before": 6,  "refund_percentage": 25,  "description": "ربع المبلغ قبل 6 ساعات" }
  ]
}`}
        />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "message": "Cancellation policy updated successfully.",
  "data": {
    "id": 12,
    "name": "Room 101",
    "cancellation_policies": [
      { "id": 31, "hours_before": 48, "refund_percentage": 100, "description": "استرداد كامل قبل يومين" },
      { "id": 32, "hours_before": 24, "refund_percentage": 50,  "description": "نصف المبلغ قبل يوم" },
      { "id": 33, "hours_before": 6,  "refund_percentage": 25,  "description": "ربع المبلغ قبل 6 ساعات" }
    ]
  }
}`} />
                  <DocsCallout type="tip">
                    الاستجابة دائماً مرتّبة تنازلياً بـ <code>hours_before</code> — العلاقة
                    <code>cancellationPolicies()</code> في الموديل تفرض <code>orderByDesc</code>. هذا ليس تجميلاً:
                    خوارزمية الاسترداد تعتمد على هذا الترتيب.
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'err',
              label: '❌ 422',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "The policies field is required." }
{ "message": "The policies.0.refund_percentage field must be between 0 and 100." }
{ "message": "Forbidden" }   // 403 — بلا صلاحية resource.update`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsSectionTitle icon="bi-cash-coin" variant="green">Refund Matching — First Match Wins</DocsSectionTitle>
      <DocsFlowDiagram steps={MATCH_FLOW} />
      <DocsCodeBlock
        language="text"
        label="CalculateRefundAction"
        code={`hours = now()->diffInHours(booking.start_at, false)

if (hours <= 0) return 0                         // الموعد بدأ أو مضى

foreach (policies as policy)                     // مرتّبة تنازلياً
    if (hours >= policy.hours_before)
        return booking.amount * policy.refund_percentage / 100

return 0                                          // لم تُستوفَ أي عتبة`}
      />

      <DocsSectionTitle icon="bi-table" variant="amber">مثال تطبيقي</DocsSectionTitle>
      <p className="docs-lead">
        مورد بسلّم <strong>48h→100%</strong> و <strong>24h→50%</strong> و <strong>6h→25%</strong>، وحجز بمبلغ
        <strong> 200.00</strong>:
      </p>
      <DocsTable
        headers={['وقت الإلغاء', 'المطابقة', 'النسبة', 'المسترد']}
        rows={EXAMPLE_ROWS}
      />
      <DocsCallout type="tip">
        <strong>لماذا الترتيب التنازلي إلزامي؟</strong> لأن الإلغاء قبل 72 ساعة يستوفي كل العتبات الثلاث. الترتيب
        التنازلي يضمن أن أول تطابق هو الأكثر سخاءً. لو كان الترتيب تصاعدياً لحصل من ألغى مبكراً على 25٪ فقط —
        عكس المقصود تماماً.
      </DocsCallout>
      <DocsCallout type="info">
        <strong>مورد بلا سياسات</strong> يعني صفر استرداد دائماً: الحلقة لا تجد ما يطابق فتُعيد 0. هذا هو السلوك
        الافتراضي الآمن — لا استرداد إلا بسياسة مُعلَنة.
      </DocsCallout>
      <DocsCallout type="warn">
        المبلغ المحسوب لا يُصرَف تلقائياً. الاسترداد الفعلي يُنفَّذ فقط إذا كان للحجز <code>payment_id</code> وكان
        المورد <code>paid</code> — وإلا يُخزَّن <code>refund_amount</code> في السجل بلا حركة مالية. التفاصيل في
        صفحة <Link to="/docs/booking/payments">Payments &amp; Refunds</Link>.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/policies" />
    </div>
  );
}

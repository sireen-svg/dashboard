import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsHeaderBox from '../../../components/docs/DocsHeaderBox';
import DocsTable from '../../../components/docs/DocsTable';
import DocsStepList from '../../../components/docs/DocsStepList';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const PAY_FLOW = [
  { label: 'Booking (pending)', sub: 'السجل مُنشأ', variant: 'amber' },
  { label: 'CMSApiClient', sub: 'chargeBooking()' },
  { label: 'CMS /payments/pay', sub: 'المحفظة / البوابة', variant: 'accent' },
  { label: 'payment_id', sub: 'يُخزَّن في الحجز', variant: 'teal' },
  { label: 'Booking (confirmed)', sub: 'مؤكد', variant: 'green' },
];

const REFUND_FLOW = [
  { label: 'Cancel request', sub: 'booking_id', variant: 'accent' },
  { label: 'CalculateRefund', sub: 'من السياسات', variant: 'amber' },
  { label: '4 بوابات', sub: 'كلها يجب أن تنجح', variant: 'red' },
  { label: 'CMS /payments/refund', sub: 'paymentId + amount' },
  { label: 'refund_amount', sub: 'يُخزَّن + cancelled', variant: 'green' },
];

const GUARD_STEPS = [
  { name: 'payment_id موجود؟', desc: 'حجز بلا دفع سابق لا شيء لاستردادّه — خروج صامت.', fail: '→ return; بلا نداء' },
  { name: 'المورد مدفوع؟', desc: <>مورد <code>free</code> لا يمرّ عليه استرداد أبداً حتى لو حمل <code>payment_id</code> قديماً.</>, fail: '→ return; بلا نداء' },
  { name: 'المبلغ أكبر من صفر؟', desc: 'الإلغاء المتأخر يُنتج 0 — فلا داعي لإزعاج بوابة الدفع.', fail: '→ return; بلا نداء' },
  { name: 'نداء CMS', desc: <><code>POST /api/payments/refund</code> مع <code>paymentId</code> و<code>amount</code>. أي فشل يرفع استثناء فيُتراجَع عن الـ Transaction وتبقى حالة الحجز كما كانت.</>, ok: '→ ثم تحديث الحالة إلى cancelled', tone: 'green' },
];

const MAPPING_ROWS = [
  [<code key="a">user_id</code>, <code key="b">userId</code>, 'من التوكن'],
  [<code key="c">user_name</code>, <code key="d">userName</code>, 'من Auth profile'],
  [<code key="e">project_id</code>, <code key="f">projectId</code>, 'من ResolveProject'],
  [<code key="g">amount</code>, <code key="h">amount</code>, 'المبلغ المُتحقَّق منه'],
  [<code key="i">currency</code>, <code key="j">currency</code>, 'مثال USD'],
  [<code key="k">gateway</code>, <code key="l">gateway</code>, 'stripe | paypal | wallet'],
  ['—', <code key="m">paymentType</code>, <>ثابت <code>&quot;full&quot;</code> — لا تقسيط للحجوزات</>],
  [<code key="n">token</code>, <code key="o">token</code>, 'توكن البوابة إن وُجد'],
];

export default function BookingPaymentsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Payments & Refunds' }]}
        eyebrow="Booking"
        title="Payments &"
        highlight="Refunds"
        subtitle="Booking لا تملك جدول دفعات ولا تتصل ببوابة دفع — تُفوِّض كل شيء إلى CMS Payment API."
      />

      <DocsCallout type="info">
        <strong>قرار معماري:</strong> المال يعيش في مكان واحد. المحفظة والدفعات والتقسيط والمعاملات كلها في CMS،
        وBooking تحتفظ بمؤشّر واحد فقط: <code>bookings.payment_id</code>. النتيجة أن العميل الذي حجز غرفة والعميل
        الذي اشترى منتجاً يظهران في نفس دفتر الحسابات — وهذا ما يجعل التقارير الموحّدة ممكنة أصلاً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-credit-card" variant="green">Charge Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={PAY_FLOW} />

      <DocsSectionTitle icon="bi-arrow-left-right" variant="blue">Outbound Call — chargeBooking</DocsSectionTitle>
      <DocsHeaderBox
        rows={[
          { key: 'Method', value: 'POST', note: '' },
          { key: 'URL', value: '{CMS_SERVICE_URL}/api/payments/pay', note: 'من config services.cms_service.url' },
          { key: 'X-Project-Id', value: 'يُمرَّر من الطلب الأصلي', note: 'HasProjectHeaders trait' },
          { key: 'Authorization', value: 'Bearer — نفس توكن المستخدم', note: 'انتشار الهوية عبر الخدمات' },
        ]}
      />
      <DocsCodeBlock
        language="json"
        label="request body → CMS"
        code={`{
  "userId":      42,
  "userName":    "Bshara",
  "projectId":   1,
  "amount":      45.00,
  "currency":    "USD",
  "gateway":     "wallet",
  "paymentType": "full",
  "token":       null
}`}
      />
      <DocsSectionTitle icon="bi-arrows-angle-contract" variant="teal">Field Mapping</DocsSectionTitle>
      <DocsTable headers={['Booking DTO', 'CMS payload', 'المصدر']} rows={MAPPING_ROWS} />
      <DocsCodeBlock language="json" label="response ← CMS" code={`{ "payment_id": 9021, "status": "succeeded" }
// يُقرأ payment_id فقط ويُخزَّن في bookings.payment_id`} />

      <DocsCallout type="warn">
        <strong>عند فشل الدفع</strong> يُحدَّث الحجز إلى <code>cancelled</code> ثم يُعاد رفع الاستثناء. ولأن كل ذلك
        داخل <code>DB::transaction()</code>، فإن التراجع يمسح سجل الحجز أصلاً — تحديث الحالة هو حماية احتياطية
        لا أكثر. النتيجة النهائية للعميل: لا حجز ولا خصم.
      </DocsCallout>

      <DocsSectionTitle icon="bi-cash-stack" variant="amber">Refund Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={REFUND_FLOW} />
      <DocsSectionTitle icon="bi-funnel" variant="red">ProcessRefundAction — 4 بوابات</DocsSectionTitle>
      <DocsStepList steps={GUARD_STEPS} />
      <DocsCodeBlock
        language="json"
        label="request body → CMS /api/payments/refund"
        code={`{ "paymentId": 9021, "amount": 22.50 }`}
      />
      <DocsCallout type="tip">
        <strong>الاسترداد الجزئي مدعوم أصلاً</strong> — الـ <code>amount</code> المُرسَل هو النسبة المحسوبة من
        السياسة، لا كامل المبلغ. سياسة 50٪ على حجز بـ 45.00 تُرسل 22.50 فقط.
      </DocsCallout>
      <DocsCallout type="info">
        <strong>حالتان يُخزَّن فيهما refund_amount بلا حركة مالية:</strong> المورد المجاني (لا دفع من الأصل)،
        والإلغاء المتأخر (النسبة 0). في الحالتين تُصبح الحالة <code>cancelled</code> ويكون
        <code>refund_amount</code> صفراً أو غير معنيّ — وهذا مقصود لأن التقارير تحتاج تمييز «ألغى ولم يسترد» عن
        «ألغى واسترد».
      </DocsCallout>

      <DocsSectionTitle icon="bi-shield-exclamation" variant="purple">اعتبارات الاعتمادية</DocsSectionTitle>
      <DocsCallout type="warn">
        النداءات المالية الصادرة (<code>chargeBooking</code> و<code>refundBooking</code>) تُنفَّذ عبر
        <code>Http::post</code> مباشرة من داخل الـ Action — أي أنها <strong>ليست</strong> ملفوفة بـ Circuit Breaker
        ولا بإعادة محاولة، بخلاف عمليات الموارد التي تمتد من الصنف <code>Action</code>. هذا مقصود جزئياً: إعادة
        محاولة عملية دفع بلا مفتاح تفريد (idempotency key) قد تُنتج خصماً مزدوجاً. الحل الصحيح هو مفتاح تفريد من
        جهة CMS ثم تفعيل إعادة المحاولة فوقه.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/payments" />
    </div>
  );
}

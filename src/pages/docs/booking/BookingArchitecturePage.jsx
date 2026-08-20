import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsStepList from '../../../components/docs/DocsStepList';
import DocsLayerStack from '../../../components/docs/DocsLayerStack';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const BUSINESS_FLOW = [
  { label: 'DataEntry (CMS)', sub: 'المحتوى', variant: 'accent' },
  { label: 'Resource', sub: 'capacity + price' },
  { label: 'Availability', sub: 'نوافذ أسبوعية', variant: 'teal' },
  { label: 'Slots', sub: 'مولّدة لحظياً', variant: 'amber' },
  { label: 'Booking', sub: 'pending', variant: 'amber' },
  { label: 'Payment (CMS)', sub: 'chargeBooking' },
  { label: 'Confirmed', sub: 'مؤكد', variant: 'green' },
];

const LAYERS = [
  { name: 'Http', chips: ['BookingController', 'ResourceController', 'BookingAnalyticsController'] },
  { name: 'Requests', chips: ['CreateBookingRequest', 'SetAvailabilityRequest', 'GetSlotsRequest', '+6 أخرى'] },
  { name: 'DTOs', chips: ['CreateBookingDTO', 'ResourceDTO', 'AvailabilityDTO', 'CancellationPolicyDTO', '+4 أخرى'] },
  { name: 'Services', chips: ['BookingService', 'ResourceService', 'SlotGeneratorService', 'BookingAnalyticsService'] },
  { name: 'Actions', chips: ['11 Client Action', '5 Resource Action', '3 Read Action', '5 Analytics Action'] },
  { name: 'Repositories', chips: ['Interface ← Eloquent', 'BookingRepository', 'ResourceRepository', 'PolicyRepository'] },
  { name: 'Cross-cutting', chips: ['Circuit Breaker', 'Retry ×3', 'Cache Tags', 'RabbitMQ Observer'] },
];

const CREATE_PIPELINE = [
  {
    name: 'Resource Guard',
    desc: <>يجلب المورد ويتحقق أنه موجود وأن <code>status === active</code>.</>,
    fail: '→ "Resource not found" | "Resource is inactive."',
  },
  {
    name: '✅ Price Integrity Check',
    desc: <>إذا كان <code>payment_type === paid</code> فيجب أن يساوي <code>amount</code> المُرسَل سعر المورد بالضبط. وإذا كان المورد مجانياً يُجبَر المبلغ على 0 — العميل لا يستطيع تحديد السعر بنفسه.</>,
    fail: '→ "Invalid booking amount"',
    tone: 'teal',
  },
  {
    name: 'Validate Time Range',
    desc: <><code>ValidateBookingTimeAction</code> — يرفض <code>start &gt;= end</code> ويرفض أي وقت في الماضي.</>,
    fail: '→ "Invalid time range" | "Cannot book past time"',
  },
  {
    name: 'Check Availability Window',
    desc: <><code>CheckAvailabilityAction</code> — يستخرج <code>dayOfWeek</code> من تاريخ البداية، يجلب نوافذ ذلك اليوم النشطة، ويتأكد أن وقت الحجز يقع كاملاً داخل إحداها.</>,
    fail: '→ "No availability for this day" | "Time out of times availability"',
  },
  {
    name: '✅ Conflict Check with lockForUpdate',
    desc: <><code>CheckBookingConflictAction</code> — يعدّ الحجوزات غير الملغاة المتقاطعة زمنياً (<code>start_at &lt; end AND end_at &gt; start</code>) تحت <code>lockForUpdate()</code>، ويرفض إذا وصل العدد إلى <code>capacity</code>.</>,
    fail: '→ "Slot is fully booked"',
    tone: 'teal',
  },
  {
    name: 'Create Booking Record',
    desc: <><code>CreateBookingRecordAction</code> — ينشئ السجل بحالة <code>pending</code>، ويُبطل كاش حجوزات المورد وكاش حجوزات المستخدم. الـ Observer ينشر <code>booking.booking.created</code>.</>,
  },
  {
    name: 'Process Payment',
    desc: <><code>ProcessBookingPaymentAction</code> — مورد مجاني ⇒ <code>confirmed</code> فوراً بلا دفع. مورد مدفوع ⇒ نداء <code>CMSApiClient::chargeBooking()</code>، وعند النجاح يُخزَّن <code>payment_id</code> وتصبح الحالة <code>confirmed</code>.</>,
    ok: '→ status: confirmed',
    fail: '→ status: cancelled ثم يُعاد رفع الاستثناء',
    tone: 'green',
  },
];

const CANCEL_PIPELINE = [
  {
    name: 'Fetch Booking (cached)',
    desc: <><code>GetBookingAction</code> — يقرأ من الكاش (TTL 300s) وإلا من قاعدة البيانات. غير موجود ⇒ استثناء.</>,
    fail: '→ "Booking not found"',
  },
  {
    name: '✅ Ownership Check',
    desc: <>مقارنة <code>booking.user_id</code> مع <code>dto.userId</code> المشتقّ من التوكن — لا يمكن إلغاء حجز شخص آخر.</>,
    fail: '→ "Unauthorized"',
    tone: 'teal',
  },
  {
    name: 'Validate Cancelable',
    desc: <><code>ValidateCancelableAction</code> — يرفض المُلغى مسبقاً، والمنتهي، وأي حجز بدأ وقته بالفعل.</>,
    fail: '→ "Already cancelled" | "Already completed" | "Cannot cancel past booking"',
  },
  {
    name: 'Calculate Refund',
    desc: <><code>CalculateRefundAction</code> — يحسب الساعات المتبقية، يمرّ على السياسات مرتّبة تنازلياً بـ <code>hours_before</code>، ويعيد أول تطابق كنسبة من المبلغ.</>,
  },
  {
    name: 'Process Refund via CMS',
    desc: <>يُنفَّذ فقط إذا كان هناك <code>payment_id</code> والمبلغ أكبر من صفر والمورد مدفوع — عبر <code>CMSApiClient::refundBooking()</code>.</>,
  },
  {
    name: 'Update Status',
    desc: <>الحالة ⇒ <code>cancelled</code> مع <code>refund_amount</code> و<code>cancellation_reason</code>، ثم إبطال ثلاثة مفاتيح كاش. الـ Observer ينشر <code>booking.booking.cancelled</code>.</>,
    ok: '→ RabbitMQ: booking.booking.cancelled',
    tone: 'green',
  },
];

const RESCHEDULE_PIPELINE = [
  { name: 'Fetch + Ownership', desc: 'نفس فحص الملكية المستخدم في الإلغاء.', fail: '→ "Unauthorized"' },
  {
    name: 'Status Gate',
    desc: <>الحجوزات بحالة <code>confirmed</code> فقط قابلة لإعادة الجدولة.</>,
    fail: '→ "Only confirmed bookings can be rescheduled"',
  },
  {
    name: 'Re-validate Time',
    desc: <>إعادة استخدام <code>ValidateBookingTimeAction</code> و<code>CheckAvailabilityAction</code> بالكامل — لا كود مكرّر بين الإنشاء وإعادة الجدولة.</>,
  },
  {
    name: '✅ Conflict Check — ignoring itself',
    desc: <>يُمرَّر معرّف الحجز كـ <code>ignoreBookingId</code> فلا يُحسَب الحجز تعارضاً مع نفسه. هذه هي الحالة الحدّية التي تكسر معظم أنظمة الحجز.</>,
    tone: 'teal',
  },
  {
    name: 'Update Time',
    desc: <>تحديث <code>start_at</code> و<code>end_at</code> وإبطال الكاش. الـ Observer يرصد أن <code>start_at</code> صار dirty وينشر <code>booking.booking.rescheduled</code> مع الموعد القديم والجديد معاً.</>,
    ok: '→ RabbitMQ: booking.booking.rescheduled',
    tone: 'green',
  },
];

const INTEGRATION = `Booking Service
  │
  ├── ResolveProject        → GET  CMS   /api/projects/resolve     (X-Project-Id)
  ├── AuthUserMiddleware    → GET  Auth  /api/my-profile           (Bearer token)
  ├── ProcessBookingPayment → POST CMS   /api/payments/pay
  ├── ProcessRefund         → POST CMS   /api/payments/refund
  └── BookingObserver       → RabbitMQ exchange "microservices" (topic, durable)
                                booking.booking.created
                                booking.booking.cancelled
                                booking.booking.rescheduled`;

export default function BookingArchitecturePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Architecture & Flows' }]}
        eyebrow="Booking"
        title="Architecture &"
        highlight="Flows"
        subtitle="من DataEntry إلى حجز مؤكد — والثلاث عمليات الحرجة: الإنشاء، الإلغاء، وإعادة الجدولة."
      />

      <DocsSectionTitle icon="bi-arrow-repeat" variant="blue">Complete Business Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={BUSINESS_FLOW} />

      <DocsSectionTitle icon="bi-layers" variant="teal">Layered Architecture</DocsSectionTitle>
      <DocsLayerStack layers={LAYERS} />
      <DocsCallout type="info">
        <strong>CQRS:</strong> مسار القراءة معزول في <code>Domains/Booking/Read/</code> (Actions و DTOs خاصة به)
        بينما الكتابة في <code>Domains/Booking/Actions/</code>. كل Action يمثّل Use Case واحداً قابلاً للاختبار
        بمعزل عن غيره.
      </DocsCallout>

      <DocsSectionTitle icon="bi-plus-circle" variant="green">Create Booking — 7 Steps</DocsSectionTitle>
      <DocsStepList steps={CREATE_PIPELINE} />
      <DocsCallout type="tip">
        كل الخطوات داخل <code>DB::transaction()</code> واحدة. لو فشل الدفع في الخطوة 7 يُتراجَع عن سجل الحجز
        بالكامل — لا حجوزات معلّقة بلا دفع.
      </DocsCallout>
      <DocsCallout type="warn">
        <strong>الترتيب مقصود:</strong> فحص التعارض يسبق الدفع. لو انعكس الترتيب لأصبح ممكناً أن يُخصم المبلغ ثم
        يُكتشف أن الوقت محجوز — وهذا أسوأ فشل يمكن لنظام حجز أن يقع فيه.
      </DocsCallout>

      <DocsSectionTitle icon="bi-x-circle" variant="red">Cancel Booking — 6 Steps</DocsSectionTitle>
      <DocsStepList steps={CANCEL_PIPELINE} />

      <DocsSectionTitle icon="bi-arrow-left-right" variant="amber">Reschedule Booking — 5 Steps</DocsSectionTitle>
      <DocsStepList steps={RESCHEDULE_PIPELINE} />

      <DocsSectionTitle icon="bi-diagram-2" variant="purple">Cross-Service Integration</DocsSectionTitle>
      <DocsCodeBlock language="text" label="outbound calls" code={INTEGRATION} />
      <DocsCallout type="info">
        <strong>HasProjectHeaders trait:</strong> كل نداء صادر إلى CMS يمرّر <code>X-Project-Id</code> و
        <code>Authorization: Bearer</code> من الطلب الأصلي — فتنتقل هوية المستخدم وسياق المشروع عبر الخدمات
        دون تخزين أي حالة.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/architecture" />
    </div>
  );
}

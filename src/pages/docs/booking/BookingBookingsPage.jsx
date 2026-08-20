import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsTable from '../../../components/docs/DocsTable';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const LIFECYCLE = [
  { label: 'pending', sub: 'بانتظار الدفع', variant: 'amber' },
  { label: 'confirmed', sub: 'مدفوع أو مجاني', variant: 'green' },
  { label: 'completed', sub: 'انتهى', variant: 'teal' },
];

const TERMINAL = [
  { label: 'cancelled', sub: 'ملغى + refund_amount', variant: 'red' },
  { label: 'no_show', sub: 'لم يحضر', variant: 'red' },
];

const TRANSITION_ROWS = [
  ['pending', 'confirmed', 'نجاح الدفع في ProcessBookingPaymentAction'],
  ['pending', 'cancelled', 'فشل الدفع (تلقائي) أو إلغاء العميل'],
  ['confirmed', 'cancelled', 'إلغاء العميل — مع حساب الاسترداد'],
  ['confirmed', 'confirmed', 'إعادة جدولة — الحالة لا تتغيّر، الوقت فقط'],
  ['cancelled', '—', 'حالة نهائية — لا إلغاء ولا إعادة جدولة'],
  ['completed', '—', 'حالة نهائية'],
];

const ERROR_ROWS = [
  [<code key="a">Resource not found</code>, 'المعرّف غير موجود أو محذوف'],
  [<code key="b">Resource is inactive.</code>, 'المورد بحالة inactive'],
  [<code key="c">Invalid booking amount</code>, 'المبلغ المُرسَل لا يساوي سعر المورد المدفوع'],
  [<code key="d">Invalid time range</code>, 'start_at ≥ end_at'],
  [<code key="e">Cannot book past time</code>, 'وقت البداية في الماضي'],
  [<code key="f">No availability for this day</code>, 'لا نافذة توفر نشطة لذلك اليوم من الأسبوع'],
  [<code key="g">Time out of times availability</code>, 'الوقت لا يقع داخل أي نافذة توفر'],
  [<code key="h">Slot is fully booked</code>, 'عدد الحجوزات المتقاطعة وصل إلى capacity'],
  [<code key="i">Payment failed: …</code>, 'CMS Payment API رفض العملية — الحجز يُصبح cancelled'],
];

export default function BookingBookingsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Bookings API' }]}
        eyebrow="Booking"
        title="Bookings"
        highlight="API"
        subtitle="العمليات الثلاث التي يستخدمها العميل — الحجز، الإلغاء، إعادة الجدولة — كل واحدة داخل Transaction واحدة."
      />

      <DocsSectionTitle icon="bi-flag" variant="green">Booking Lifecycle</DocsSectionTitle>
      <DocsFlowDiagram steps={LIFECYCLE} />
      <DocsFlowDiagram steps={TERMINAL} />
      <DocsTable headers={['من', 'إلى', 'المُحرِّك']} rows={TRANSITION_ROWS} />

      <DocsSectionTitle icon="bi-calendar-plus" variant="blue">Endpoints</DocsSectionTitle>

      {/* ── CREATE ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/create"
        authTag="throttle:api.heavy"
        authTone="protected"
        description="إنشاء حجز جديد"
        defaultOpen
      >
        <DocsParamTable
          rows={[
            { field: 'resource_id', required: true, type: 'integer', notes: 'exists:resources,id' },
            { field: 'start_at', required: true, type: 'datetime', notes: 'أي صيغة يقبلها Carbon — مثال 2026-09-14 10:00:00' },
            { field: 'end_at', required: true, type: 'datetime', notes: 'after:start_at' },
            { field: 'amount', required: true, type: 'numeric', notes: 'min:0 — يجب أن يساوي سعر المورد إذا كان paid' },
            { field: 'currency', required: true, type: 'string', notes: 'مثال USD' },
            { field: 'gateway', required: true, type: 'string', notes: 'stripe | paypal | wallet — يُمرَّر كما هو إلى CMS' },
            { field: 'token', required: false, type: 'string', notes: 'توكن بوابة الدفع عند الحاجة' },
          ]}
        />
        <DocsCodeBlock
          language="json"
          label="request"
          code={`{
  "resource_id": 12,
  "start_at":    "2026-09-14 10:00:00",
  "end_at":      "2026-09-14 11:00:00",
  "amount":      45.00,
  "currency":    "USD",
  "gateway":     "wallet",
  "token":       null
}`}
        />
        <DocsCallout type="tip">
          <strong>حجز مجاني:</strong> لا تشغل نفسك بالسعر — إذا كان المورد <code>free</code> يُجبَر
          <code>amount</code> على 0 وتُتخطّى خطوة الدفع كلياً، ويعود الحجز <code>confirmed</code> مباشرة و
          <code>payment_id: null</code>. الحقول <code>amount</code> و<code>currency</code> و<code>gateway</code> ما
          تزال مطلوبة في التحقق شكلياً.
        </DocsCallout>
        <DocsResponseTabs
          tabs={[
            {
              key: 'paid',
              label: '✅ مورد مدفوع',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "data": {
    "id":          701,
    "resource_id": 12,
    "user_id":     42,
    "project_id":  1,
    "payment_id":  9021,
    "start_at":    "2026-09-14T10:00:00.000000Z",
    "end_at":      "2026-09-14T11:00:00.000000Z",
    "status":      "confirmed",
    "amount":      45.0,
    "currency":    "USD"
  }
}`} />,
            },
            {
              key: 'free',
              label: '✅ مورد مجاني',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "data": {
    "id":          702,
    "resource_id": 15,
    "payment_id":  null,
    "status":      "confirmed",
    "amount":      0,
    "currency":    "USD"
  }
}`} />,
            },
            {
              key: 'err',
              label: '❌ Errors',
              tone: 'error',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{ "message": "Slot is fully booked" }
{ "message": "Invalid booking amount" }
{ "message": "Time out of times availability" }
{ "message": "The end at field must be a date after start at." }   // 422 — من FormRequest`} />
                  <DocsCallout type="warn">
                    استثناءات منطق العمل ترتفع كـ <code>\Exception</code> عامة من <code>BookingService</code> ولا
                    يلتقطها الـ Controller في مسار الإنشاء — أي أن الاستجابة تكون <strong>500</strong> لا 422.
                    استثناءات <code>FormRequest</code> وحدها تعود 422. توحيد هذه المعالجة تحسين مُخطَّط.
                  </DocsCallout>
                </>
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── CANCEL ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/cancel"
        authTag="throttle:api.heavy"
        authTone="protected"
        description="إلغاء حجز مع حساب الاسترداد"
      >
        <DocsParamTable rows={[{ field: 'booking_id', required: true, type: 'integer', notes: 'exists:bookings,id' }]} />
        <DocsCallout type="info">
          لا يُرسَل <code>user_id</code> — يُستخرَج من التوكن داخل <code>CancelBookingDTO::fromRequest()</code> ثم
          يُقارَن بمالك الحجز. هذا هو الحصن ضد <strong>IDOR</strong>: تمرير معرّف حجز شخص آخر يُرفَض.
        </DocsCallout>
        <DocsCodeBlock language="json" label="request" code={`{ "booking_id": 701 }`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "data": {
    "id":                  701,
    "status":              "cancelled",
    "refund_amount":       22.5,
    "cancellation_reason": "Cancelled by user",
    "amount":              45.0,
    "currency":            "USD"
  }
}`} />,
            },
            {
              key: 'err',
              label: '❌ Errors',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Unauthorized" }                 // الحجز ليس للمستخدم الحالي
{ "message": "Already cancelled" }
{ "message": "Already completed" }
{ "message": "Cannot cancel past booking" }    // وقت البداية مضى
{ "message": "Booking not found" }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── RESCHEDULE ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/reschedule"
        authTag="throttle:api.heavy"
        authTone="protected"
        description="نقل الحجز إلى وقت آخر"
      >
        <DocsParamTable
          rows={[
            { field: 'booking_id', required: true, type: 'integer', notes: 'exists:bookings,id' },
            { field: 'start_at', required: true, type: 'datetime', notes: 'الموعد الجديد' },
            { field: 'end_at', required: true, type: 'datetime', notes: 'after:start_at' },
          ]}
        />
        <DocsCallout type="tip">
          <strong>الحالة الحدّية المهمة:</strong> فحص التعارض يستقبل معرّف الحجز نفسه كـ
          <code>ignoreBookingId</code>، فلا يُحسَب الحجز تعارضاً مع نفسه. بدون ذلك كان أي مورد بسعة 1 سيرفض تحريك
          حجزه بمقدار عشر دقائق داخل نفس النافذة.
        </DocsCallout>
        <DocsCodeBlock language="json" label="request" code={`{
  "booking_id": 701,
  "start_at":   "2026-09-15 14:00:00",
  "end_at":     "2026-09-15 15:00:00"
}`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "data": {
    "id":       701,
    "status":   "confirmed",
    "start_at": "2026-09-15T14:00:00.000000Z",
    "end_at":   "2026-09-15T15:00:00.000000Z"
  }
}`} />
                  <DocsCallout type="info">
                    لا مسّ للمال: <code>amount</code> و<code>payment_id</code> يبقيان كما هما. إعادة الجدولة نقلٌ
                    زمني لا معاملة مالية.
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'err',
              label: '❌ Errors',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Only confirmed bookings can be rescheduled" }
{ "message": "Unauthorized" }
{ "message": "Slot is fully booked" }
{ "message": "Cannot book past time" }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── LIST RESOURCE BOOKINGS ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/resources/{id}/bookings"
        authTag="permission: resource.viewBookings"
        authTone="protected"
        description="حجوزات مورد محدد — Admin"
      >
        <DocsParamTable
          rows={[
            { field: 'status', required: false, type: 'string', notes: 'in:pending,confirmed,cancelled,completed,no_show' },
            { field: 'from', required: false, type: 'string', notes: 'date_format:Y-m-d — فلترة على start_at' },
            { field: 'to', required: false, type: 'string', notes: 'date_format:Y-m-d | after_or_equal:from' },
          ]}
        />
        <DocsCodeBlock language="json" label="request" code={`{ "status": "confirmed", "from": "2026-09-01", "to": "2026-09-30" }`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "data": [
    {
      "id": 701, "user_id": 42, "status": "confirmed",
      "start_at": "2026-09-14T10:00:00.000000Z",
      "end_at":   "2026-09-14T11:00:00.000000Z",
      "amount": 45.0, "currency": "USD",
      "resource": { "id": 12, "name": "Room 101", "type": "room", "capacity": 2 }
    }
  ]
}`} />
                  <DocsCallout type="info">
                    مُرتَّب تصاعدياً بـ <code>start_at</code>. الكاش يستخدم
                    <code>Cache::tags(["resource_&#123;id&#125;_bookings"])</code> مع
                    <code>md5</code> للفلاتر ومدة <code>TTL_SHORT</code> = 300s — فأي حجز أو إلغاء أو إعادة جدولة
                    يُفرِّغ الوسم كاملاً بغضّ النظر عن تركيبة الفلاتر المُخزَّنة.
                  </DocsCallout>
                </>
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsSectionTitle icon="bi-exclamation-triangle" variant="red">Business Errors — مرجع كامل</DocsSectionTitle>
      <DocsTable headers={['الرسالة', 'السبب']} rows={ERROR_ROWS} />

      <DocsCallout type="warn">
        <strong>ملاحظة على التسجيل:</strong> مسارات <code>/create</code> و<code>/cancel</code> و
        <code>/reschedule</code> مُسجَّلة في <code>routes/api.php</code> خارج مجموعة
        <code>prefix(&apos;booking&apos;)</code> وبدون <code>resolve.project</code> أو <code>auth.user</code>. فعلياً
        تُخدَم على <code>/api/create</code> بينما يناديها الداشبورد على <code>/api/booking/create</code>، ولذلك
        يعتمد <code>CreateBookingDTO</code> على قيمة احتياطية <code>project_id ?? 1</code> وترفع الـ DTOs
        <code>Unauthenticated</code> بنفسها لغياب الـ middleware. إلحاق هذه المسارات بالمجموعة المحمية هو
        الإصلاح المطلوب.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/bookings" />
    </div>
  );
}

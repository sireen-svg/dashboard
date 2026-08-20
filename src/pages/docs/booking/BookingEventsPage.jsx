import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsTable from '../../../components/docs/DocsTable';
import DocsHeaderBox from '../../../components/docs/DocsHeaderBox';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const EVENT_FLOW = [
  { label: 'Booking model', sub: 'created / updated', variant: 'accent' },
  { label: 'BookingObserver', sub: 'isDirty() checks', variant: 'amber' },
  { label: 'RabbitMQPublisher', sub: 'topic exchange' },
  { label: 'microservices', sub: 'durable exchange', variant: 'teal' },
  { label: 'Notification / Logging', sub: 'مستهلكون', variant: 'green' },
];

const EVENT_ROWS = [
  [
    <code key="a">booking.booking.created</code>,
    <>hook <code>created</code></>,
    <><code>CreateBookingRecordAction</code></>,
    'دائماً بحالة pending',
  ],
  [
    <code key="b">booking.booking.cancelled</code>,
    <><code>isDirty(&apos;status&apos;)</code> و status = cancelled</>,
    <><code>UpdateBookingStatusAction</code></>,
    'يحمل سبب الإلغاء والمبلغ المسترد',
  ],
  [
    <code key="c">booking.booking.rescheduled</code>,
    <><code>isDirty(&apos;start_at&apos;)</code> أو <code>isDirty(&apos;end_at&apos;)</code></>,
    <><code>UpdateBookingTimeAction</code></>,
    'يحمل الموعد القديم والجديد معاً',
  ],
];

const EXCHANGE_ROWS = [
  ['Exchange', 'microservices'],
  ['Type', 'topic'],
  ['Durable', 'true — يبقى بعد إعادة تشغيل RabbitMQ'],
  ['Auto-delete', 'false'],
  ['Delivery mode', 'PERSISTENT — الرسالة تُكتب على القرص'],
  ['Content type', 'application/json'],
  ['Routing key pattern', 'booking.booking.{event}'],
];

export default function BookingEventsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Events & Notifications' }]}
        eyebrow="Booking"
        title="Events &"
        highlight="Notifications"
        subtitle="ثلاثة أحداث تُنشَر على RabbitMQ من Observer واحد — الإشعارات والسجلات تحدث بعيداً عن مسار الطلب."
      />

      <DocsCallout type="info">
        <strong>لا كود إشعارات داخل منطق الحجز.</strong> <code>BookingService</code> لا يعرف أن الإشعارات موجودة.
        الـ Observer يستمع لتغيّرات الموديل وينشر الحدث، وخدمة Notification تستهلكه وترسل البريد. إضافة قناة
        جديدة (SMS، Push) لا تلمس خدمة Booking إطلاقاً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-broadcast" variant="blue">Publication Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={EVENT_FLOW} />

      <DocsSectionTitle icon="bi-list-ul" variant="teal">Events — 3 أحداث</DocsSectionTitle>
      <DocsTable headers={['Routing Key', 'الشرط', 'المصدر', 'ملاحظة']} rows={EVENT_ROWS} />

      <DocsCallout type="tip">
        <strong>كيف يُميَّز الإلغاء من إعادة الجدولة؟</strong> كلاهما يمرّ من نفس الـ hook (<code>updated</code>).
        الـ Observer يفحص أولاً هل تغيّرت <code>status</code> إلى <code>cancelled</code> — وإن نعم ينشر الإلغاء
        و<strong>يخرج فوراً</strong> بـ <code>return</code>، لأن الحدثين متضادّان منطقياً. وإلا يفحص هل تغيّر
        <code>start_at</code> أو <code>end_at</code> فينشر إعادة الجدولة.
      </DocsCallout>

      <DocsSectionTitle icon="bi-braces" variant="green">Payloads</DocsSectionTitle>

      <DocsCodeBlock
        language="json"
        label="booking.booking.created"
        dotColor="var(--fb-green)"
        code={`{
  "user_id":     "42",
  "booking_id":  701,
  "resource_id": 12,
  "start_at":    "2026-09-14T10:00:00+00:00",
  "end_at":      "2026-09-14T11:00:00+00:00",
  "amount":      45.0,
  "currency":    "USD",
  "status":      "pending",
  "_meta": {
    "source":       "booking-service",
    "event":        "booking.booking.created",
    "published_at": "2026-09-01T12:30:00+00:00"
  }
}`}
      />

      <DocsCodeBlock
        language="json"
        label="booking.booking.cancelled"
        dotColor="var(--fb-red)"
        code={`{
  "user_id":             "42",
  "booking_id":          701,
  "resource_id":         12,
  "start_at":            "2026-09-14T10:00:00+00:00",
  "end_at":              "2026-09-14T11:00:00+00:00",
  "cancellation_reason": "Cancelled by user",
  "refund_amount":       22.5,
  "currency":            "USD",
  "_meta": { "source": "booking-service", "event": "booking.booking.cancelled", "published_at": "..." }
}`}
      />

      <DocsCodeBlock
        language="json"
        label="booking.booking.rescheduled"
        dotColor="var(--fb-yellow)"
        code={`{
  "user_id":      "42",
  "booking_id":   701,
  "resource_id":  12,
  "old_start_at": "2026-09-14 10:00:00",
  "old_end_at":   "2026-09-14 11:00:00",
  "new_start_at": "2026-09-15T14:00:00+00:00",
  "new_end_at":   "2026-09-15T15:00:00+00:00",
  "amount":       45.0,
  "currency":     "USD",
  "_meta": { "source": "booking-service", "event": "booking.booking.rescheduled", "published_at": "..." }
}`}
      />
      <DocsCallout type="tip">
        <code>old_start_at</code> و<code>old_end_at</code> يأتيان من <code>getOriginal()</code> — أي القيمة قبل
        التحديث. بذلك يستطيع الإشعار أن يقول للعميل &laquo;نُقل موعدك من الاثنين 10:00 إلى الثلاثاء
        14:00&raquo; بدل &laquo;تم تعديل حجزك&raquo; المبتورة.
      </DocsCallout>

      <DocsSectionTitle icon="bi-hdd-network" variant="purple">Exchange Configuration</DocsSectionTitle>
      <DocsTable headers={['الإعداد', 'القيمة']} rows={EXCHANGE_ROWS} />
      <DocsHeaderBox
        rows={[
          { key: 'host', value: 'config queue.connections.rabbitmq.host', note: 'خدمة rabbitmq في شبكة core' },
          { key: 'port', value: '5672', note: 'لوحة الإدارة على 15672' },
          { key: 'user / pass', value: 'appuser / apppass', note: 'من docker-compose.core.yml' },
        ]}
      />
      <DocsCallout type="info">
        <code>exchange_declare</code> يُنفَّذ قبل كل نشر بـ <code>passive: false</code> — عملية idempotent تضمن وجود
        الـ Exchange دون الاعتماد على ترتيب تشغيل الخدمات.
      </DocsCallout>

      <DocsSectionTitle icon="bi-shield-check" variant="amber">Failure Isolation</DocsSectionTitle>
      <DocsCodeBlock
        language="text"
        label="RabbitMQPublisher::publish()"
        code={`try {
    connect → declare exchange → publish → Log::info
} catch (\\Exception $e) {
    Log::error('[RabbitMQPublisher] Failed to publish', [...])
    // لا rethrow — فشل النشر لا يُسقط العملية الأصلية
} finally {
    channel?->close();  connection?->close();
}`}
      />
      <DocsCallout type="tip">
        <strong>الإشعار ليس جزءاً من العقد.</strong> لو كان RabbitMQ متوقفاً فسيُسجَّل الخطأ ويكتمل الحجز بنجاح.
        العميل يحصل على حجزه ولا يحصل على بريده — وهذه هي المقايضة الصحيحة. والاتصال يُغلَق في
        <code>finally</code> فلا تتسرّب اتصالات مفتوحة عند الفشل.
      </DocsCallout>
      <DocsCallout type="warn">
        الـ Publisher مُسجَّل كـ <strong>singleton</strong> في الحاوية لتجنّب إنشاء كائن جديد لكل Observer، لكن
        دالة <code>publish()</code> تفتح اتصال AMQP جديداً وتغلقه في كل نداء. الاتصال الدائم المُعاد استخدامه
        تحسين أداء مُخطَّط.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/events" />
    </div>
  );
}

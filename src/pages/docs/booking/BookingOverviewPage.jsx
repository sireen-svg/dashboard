import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsStatsRow from '../../../components/DocsStatsRow';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsCardGrid from '../../../components/docs/DocsCardGrid';
import DocsTable from '../../../components/docs/DocsTable';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const STATS = [
  { value: '5', label: 'Booking Statuses' },
  { value: '5', label: 'Pipeline Steps' },
  { value: '4', label: 'DB Tables' },
  { value: '5', label: 'Analytics Reports' },
  { value: '3', label: 'RabbitMQ Events' },
  { value: '68', label: 'Tests' },
];

const ENTITIES = [
  {
    title: 'Resources',
    body: 'أي شيء قابل للحجز — غرفة، ملعب، مقعد، طبيب. مرتبط بـ DataEntry في CMS عبر data_entry_id.',
    icon: 'bi-box-seam', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)',
    to: '/docs/booking/resources',
  },
  {
    title: 'Availability & Slots',
    body: 'نوافذ توفر أسبوعية (0=Sunday…6=Saturday) + مولّد Slots يحسب المتاح مقابل السعة.',
    icon: 'bi-calendar-week', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)',
    to: '/docs/booking/availability',
  },
  {
    title: 'Cancellation Policies',
    body: 'سياسات متدرّجة: كل سياسة = hours_before + refund_percentage. تُرتَّب تنازلياً ويُطبَّق أول تطابق.',
    icon: 'bi-shield-check', bg: 'var(--fb-purple-bg)', fg: 'var(--fb-purple)',
    to: '/docs/booking/policies',
  },
  {
    title: 'Bookings',
    body: 'إنشاء / إلغاء / إعادة جدولة — كل عملية داخل DB Transaction واحدة بخطوات تحقّق متسلسلة.',
    icon: 'bi-calendar-check', bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)',
    to: '/docs/booking/bookings',
  },
  {
    title: 'Payments & Refunds',
    body: 'الدفع والاسترداد لا يحدثان هنا — يُفوَّضان إلى CMS Payment API عبر CMSApiClient.',
    icon: 'bi-wallet2', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)',
    to: '/docs/booking/payments',
  },
  {
    title: 'Analytics',
    body: '5 تقارير: Overview، Trend، Resource Performance مع Occupancy Rate، Cancellations، Peak Times.',
    icon: 'bi-bar-chart', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)',
    to: '/docs/booking/analytics',
  },
];

const STATUS_ROWS = [
  ['pending', 'بانتظار الدفع — الحالة الافتراضية عند الإنشاء', 'يُحتسَب في الـ conflict وفي الـ slot booked_count'],
  ['confirmed', 'مؤكد — بعد نجاح الدفع أو إذا كان المورد مجانياً', 'الحالة الوحيدة القابلة لإعادة الجدولة'],
  ['cancelled', 'ملغى — يُخزَّن refund_amount + cancellation_reason', 'مستثنى من الـ conflict والتقارير المالية'],
  ['completed', 'انتهى الحجز', 'يدخل في completion_rate'],
  ['no_show', 'لم يحضر العميل', 'يدخل في no_show_rate و revenue_lost'],
];

export default function BookingOverviewPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="Booking Service"
        title="Booking"
        highlight="Module"
        subtitle="خدمة حجز وجدولة مستقلة — موارد قابلة للحجز، نوافذ توفر أسبوعية، توليد Slots، منع التعارض بقفل على مستوى الصفوف، سياسات إلغاء متدرّجة، ودفع مُفوَّض إلى CMS."
      />

      <DocsStatsRow stats={STATS} />

      <DocsCallout type="info">
        <strong>خدمة مستقلة تماماً:</strong> Booking عندها قاعدة بيانات خاصة (<code>booking_service</code>) و Redis
        خاص و Nginx أمام نسختين من التطبيق. لا تشارك أي جدول مع باقي الخدمات — كل تكامل يمر عبر HTTP APIs.
      </DocsCallout>

      <DocsCallout type="info">
        <strong>CMS كطبقة محتوى:</strong> الـ Resource ليس المحتوى نفسه — هو <em>القدرة على الحجز</em> المُلحقة
        بمحتوى موجود في CMS. حقل <code>data_entry_id</code> يربط المورد بـ DataEntry (مثلاً entry اسمه
        &quot;Room 101&quot;)، فتبقى الصور والوصف والترجمات في CMS، ويبقى هنا فقط ما يخص الجدولة.
      </DocsCallout>

      <DocsSectionTitle icon="bi-grid-1x2" variant="blue">Core Concepts</DocsSectionTitle>
      <DocsCardGrid items={ENTITIES} columns={3} />

      <DocsSectionTitle icon="bi-flag" variant="green">Booking Statuses — 5 حالات</DocsSectionTitle>
      <DocsTable headers={['Status', 'المعنى', 'الأثر']} rows={STATUS_ROWS} />

      <DocsSectionTitle icon="bi-shield-lock" variant="amber">Middleware Chain</DocsSectionTitle>
      <DocsTable
        headers={['Middleware', 'الوظيفة']}
        rows={[
          [<code key="1">resolve.project</code>, 'يقرأ هيدر X-Project-Id ويستدعي CMS ‏/api/projects/resolve — ثم يحقن project_id و project في الطلب. غيابه ⇒ 400'],
          [<code key="2">auth.user</code>, 'يأخذ الـ Bearer token ويجلب المستخدم من Auth Service ‏/api/my-profile — يحقنه في request->attributes[\'auth_user\'] مع صلاحياته'],
          [<code key="3">permission:*</code>, 'يتحقق من صلاحية محددة (resource.create / update / delete / viewBookings)'],
          [<code key="4">throttle:api.standard</code>, '60 طلب/دقيقة — للقراءة'],
          [<code key="5">throttle:api.heavy</code>, '15 طلب/دقيقة — للكتابة والدفع'],
        ]}
      />

      <DocsCallout type="tip">
        <strong>لماذا لا يُتحقَّق من الـ JWT محلياً هنا؟</strong> Booking تستدعي Auth Service للتحقق. الـ JWKS
        المتاح في Auth (<code>/.well-known/jwks.json</code>) يسمح بالتحقق محلياً دون نداء شبكي — تحسين مُخطَّط
        يُلغي هذه الرحلة من كل طلب.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking" />
    </div>
  );
}

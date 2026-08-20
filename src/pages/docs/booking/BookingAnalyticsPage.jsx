import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsTable from '../../../components/docs/DocsTable';
import DocsCardGrid from '../../../components/docs/DocsCardGrid';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const REPORTS = [
  { title: 'Overview', body: 'إجماليات الحجوزات والإيراد + توزيع على 5 حالات + 3 معدلات محسوبة + ملخص الموارد.', icon: 'bi-speedometer2', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  { title: 'Trend', body: 'سلسلة زمنية بالعدد والإيراد ومتوسط القيمة — تجميع يومي أو أسبوعي أو شهري.', icon: 'bi-graph-up', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)' },
  { title: 'Resource Performance', body: 'صف لكل مورد مع Occupancy Rate الحقيقي — الساعات المحجوزة مقابل المتاحة.', icon: 'bi-bar-chart-line', bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)' },
  { title: 'Cancellations', body: 'ملخص الإلغاءات + تقرير no_show مع الإيراد المفقود + توزيع على الموارد + اتجاه زمني.', icon: 'bi-x-circle', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)' },
  { title: 'Peak Times', body: 'أكثر الأيام والساعات والأشهر حجزاً + متوسط زمن الحجز المسبق لكل مورد.', icon: 'bi-clock-history', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)' },
];

const METRIC_ROWS = [
  [<code key="a">cancellation_rate</code>, 'cancelled / total × 100', 'نسبة الإلغاء'],
  [<code key="b">no_show_rate</code>, 'no_show / total × 100', 'نسبة عدم الحضور'],
  [<code key="c">completion_rate</code>, 'completed / total × 100', 'نسبة الإتمام'],
  [<code key="d">occupancy_rate</code>, 'booked_hours / (daily_hours × days × capacity) × 100', 'نسبة الإشغال الحقيقية'],
  [<code key="e">refund_rate</code>, 'total_refunded / total_amount_cancelled × 100', 'كم من المُلغى استُرد فعلاً'],
  [<code key="f">avg_lead_time_hours</code>, 'AVG(start_at − created_at)', 'كم يحجز العميل مسبقاً'],
];

export default function BookingAnalyticsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Analytics' }]}
        eyebrow="Booking"
        title="Analytics"
        highlight="API"
        subtitle="5 تقارير تُبنى بـ SQL تجميعي مباشر — لا تحميل للسجلات في الذاكرة، ونداء واحد يعيدها كلها."
      />

      <DocsSectionTitle icon="bi-clipboard-data" variant="blue">التقارير الخمسة</DocsSectionTitle>
      <DocsCardGrid items={REPORTS} columns={3} />

      <DocsSectionTitle icon="bi-plug" variant="teal">Endpoint</DocsSectionTitle>

      <DocsEndpointCard
        method="GET"
        path="/api/analytics/overview"
        authTag="Aggregate — كل التقارير"
        authTone="service"
        description="نداء واحد يُعيد التقارير الخمسة"
        defaultOpen
      >
        <DocsParamTable
          rows={[
            { field: 'project_id', required: true, type: 'integer', notes: 'المشروع المطلوب — يُقرأ من الـ query string' },
            { field: 'from', required: false, type: 'string', notes: 'Y-m-d — default: قبل شهر من اليوم' },
            { field: 'to', required: false, type: 'string', notes: 'Y-m-d — default: اليوم' },
            { field: 'period', required: false, type: 'string', notes: 'daily | weekly | monthly — أي قيمة أخرى تُصحَّح إلى daily' },
            { field: 'limit', required: false, type: 'integer', notes: 'default 10 — يحدّ صفوف avg_lead_time' },
          ]}
        />
        <DocsCallout type="tip">
          <strong>Aggregate endpoint مقصود:</strong> الـ Controller يبني <code>AnalyticsFilterDTO</code> مرة واحدة
          ويستدعي الخدمات الخمس بنفسه، فتحصل لوحة التحكم على كل ما تحتاجه في رحلة شبكية واحدة بدل خمس.
        </DocsCallout>
        <DocsCodeBlock
          language="text"
          label="request"
          code={`GET /api/analytics/overview?project_id=1&from=2026-08-01&to=2026-08-31&period=weekly&limit=5`}
        />
        <DocsCodeBlock
          language="json"
          label="response — الهيكل العام"
          code={`{
  "success": true,
  "data": {
    "summary":       { /* Overview */ },
    "trend":         { /* Trend */ },
    "resources":     { /* Resource Performance */ },
    "cancellations": { /* Cancellations */ },
    "peak-times":    { /* Peak Times */ }
  }
}`}
        />
      </DocsEndpointCard>

      <DocsSectionTitle icon="bi-speedometer2" variant="blue">1 — Overview</DocsSectionTitle>
      <DocsCodeBlock
        language="json"
        label="data.summary"
        code={`{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "bookings": {
    "total":             184,
    "total_revenue":     8280.00,
    "avg_booking_value":   45.00,
    "total_refunded":     412.50,
    "by_status": { "pending": 6, "confirmed": 120, "cancelled": 22, "completed": 31, "no_show": 5 },
    "cancellation_rate": 11.96,
    "no_show_rate":       2.72,
    "completion_rate":   16.85
  },
  "resources": { "total": 14, "active": 12, "paid_resources": 9, "free_resources": 5 }
}`}
      />
      <DocsCallout type="info">
        كل الأرقام تأتي من <strong>استعلامين فقط</strong>: واحد على <code>bookings</code> بـ
        <code>SUM(CASE WHEN …)</code> لكل حالة، وواحد على <code>resources</code>. لا حلقات PHP ولا تحميل صفوف.
      </DocsCallout>

      <DocsSectionTitle icon="bi-graph-up" variant="teal">2 — Trend</DocsSectionTitle>
      <DocsCodeBlock
        language="json"
        label="data.trend"
        code={`{
  "period": "weekly",
  "from": "2026-08-01",
  "to":   "2026-08-31",
  "data": [
    { "label": "2026-W31", "bookings_count": 42, "revenue": 1890.00, "avg_value": 45.00 },
    { "label": "2026-W32", "bookings_count": 51, "revenue": 2295.00, "avg_value": 45.00 }
  ]
}`}
      />
      <DocsTable
        headers={['period', 'صيغة التجميع', 'شكل الـ label']}
        rows={[
          ['daily', <code key="1">DATE(created_at)</code>, '2026-08-14'],
          ['weekly', <code key="2">DATE_FORMAT(&apos;%x-W%v&apos;)</code>, '2026-W33'],
          ['monthly', <code key="3">DATE_FORMAT(&apos;%Y-%m&apos;)</code>, '2026-08'],
        ]}
      />
      <DocsCallout type="info">
        الاتجاه يستثني <code>cancelled</code> — منحنى الإيراد يجب أن يعكس المال المحقَّق لا المطلوب.
      </DocsCallout>

      <DocsSectionTitle icon="bi-bar-chart-line" variant="green">3 — Resource Performance</DocsSectionTitle>
      <DocsCodeBlock
        language="json"
        label="data.resources"
        code={`{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "resources": [
    {
      "resource_id":           12,
      "name":                  "Room 101",
      "type":                  "room",
      "capacity":              2,
      "payment_type":          "paid",
      "price":                 45.0,
      "total_bookings":        58,
      "confirmed":             40,
      "completed":             12,
      "cancelled":              5,
      "no_show":                1,
      "total_revenue":       2385.0,
      "total_refunded":        90.0,
      "avg_duration_minutes":  60.0,
      "cancellation_rate":      8.62,
      "occupancy_rate":        37.42,
      "total_available_hours": 496.0,
      "total_booked_hours":    185.6
    }
  ]
}`}
      />
      <DocsCallout type="tip">
        <strong>Occupancy Rate هو أثمن رقم في الملف.</strong> لا يُقاس بعدّ الحجوزات بل بالساعات:
        <code>booked_hours / (daily_available_hours × عدد أيام الفترة × capacity)</code>. مورد بعشرة حجوزات
        قصيرة قد يكون إشغاله أقل من مورد بثلاثة حجوزات طويلة — والعدد وحده يكذب هنا.
      </DocsCallout>
      <DocsCallout type="info">
        يُستخدَم <code>leftJoin</code> فتظهر الموارد التي لم تُحجز إطلاقاً بأصفار بدل أن تختفي — وهي بالضبط
        الموارد التي يحتاج المدير أن يراها.
      </DocsCallout>

      <DocsSectionTitle icon="bi-x-circle" variant="red">4 — Cancellations</DocsSectionTitle>
      <DocsCodeBlock
        language="json"
        label="data.cancellations"
        code={`{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "summary": {
    "total_cancellations":     22,
    "total_amount_cancelled": 990.00,
    "total_refunded":         412.50,
    "avg_refund":              18.75,
    "cancellation_rate":       11.96,
    "refund_rate":             41.67
  },
  "no_show": { "total": 5, "revenue_lost": 225.00, "no_show_rate": 2.72 },
  "by_resource": [
    { "resource_id": 12, "resource_name": "Room 101", "resource_type": "room", "cancellations": 5, "total_refunded": 90.0 }
  ],
  "trend": [
    { "label": "2026-W31", "count": 9, "refunded": 180.0 }
  ]
}`}
      />
      <DocsCallout type="tip">
        <code>refund_rate</code> يفصل بين حجم الإلغاء وتكلفته: 22 إلغاء بقيمة 990 استُرد منها 412.50 فقط — أي أن
        سلّم السياسات يمتصّ نحو 58٪ من أثر الإلغاء. هذا رقم قابل للضبط تجارياً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-clock-history" variant="amber">5 — Peak Times</DocsSectionTitle>
      <DocsCodeBlock
        language="json"
        label="data['peak-times']"
        code={`{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "by_day_of_week": [
    { "day_of_week": 1, "day_name": "Monday", "bookings_count": 38, "revenue": 1710.0 }
  ],
  "by_hour": [
    { "hour": 9,  "hour_label": "09:00", "bookings_count": 21, "revenue": 945.0 },
    { "hour": 10, "hour_label": "10:00", "bookings_count": 34, "revenue": 1530.0 }
  ],
  "by_month": [
    { "month": "2026-08", "bookings_count": 184, "revenue": 8280.0 }
  ],
  "avg_lead_time": [
    { "resource_id": 12, "name": "Room 101", "avg_lead_time_hours": 18.4 }
  ]
}`}
      />
      <DocsCallout type="info">
        <code>by_hour</code> يُستعلَم مرتّباً بالعدد تنازلياً ثم يُعاد ترتيبه بالساعة في PHP — فتحصل على رسم بياني
        زمني صحيح دون فقدان ترتيب الأهمية في الاستعلام. و<code>avg_lead_time</code> مرتّب تصاعدياً: الأقل هو
        المورد الذي يُحجَز في آخر لحظة.
      </DocsCallout>

      <DocsSectionTitle icon="bi-calculator" variant="purple">المعدلات المحسوبة</DocsSectionTitle>
      <DocsTable headers={['المقياس', 'الصيغة', 'المعنى']} rows={METRIC_ROWS} />

      <DocsSectionTitle icon="bi-hdd" variant="blue">Caching & Portability</DocsSectionTitle>
      <DocsCodeBlock
        language="text"
        label="cache key"
        code={`analytics:booking:project:{projectId}:overview:{from}:{to}     // TTL_SHORT = 300s`}
      />
      <DocsCallout type="tip">
        <strong>توافق SQLite:</strong> الـ Repository لا يكتب <code>TIMESTAMPDIFF</code> مباشرة — بل يمرّ عبر
        دالتين مساعدتين تفحصان محرك الاتصال وتُصدران <code>strftime</code> عند SQLite. الفائدة عملية: اختبارات
        التقارير تعمل على SQLite في الذاكرة بلا حاجة إلى MySQL.
      </DocsCallout>
      <DocsCallout type="warn">
        مسار <code>/api/analytics/overview</code> مُسجَّل بلا <code>resolve.project</code> ولا
        <code>auth.user</code>، ويقرأ <code>project_id</code> من الـ query string مباشرة. أي أن أي طالب يستطيع
        تمرير أي معرّف مشروع وقراءة تقاريره. إلحاق المسار بالمجموعة المحمية إصلاح ضروري قبل الإنتاج.
      </DocsCallout>
      <DocsCallout type="info">
        المسارات المفردة (<code>/analytics/trend</code>، <code>/resources</code>، <code>/cancellations</code>،
        <code>/peak-times</code>) موجودة كأسماء مُجهَّزة ومعطَّلة بالتعليق في <code>routes/api.php</code> — الـ
        Actions والـ Service جاهزة بالكامل، ولا ينقص سوى إزالة التعليق عند الحاجة إلى استدعاء تقرير منفرد.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/analytics" />
    </div>
  );
}

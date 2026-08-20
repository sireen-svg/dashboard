import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsStepList from '../../../components/docs/DocsStepList';
import DocsTable from '../../../components/docs/DocsTable';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const DAY_ROWS = [
  ['0', 'Sunday', 'الأحد'],
  ['1', 'Monday', 'الاثنين'],
  ['2', 'Tuesday', 'الثلاثاء'],
  ['3', 'Wednesday', 'الأربعاء'],
  ['4', 'Thursday', 'الخميس'],
  ['5', 'Friday', 'الجمعة'],
  ['6', 'Saturday', 'السبت'],
];

const SLOT_STEPS = [
  {
    name: 'Resolve day availability',
    desc: <><code>availabilityForDay(dayOfWeek)</code> — يجلب أول نافذة نشطة لذلك اليوم من الأسبوع.</>,
    fail: '→ يُعيد مصفوفة slots فارغة (لا استثناء)',
  },
  {
    name: 'Build the grid',
    desc: <>يبدأ من <code>start_time</code> ويتقدّم بمقدار <code>slot_duration</code> دقيقة في كل خطوة، ويتوقّف عندما تتجاوز نهاية الـ slot التالي <code>end_time</code> — فلا يُولَّد أبداً slot ناقص.</>,
  },
  {
    name: 'Count existing bookings',
    desc: <>استعلام واحد يجلب حجوزات ذلك اليوم بحالة <code>confirmed</code> أو <code>pending</code>، ثم يبني خريطة عدّ في الذاكرة مفتاحها وقت البداية — بدل استعلام لكل slot.</>,
    tone: 'teal',
  },
  {
    name: 'Compute availability',
    desc: <>الـ slot متاح إذا <code>booked_count &lt; capacity</code> <strong>و</strong> وقت بدايته في المستقبل — فالسعة وحدها لا تكفي، والساعات التي مضت من اليوم الحالي تُقفَل تلقائياً.</>,
    ok: '→ available: true | false + booked_count + capacity',
    tone: 'green',
  },
];

export default function BookingAvailabilityPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Availability & Slots' }]}
        eyebrow="Booking"
        title="Availability &"
        highlight="Slots"
        subtitle="نوافذ توفر أسبوعية تُعرَّف مرة واحدة، ومنها يُولّد النظام الـ Slots لأي تاريخ لحظياً بدون تخزين."
      />

      <DocsCallout type="info">
        <strong>لا يوجد جدول slots.</strong> الـ Slots ليست بيانات مُخزَّنة — هي دالة من (نافذة التوفر × التاريخ
        المطلوب) تُحسب في كل طلب. هذا يعني صفر مهام جدولة مسبقة، وصفر سجلات باتلة، وأن تعديل نافذة واحدة يُغيّر
        كل التواريخ المستقبلية فوراً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-calendar-week" variant="blue">Day Encoding</DocsSectionTitle>
      <DocsTable headers={['day_of_week', 'اليوم', 'بالعربية']} rows={DAY_ROWS} />

      <DocsSectionTitle icon="bi-sliders" variant="teal">Endpoints</DocsSectionTitle>

      {/* ── SET AVAILABILITY ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/resources/{id}/availability"
        authTag="permission: resource.update"
        authTone="protected"
        description="ضبط نوافذ التوفر (استبدال كامل)"
        defaultOpen
      >
        <DocsParamTable
          rows={[
            { field: 'availabilities', required: true, type: 'array', notes: 'min:1 — لا يمكن إرسال مصفوفة فارغة' },
            { field: 'availabilities.*.day_of_week', required: true, type: 'integer', notes: 'between:0,6' },
            { field: 'availabilities.*.start_time', required: true, type: 'string', notes: 'date_format:H:i — مثال 09:00' },
            { field: 'availabilities.*.end_time', required: true, type: 'string', notes: 'date_format:H:i | after:start_time' },
            { field: 'availabilities.*.slot_duration', required: true, type: 'integer', notes: 'min:5 — بالدقائق' },
            { field: 'availabilities.*.is_active', required: false, type: 'boolean', notes: 'default true' },
          ]}
        />
        <DocsCallout type="warn">
          <strong>عملية استبدال لا إضافة.</strong> <code>setAvailabilities()</code> يحذف كل نوافذ المورد أولاً ثم
          يُدرج المصفوفة المُرسَلة بـ <code>insert()</code> واحد. أرسل دائماً الجدول الأسبوعي كاملاً — إرسال يوم
          واحد فقط يمسح بقية الأيام.
        </DocsCallout>
        <DocsCodeBlock
          language="json"
          label="request"
          code={`{
  "availabilities": [
    { "day_of_week": 1, "start_time": "09:00", "end_time": "17:00", "slot_duration": 60, "is_active": true },
    { "day_of_week": 2, "start_time": "09:00", "end_time": "17:00", "slot_duration": 60, "is_active": true },
    { "day_of_week": 3, "start_time": "10:00", "end_time": "14:00", "slot_duration": 30, "is_active": true }
  ]
}`}
        />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "message": "Availability updated successfully.",
  "data": {
    "id": 12,
    "name": "Room 101",
    "active_availabilities": [
      { "id": 21, "day_of_week": 1, "start_time": "09:00:00", "end_time": "17:00:00", "slot_duration": 60, "is_active": true }
    ]
  }
}`} />,
            },
            {
              key: 'err',
              label: '❌ 422',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "End time must be after start time." }
{ "message": "Slot duration must be at least 5 minutes." }
{ "message": "Day of week must be between 0 (Sunday) and 6 (Saturday)." }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── GET SLOTS ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/resources/{id}/slots"
        authTag="🔐 resolve.project + auth.user"
        authTone="protected"
        description="توليد الـ Slots المتاحة لتاريخ محدد"
      >
        <DocsParamTable
          rows={[{ field: 'date', required: true, type: 'string', notes: 'date_format:Y-m-d — مثال 2026-09-14' }]}
        />
        <DocsCallout type="info">
          الطريقة <code>POST</code> مع أن العملية قراءة — التاريخ يُرسَل في الـ body لا في الـ query string. هذا
          مقصود في تصميم الخدمة وتتبعه دالة <code>getSlots()</code> في الداشبورد.
        </DocsCallout>
        <DocsCodeBlock language="json" label="request" code={`{ "date": "2026-09-14" }`} />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock
                    language="json"
                    code={`{
  "data": {
    "resource_id": 12,
    "date":        "2026-09-14",
    "day":         "Monday",
    "slots": [
      { "start": "2026-09-14 09:00:00", "end": "2026-09-14 10:00:00", "available": true,  "booked_count": 0, "capacity": 2 },
      { "start": "2026-09-14 10:00:00", "end": "2026-09-14 11:00:00", "available": true,  "booked_count": 1, "capacity": 2 },
      { "start": "2026-09-14 11:00:00", "end": "2026-09-14 12:00:00", "available": false, "booked_count": 2, "capacity": 2 }
    ]
  }
}`}
                  />
                  <DocsCallout type="tip">
                    <code>booked_count</code> يُعرَض دائماً حتى عندما يكون الـ slot متاحاً — فتستطيع الواجهة أن
                    تُظهر «بقي مقعد واحد» بدل مجرد «متاح».
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'empty',
              label: '⚪ لا توفر',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "data": { "resource_id": 12, "date": "2026-09-13", "day": "Sunday", "slots": [] }
}`} />
                  <DocsCallout type="info">
                    يوم بلا نافذة توفر نشطة يُعيد <code>slots: []</code> بحالة 200 — وليس خطأً. غياب التوفر ليس
                    فشلاً.
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'err',
              label: '❌ 422',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Resource not found." }
{ "message": "Resource is not active." }
{ "message": "Cannot view slots for past dates." }   // اليوم الحالي مسموح، ما قبله لا
{ "message": "Date must be in Y-m-d format. Example: 2025-01-15" }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsSectionTitle icon="bi-gear-wide-connected" variant="amber">SlotGeneratorService — كيف يعمل</DocsSectionTitle>
      <DocsStepList steps={SLOT_STEPS} />

      <DocsSectionTitle icon="bi-calculator" variant="purple">حساب عدد الـ Slots</DocsSectionTitle>
      <DocsCodeBlock
        language="text"
        label="ResourceAvailability::slotsCount()"
        code={`floor((end_time - start_time) / slot_duration)

مثال 1:  09:00 → 17:00  بـ slot_duration = 60   ⇒  8 slots
مثال 2:  10:00 → 14:00  بـ slot_duration = 30   ⇒  8 slots
مثال 3:  09:00 → 09:50  بـ slot_duration = 60   ⇒  0 slots  (النافذة أقصر من slot واحد)`}
      />
      <DocsCallout type="warn">
        <strong>قيد حالي:</strong> <code>availabilityForDay()</code> يعيد <code>first()</code> — أي نافذة واحدة لكل
        يوم. لو عُرِّفت فترتان لليوم نفسه (صباحية ومسائية) فسيولّد المولّد الـ Slots من الأولى فقط. لاحظ أن
        <code>CheckAvailabilityAction</code> — المستخدَم عند الإنشاء — يمرّ على <em>كل</em> النوافذ، فقد يُقبَل
        حجز في الفترة المسائية رغم أنها لم تظهر في الـ Slots.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/availability" />
    </div>
  );
}

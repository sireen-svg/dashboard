import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsStepList from '../../../components/docs/DocsStepList';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsTable from '../../../components/docs/DocsTable';
import DocsStatsRow from '../../../components/DocsStatsRow';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const TEST_STATS = [
  { value: '68', label: 'ملف اختبار' },
  { value: '44', label: 'Unit' },
  { value: '17', label: 'Integration' },
  { value: '7', label: 'Feature / HTTP' },
  { value: '5', label: 'PHPStan Level' },
];

const CB_STATES = [
  { label: 'closed', sub: 'يعمل طبيعياً', variant: 'green' },
  { label: 'open', sub: '5 دقائق cooldown', variant: 'red' },
  { label: 'half-open', sub: 'محاولة واحدة', variant: 'amber' },
];

const CB_ROWS = [
  ['closed', 'نجاح', 'يُحذف صف القاطع بالكامل (تصفير)'],
  ['closed', 'فشل', 'failure_count++ — وعند بلوغ 5 يُصبح open'],
  ['open', 'أي طلب قبل next_attempt_at', 'يُرفَض فوراً — "Circuit is open for [service]"'],
  ['open', 'أول طلب بعد next_attempt_at', 'يتحوّل إلى half-open ويُسمَح بالمرور'],
  ['half-open', 'نجاح', 'يُحذف الصف — عاد للعمل'],
  ['half-open', 'فشل', 'يعود open فوراً + 5 دقائق جديدة'],
];

const RUN_STEPS = [
  {
    name: 'Circuit Breaker gate',
    desc: <><code>canProceed(service)</code> — لو كان القاطع مفتوحاً يُرفَض الطلب دون لمس قاعدة البيانات.</>,
    fail: '→ RuntimeException: Circuit is open for [resource.create]',
  },
  {
    name: 'Retry ×3',
    desc: <><code>retry(3, …, 100ms)</code> — ثلاث محاولات بفاصل 100 مللي ثانية، لكن مع دالة قرار: أخطاء التحقق (422 / ValidationException) <strong>لا</strong> تُعاد المحاولة عليها.</>,
    tone: 'teal',
  },
  {
    name: 'DB Transaction',
    desc: <>كل محاولة تُلَف بـ <code>DB::transaction()</code> — المحاولة الفاشلة لا تترك بيانات نصف مكتوبة قبل المحاولة التالية.</>,
  },
  {
    name: 'Report outcome',
    desc: <>النجاح ⇒ <code>reportSuccess</code> فيُصفَّر القاطع. الفشل غير التحقّقي ⇒ <code>reportFailure</code> فيتقدّم العدّاد.</>,
    ok: '→ closed / صفر أخطاء',
    tone: 'green',
  },
];

const CACHE_ROWS = [
  [<code key="a">project:{'{p}'}:resources</code>, 'TTL_LONG · 86400s', 'قائمة موارد المشروع (للأدوار الإدارية)'],
  [<code key="b">project:{'{p}'}user:{'{u}'}:resources</code>, 'TTL_LONG · 86400s', 'قائمة الموارد لدور user — تحمل is_booked'],
  [<code key="c">resources:{'{id}'}</code>, 'TTL_LONG · 86400s', 'مورد واحد + نوافذه + سياساته'],
  [<code key="d">bookings:{'{id}'}</code>, 'TTL_SHORT · 300s', 'حجز واحد — يُقرأ في الإلغاء وإعادة الجدولة'],
  [<code key="e">user:{'{u}'}:bookings</code>, 'مفتاح مباشر', 'حجوزات المستخدم'],
  [<code key="f">resources:{'{id}'}:bookings:{'{md5}'}</code>, 'TTL_SHORT · 300s', 'حجوزات المورد لكل تركيبة فلاتر — تحت وسم'],
  [<code key="g">analytics:booking:project:{'{p}'}:overview:{'{from}'}:{'{to}'}</code>, 'TTL_SHORT · 300s', 'تقرير النظرة العامة'],
];

const INVALIDATION_ROWS = [
  ['إنشاء حجز', <>flush وسم <code key="1">resource_&#123;id&#125;_bookings</code> + forget <code key="2">user:&#123;u&#125;:bookings</code></>],
  ['إلغاء حجز', <>forget <code key="3">bookings:&#123;id&#125;</code> + <code key="4">user:&#123;u&#125;:bookings</code> + flush وسم المورد</>],
  ['إعادة جدولة', <>forget <code key="5">bookings:&#123;id&#125;</code> + flush وسم المورد</>],
  ['إنشاء مورد', <>forget <code key="6">project:&#123;p&#125;:resources</code></>],
  ['تعديل مورد / نوافذ / سياسات', <>forget <code key="7">resources:&#123;id&#125;</code> + <code key="8">project:&#123;p&#125;:resources</code></>],
  ['حذف مورد', <>المفتاحان أعلاه + flush وسم حجوزات المورد</>],
];

export default function BookingReliabilityPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Reliability & Caching' }]}
        eyebrow="Booking"
        title="Reliability &"
        highlight="Caching"
        subtitle="Circuit Breaker وإعادة محاولة وقفل صفوف وكاش موسوم — الطبقة التي تجعل الخدمة تصمد لا مجرد تعمل."
      />

      <DocsSectionTitle icon="bi-lightning-charge" variant="red">Circuit Breaker — 3 States</DocsSectionTitle>
      <DocsFlowDiagram steps={CB_STATES} />
      <DocsTable headers={['الحالة', 'الحدث', 'النتيجة']} rows={CB_ROWS} />
      <DocsCallout type="info">
        <strong>قاطع لكل عملية لا لكل خدمة.</strong> كل Action يُعرِّف <code>circuitServiceName()</code> خاصاً به:
        <code>resource.create</code>، <code>resource.update</code>، <code>resource.index</code>،
        <code>resource.show</code>، <code>resource.delete</code>، <code>resource.setAvailability</code>،
        <code>resource.setPolicy</code>، <code>resource.getBookings</code>. تعطّل عملية الكتابة لا يقفل القراءة.
      </DocsCallout>
      <DocsCallout type="tip">
        <strong>لماذا يُحذف الصف عند النجاح؟</strong> <code>reportSuccess</code> ينفّذ <code>delete()</code> لا
        تحديثاً. الغياب يعني «سليم»، والصف يُنشأ تلقائياً عند أول فحص. النتيجة أن الجدول يبقى صغيراً ولا يحمل إلا
        العمليات المتعثّرة فعلاً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-arrow-clockwise" variant="amber">Action::run() — الطبقات الأربع</DocsSectionTitle>
      <DocsStepList steps={RUN_STEPS} />
      <DocsCodeBlock
        language="text"
        label="التركيب"
        code={`runThroughCircuitBreaker(
    retry(3, 100ms, unless: ValidationException | HTTP 422)
        DB::transaction(
            callback()
        )
)`}
      />
      <DocsCallout type="tip">
        <strong>استثناء أخطاء التحقق من إعادة المحاولة مقصود.</strong> مدخل غير صالح سيفشل ثلاث مرات بنفس الطريقة
        — إعادة المحاولة هنا تضيّع الوقت وتُلوّث عدّاد القاطع بفشل ليس فشل نظام. الأخطاء العابرة (قفل، انقطاع
        شبكة) هي وحدها ما يستحق محاولة ثانية.
      </DocsCallout>
      <DocsCallout type="warn">
        حالة القاطع مُخزَّنة في MySQL — كل فحص استعلام. نقلها إلى Redis يقلّل الحمل ويجعل الفحص شبه مجاني، وهو
        تحسين مُخطَّط مشترك مع بقية الخدمات.
      </DocsCallout>

      <DocsSectionTitle icon="bi-lock" variant="purple">Concurrency — lockForUpdate</DocsSectionTitle>
      <DocsCodeBlock
        language="text"
        label="countConflictingBookings"
        code={`Booking::lockForUpdate()
    ->where('resource_id', $resourceId)
    ->whereNotIn('status', ['cancelled'])
    ->when($ignoreBookingId, fn($q) => $q->where('id', '!=', $ignoreBookingId))
    ->where(fn($q) => $q->where('start_at', '<', $endAt)
                        ->where('end_at',   '>', $startAt))
    ->count();

if ($count >= $capacity) throw new Exception('Slot is fully booked');`}
      />
      <DocsCallout type="tip">
        <strong>هذا هو الحصن ضد الحجز المزدوج.</strong> <code>lockForUpdate()</code> داخل الـ Transaction يجعل
        طلبين متزامنين على نفس المورد يتسلسلان: الثاني ينتظر حتى يلتزم الأول، فيقرأ العدد الصحيح ويُرفَض. بدون
        القفل كان كلاهما سيقرأ نفس العدد القديم ويمرّان معاً.
      </DocsCallout>
      <DocsCallout type="info">
        شرط التقاطع <code>start_at &lt; end AND end_at &gt; start</code> هو الصيغة الصحيحة لتداخل فترتين — يمسك
        التداخل الجزئي والاحتواء الكامل معاً، ولا يعدّ حجزاً ينتهي في نفس لحظة بداية الآخر تعارضاً.
      </DocsCallout>

      <DocsSectionTitle icon="bi-hdd-stack" variant="teal">Cache Keys</DocsSectionTitle>
      <DocsTable headers={['Key', 'TTL', 'المحتوى']} rows={CACHE_ROWS} />
      <DocsCallout type="tip">
        <strong>لماذا TTL يوم كامل للموارد وخمس دقائق للحجوزات؟</strong> لأن المورد يُنشأ مرة ويُقرأ آلاف
        المرات، بينما الحجوزات تتغيّر كل دقيقة. والفارق آمن لأن الإبطال صريح: أي تعديل على المورد يمسح مفتاحه
        فوراً بدل انتظار انتهاء المدة.
      </DocsCallout>

      <DocsSectionTitle icon="bi-eraser" variant="blue">Cache Invalidation Matrix</DocsSectionTitle>
      <DocsTable headers={['العملية', 'ما يُبطَل']} rows={INVALIDATION_ROWS} />
      <DocsCallout type="info">
        <strong>Cache Tags تحلّ مشكلة الفلاتر.</strong> حجوزات المورد مُخزَّنة بمفتاح يحتوي <code>md5</code> لتركيبة
        الفلاتر — أي أن هناك عدداً غير معروف من المفاتيح لنفس المورد. الوسم
        <code>resource_&#123;id&#125;_bookings</code> يسمح بمسحها كلها بنداء <code>flush()</code> واحد دون معرفة
        أسمائها.
      </DocsCallout>

      <DocsSectionTitle icon="bi-shield-check" variant="green">Rate Limiting</DocsSectionTitle>
      <DocsTable
        headers={['Limiter', 'الحد', 'يُطبَّق على']}
        rows={[
          [<code key="1">api.standard</code>, '60 / دقيقة', 'قراءة الموارد والـ Slots والحجوزات'],
          [<code key="2">api.heavy</code>, '15 / دقيقة', 'إنشاء وتعديل وحذف المورد + الحجز والإلغاء وإعادة الجدولة'],
          [<code key="3">api.ai</code>, '5 / دقيقة', 'مُعرَّف ومحفوظ للاستخدام المستقبلي'],
        ]}
      />
      <DocsCallout type="info">
        المفتاح هو <code>user-&gt;id</code> وإلا <code>ip()</code>. ملاحظة: لأن المصادقة تحدث في middleware مخصص
        يكتب في <code>request-&gt;attributes</code> ولا يستخدم حارس Laravel، فإن <code>$request-&gt;user()</code>
        فارغ عملياً — والحدّ يُطبَّق على عنوان IP.
      </DocsCallout>

      <DocsSectionTitle icon="bi-check2-square" variant="purple">Test Coverage</DocsSectionTitle>
      <DocsStatsRow stats={TEST_STATS} />
      <DocsTable
        headers={['الطبقة', 'ما يُختبَر']}
        rows={[
          ['Unit — Actions', 'كل الـ 11 Client Action و5 Resource Action و3 Read Action و5 Analytics Action بمعزل عبر Mock للـ Repository Interfaces'],
          ['Unit — Models', 'Booking و Resource و ResourceAvailability و BookingCancellationPolicy — الدوال المساعدة وحسابات slotsCount و calculateRefund'],
          ['Unit — DTOs', 'كل DTO ودالة fromRequest فيه'],
          ['Unit — Core', 'Action و CircuitBreakerService و CircuitBreakerAware و HasProjectHeaders'],
          ['Unit — Clients', 'CMSApiClient و AuthApiClient و RabbitMQPublisher'],
          ['Integration', 'الـ Repositories الأربعة مقابل قاعدة حقيقية + كل الـ 9 FormRequests وقواعد التحقق فيها'],
          ['Feature / HTTP', 'الـ Controllers الثلاثة + الـ Middlewares الأربعة عبر الطلب الكامل'],
        ]}
      />
      <DocsCallout type="tip">
        بنية الاختبارات تعكس بنية الكود ملفاً بملف — وهذا ما يجعله ممكناً: كل Action يعتمد على
        <em>واجهة</em> Repository لا على Eloquent مباشرة، فيكفي Mock واحد لاختبار منطق العمل بلا قاعدة بيانات.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/reliability" />
    </div>
  );
}

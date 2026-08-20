import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsDbTable from '../../../components/docs/DocsDbTable';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsTable from '../../../components/docs/DocsTable';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const ERD = `resources ─────┬──< resource_availabilities        (cascadeOnDelete)
               ├──< booking_cancellation_policies  (cascadeOnDelete)
               └──< bookings                       (cascadeOnDelete)

resources.data_entry_id ┄┄> CMS: data_entries.id   (لا FK — عبر الخدمات)
bookings.user_id        ┄┄> Auth: users.id         (لا FK — عبر الخدمات)
bookings.payment_id     ┄┄> CMS: payments.id       (لا FK — عبر الخدمات)
bookings.project_id     ┄┄> CMS: projects.id       (لا FK — عبر الخدمات)

circuit_breakers  (جدول مستقل — لا علاقات)`;

const INDEX_ROWS = [
  [<code key="a">bookings</code>, <code key="b">(resource_id, start_at, end_at)</code>, 'العمود الفقري لفحص التعارض — الاستعلام الأكثر سخونة في الخدمة'],
  [<code key="c">bookings</code>, <code key="d">(resource_id, status)</code>, 'قوائم حجوزات المورد المفلترة بالحالة'],
  [<code key="e">bookings</code>, <code key="f">(user_id, status)</code>, '«حجوزاتي» + فحص is_booked'],
  [<code key="g">bookings</code>, <code key="h">(project_id, status)</code>, 'كل تقارير الـ Analytics تبدأ من هنا'],
  [<code key="i">resources</code>, <code key="j">(project_id, status)</code>, 'قائمة الموارد النشطة للمشروع'],
  [<code key="k">resources</code>, <code key="l">(project_id, type)</code>, 'الفلترة بنوع المورد'],
  [<code key="m">resource_availabilities</code>, <code key="n">(resource_id, day_of_week)</code>, 'جلب نافذة اليوم عند توليد الـ Slots'],
  [<code key="o">booking_cancellation_policies</code>, <code key="p">(resource_id, hours_before)</code>, 'حساب الاسترداد بترتيب تنازلي'],
];

export default function BookingDatabasePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Database Schema' }]}
        eyebrow="Booking"
        title="Database"
        highlight="Schema"
        subtitle="4 جداول للأعمال + جدول Circuit Breaker — قاعدة booking_service مستقلة تماماً."
      />

      <DocsSectionTitle icon="bi-hdd-stack" variant="blue">Core Tables</DocsSectionTitle>

      <DocsDbTable
        name="resources"
        description="أي شيء قابل للحجز — غرفة، ملعب، مقعد، طبيب. SoftDeletes"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'data_entry_id', type: 'unsignedBigInt', desc: 'DataEntry في CMS — المحتوى المرتبط (indexed)' },
          { name: 'project_id', type: 'unsignedBigInt', desc: '→ CMS projects.id (indexed)' },
          { name: 'name', type: 'varchar', desc: 'اسم المورد' },
          { name: 'type', type: 'varchar', desc: 'حرّ: room | court | seat | doctor …' },
          { name: 'capacity', type: 'unsignedInt', desc: 'كم حجزاً متوازياً يقبل — default 1' },
          { name: 'status', type: 'enum', desc: 'active | inactive — default active (indexed)' },
          { name: 'payment_type', type: 'enum', desc: 'free | paid — default free (indexed)' },
          { name: 'price', type: 'decimal(12,2)?', desc: 'مطلوب فقط عندما payment_type = paid' },
          { name: 'settings', type: 'json?', desc: 'إعدادات مرنة إضافية خاصة بنوع المورد' },
          { name: 'deleted_at', type: 'timestamp?', desc: 'SoftDeletes' },
        ]}
      />

      <DocsDbTable
        name="resource_availabilities"
        description="نوافذ التوفر الأسبوعية — الأساس الذي تُولَّد منه الـ Slots"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'resource_id', type: 'bigint FK', desc: '→ resources.id — cascadeOnDelete', badge: 'FK' },
          { name: 'day_of_week', type: 'unsignedTinyInt', desc: '0 = Sunday … 6 = Saturday (indexed)' },
          { name: 'start_time', type: 'time', desc: 'بداية النافذة — مثال 09:00' },
          { name: 'end_time', type: 'time', desc: 'نهاية النافذة — مثال 17:00' },
          { name: 'slot_duration', type: 'unsignedInt?', desc: 'مدة كل slot بالدقائق — مثال 60' },
          { name: 'is_active', type: 'boolean', desc: 'default true (indexed) — النوافذ النشطة فقط تُستخدَم' },
        ]}
      />

      <DocsDbTable
        name="bookings"
        description="سجل الحجز. SoftDeletes"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'resource_id', type: 'bigint FK', desc: '→ resources.id — cascadeOnDelete', badge: 'FK' },
          { name: 'user_id', type: 'unsignedBigInt', desc: 'من Auth Service (indexed)' },
          { name: 'project_id', type: 'unsignedBigInt', desc: '→ CMS projects.id (indexed)' },
          { name: 'payment_id', type: 'unsignedBigInt?', desc: 'payment في CMS — nullable لأن الحجز يُنشأ أولاً ثم يُدفع' },
          { name: 'start_at', type: 'datetime', desc: 'بداية الحجز (indexed)' },
          { name: 'end_at', type: 'datetime', desc: 'نهاية الحجز (indexed)' },
          { name: 'status', type: 'enum', desc: 'pending | confirmed | cancelled | completed | no_show (indexed)' },
          { name: 'amount', type: 'decimal(12,2)', desc: 'المبلغ — يُجبَر على 0 للموارد المجانية' },
          { name: 'currency', type: 'char(3)', desc: 'default USD' },
          { name: 'notes', type: 'text?', desc: 'ملاحظات العميل' },
          { name: 'cancellation_reason', type: 'text?', desc: 'يُملأ عند الإلغاء' },
          { name: 'refund_amount', type: 'decimal(12,2)?', desc: 'المبلغ المسترد المحسوب من السياسة' },
          { name: 'deleted_at', type: 'timestamp?', desc: 'SoftDeletes' },
        ]}
      />

      <DocsDbTable
        name="booking_cancellation_policies"
        description="سياسات إلغاء متدرّجة — عدة صفوف لكل مورد"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'resource_id', type: 'bigint FK', desc: '→ resources.id — cascadeOnDelete', badge: 'FK' },
          { name: 'hours_before', type: 'unsignedInt', desc: 'العتبة: كم ساعة قبل الموعد' },
          { name: 'refund_percentage', type: 'unsignedTinyInt', desc: '0 … 100' },
          { name: 'description', type: 'varchar?', desc: 'نص يُعرَض للعميل' },
        ]}
      />

      <DocsDbTable
        name="circuit_breakers"
        description="حالة القاطع لكل عملية — مشترك في التصميم مع CMS و E-Commerce"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'service_name', type: 'varchar', desc: 'اسم العملية: resource.create, resource.index …', badge: 'UNIQUE' },
          { name: 'state', type: 'varchar', desc: 'closed | open | half-open — default closed' },
          { name: 'failure_count', type: 'integer', desc: 'عدّاد الفشل المتتالي — default 0' },
          { name: 'failure_threshold', type: 'integer', desc: 'عتبة الفتح — default 5' },
          { name: 'opened_at', type: 'timestamp?', desc: 'لحظة فتح القاطع' },
          { name: 'next_attempt_at', type: 'timestamp?', desc: 'opened_at + 5 دقائق — بعدها يُصبح half-open' },
        ]}
      />

      <DocsSectionTitle icon="bi-diagram-3" variant="teal">Relationships</DocsSectionTitle>
      <DocsCodeBlock language="text" label="ERD" code={ERD} />
      <DocsCallout type="info">
        <strong>لا Foreign Keys عبر الخدمات.</strong> <code>user_id</code> و<code>project_id</code> و
        <code>payment_id</code> و<code>data_entry_id</code> كلها معرّفات لسجلات تعيش في قواعد بيانات أخرى — تُخزَّن
        كأعداد مفهرسة بلا قيد مرجعي. هذا هو الثمن المقصود لاستقلال الخدمات، والتكامل يُضمَن على مستوى التطبيق
        (Middleware + API Clients) لا على مستوى المحرك.
      </DocsCallout>
      <DocsCallout type="tip">
        <strong>داخل الخدمة</strong> العلاقات محكمة: الجداول الثلاثة التابعة للمورد كلها
        <code>cascadeOnDelete</code> — حذف مورد يمسح نوافذه وسياساته وحجوزاته معه.
      </DocsCallout>

      <DocsSectionTitle icon="bi-speedometer2" variant="amber">Indexes — 8 مركّب</DocsSectionTitle>
      <DocsTable headers={['Table', 'Index', 'لماذا']} rows={INDEX_ROWS} />
      <DocsCallout type="info">
        الفهارس المركّبة ليست تجميلية: استعلام فحص التعارض يُنفَّذ في كل إنشاء وكل إعادة جدولة تحت
        <code>lockForUpdate()</code> — أي بطء فيه يُترجَم إلى قفل أطول على الصفوف وطابور انتظار أعلى.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/booking/database" />
    </div>
  );
}

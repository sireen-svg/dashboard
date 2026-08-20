import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsHeaderBox from '../../../components/docs/DocsHeaderBox';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function BookingResourcesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Booking', to: '/docs/booking' }, { label: 'Resources API' }]}
        eyebrow="Booking"
        title="Resources"
        highlight="API"
        subtitle="إدارة الموارد القابلة للحجز — كل المسارات تحت البادئة /api/booking/resources."
      />

      <DocsSectionTitle icon="bi-key" variant="amber">Required Headers</DocsSectionTitle>
      <DocsHeaderBox
        rows={[
          { key: 'X-Project-Id', value: 'project.public_id', note: 'إلزامي — غيابه يُعيد 400 من ResolveProject' },
          { key: 'Authorization', value: 'Bearer {access_token}', note: 'يُتحقَّق منه بنداء Auth Service /api/my-profile' },
          { key: 'Content-Type', value: 'application/json', note: '' },
        ]}
      />
      <DocsCallout type="warn">
        Booking تقرأ <strong>X-Project-Id</strong> فقط — وليس <code>X-Project-Key</code> الذي يستخدمه CMS. هذا
        سبب وجود <code>bookingClient</code> منفصل في الداشبورد بهيدر مختلف.
      </DocsCallout>

      <DocsSectionTitle icon="bi-box-seam" variant="blue">Endpoints</DocsSectionTitle>

      {/* ── INDEX ── */}
      <DocsEndpointCard
        method="GET"
        path="/api/booking/resources"
        authTag="🔐 resolve.project + auth.user"
        authTone="protected"
        description="قائمة موارد المشروع"
        defaultOpen
      >
        <DocsCallout type="tip">
          <strong>الاستجابة تتغيّر حسب الدور.</strong> <code>IndexResourcesAction</code> يفحص
          <code>user.roles[0].name</code>: إن كان <code>user</code> فيُستخدَم مفتاح كاش خاص بالمستخدم وتُضاف لكل
          مورد الخاصية المحسوبة <code>is_booked</code> (هل لهذا المستخدم حجز عليه). أي دور آخر يحصل على قائمة
          المشروع العامة المشتركة.
        </DocsCallout>
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
  "data": [
    {
      "id":            12,
      "data_entry_id": 88,
      "project_id":    1,
      "name":          "Room 101",
      "type":          "room",
      "capacity":      2,
      "status":        "active",
      "payment_type":  "paid",
      "price":         45.00,
      "settings":      { "floor": 1 },
      "is_booked":     true,
      "active_availabilities": [
        { "id": 5, "day_of_week": 1, "start_time": "09:00:00", "end_time": "17:00:00", "slot_duration": 60, "is_active": true }
      ],
      "cancellation_policies": [
        { "id": 3, "hours_before": 48, "refund_percentage": 100, "description": "استرداد كامل قبل يومين" },
        { "id": 4, "hours_before": 24, "refund_percentage": 50,  "description": "نصف المبلغ قبل يوم" }
      ]
    }
  ]
}`}
                  />
                  <DocsCallout type="info">
                    الموارد <code>inactive</code> لا تظهر إطلاقاً — الـ Repository يفلتر على
                    <code>status = active</code>. الكاش: <code>TTL_LONG</code> = 86400s.
                  </DocsCallout>
                </>
              ),
            },
            {
              key: 'err',
              label: '❌ Errors',
              tone: 'error',
              content: (
                <DocsCodeBlock
                  language="json"
                  code={`{ "message": "X-Project-Id header is required" }   // 400
{ "message": "Unauthorized" }                       // 401 — بلا Bearer token
// 429 — تجاوز 60 طلب/دقيقة (throttle:api.standard)`}
                />
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── SHOW ── */}
      <DocsEndpointCard
        method="GET"
        path="/api/booking/resources/{id}"
        authTag="🔐 resolve.project + auth.user"
        authTone="protected"
        description="تفاصيل مورد واحد"
      >
        <p>
          يُعيد المورد محمّلاً معه <code>activeAvailabilities</code> و<code>cancellationPolicies</code> (مرتّبة
          تنازلياً بـ <code>hours_before</code>). مُخزَّن في الكاش بمفتاح <code>resources:{'{id}'}</code> لمدة يوم.
        </p>
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{ "data": { "id": 12, "name": "Room 101", "capacity": 2, "active_availabilities": [ ... ], "cancellation_policies": [ ... ] } }`} />,
            },
            {
              key: 'err',
              label: '❌ 404',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Resource not found." }`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── STORE ── */}
      <DocsEndpointCard
        method="POST"
        path="/api/booking/resources"
        authTag="permission: resource.create"
        authTone="protected"
        description="إنشاء مورد جديد"
      >
        <DocsParamTable
          rows={[
            { field: 'data_entry_id', required: true, type: 'integer', notes: 'معرّف الـ DataEntry في CMS الذي يمثّل هذا المورد' },
            { field: 'name', required: true, type: 'string', notes: 'max:255' },
            { field: 'type', required: true, type: 'string', notes: 'max:100 — قيمة حرّة: room, court, seat, doctor …' },
            { field: 'capacity', required: false, type: 'integer', notes: 'min:1 — default 1. عدد الحجوزات المتوازية المسموحة' },
            { field: 'payment_type', required: true, type: 'string', notes: 'in:free,paid' },
            { field: 'price', required: false, type: 'numeric', notes: 'min:0.01 — يصبح required إذا payment_type = paid' },
            { field: 'settings', required: false, type: 'array', notes: 'JSON مرن لأي إعدادات إضافية' },
          ]}
        />
        <DocsCallout type="tip">
          <strong>Conditional validation:</strong> قاعدة <code>price</code> تُبنى ديناميكياً داخل
          <code>CreateResourceRequest</code> بقراءة <code>payment_type</code> من نفس الطلب. وحتى لو أُرسل سعر مع
          مورد مجاني، فإن <code>ResourceDTO::toCreateArray()</code> يجعله <code>null</code>.
        </DocsCallout>
        <DocsCodeBlock
          language="json"
          label="request"
          code={`{
  "data_entry_id": 88,
  "name":          "Room 101",
  "type":          "room",
  "capacity":      2,
  "payment_type":  "paid",
  "price":         45.00,
  "settings":      { "floor": 1, "has_projector": true }
}`}
        />
        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 201',
              tone: 'success',
              content: <DocsCodeBlock language="json" code={`{
  "message": "Resource created successfully.",
  "data": { "id": 12, "name": "Room 101", "status": "active", "payment_type": "paid", "price": 45.00 }
}`} />,
            },
            {
              key: 'err',
              label: '❌ 422 / 403',
              tone: 'error',
              content: <DocsCodeBlock language="json" code={`{ "message": "Price is required when payment type is paid." }   // 422
{ "message": "Price must be greater than zero." }                // 422
{ "message": "Forbidden" }                                       // 403 — بلا صلاحية resource.create
// 429 — تجاوز 15 طلب/دقيقة (throttle:api.heavy)`} />,
            },
          ]}
        />
      </DocsEndpointCard>

      {/* ── UPDATE ── */}
      <DocsEndpointCard
        method="PATCH"
        path="/api/booking/resources/{id}"
        authTag="permission: resource.update"
        authTone="protected"
        description="تعديل جزئي للمورد"
      >
        <DocsParamTable
          rows={[
            { field: 'name', required: false, type: 'string', notes: 'sometimes | max:255' },
            { field: 'type', required: false, type: 'string', notes: 'sometimes | max:100' },
            { field: 'capacity', required: false, type: 'integer', notes: 'sometimes | min:1' },
            { field: 'status', required: false, type: 'string', notes: 'sometimes | in:active,inactive' },
            { field: 'payment_type', required: false, type: 'string', notes: 'sometimes | in:free,paid' },
            { field: 'price', required: false, type: 'numeric', notes: 'sometimes | nullable | min:0.01' },
            { field: 'settings', required: false, type: 'array', notes: 'sometimes' },
          ]}
        />
        <DocsCallout type="info">
          <code>toUpdateArray()</code> يستخدم <code>array_filter</code> فلا تُكتب الحقول غير المُرسَلة. استثناء
          واحد مقصود: تحويل المورد إلى <code>free</code> يصفّر <code>price</code> إلى <code>null</code> صراحةً حتى
          لا يبقى سعر قديم معلّقاً على مورد صار مجانياً.
        </DocsCallout>
        <DocsCodeBlock language="json" label="response" code={`{
  "message": "Resource updated successfully.",
  "data": { "id": 12, "name": "Room 102", "capacity": 3, "active_availabilities": [ ... ], "cancellation_policies": [ ... ] }
}`} />
      </DocsEndpointCard>

      {/* ── DESTROY ── */}
      <DocsEndpointCard
        method="DELETE"
        path="/api/booking/resources/{id}"
        authTag="permission: resource.delete"
        authTone="protected"
        description="حذف مورد (Soft Delete)"
      >
        <p>
          حذف ناعم — يُضبَط <code>deleted_at</code> ويبقى السجل. ثم يُبطَل كاش المورد وكاش قائمة المشروع، ويُفرَّغ
          وسم كاش حجوزات المورد بالكامل.
        </p>
        <DocsCodeBlock language="json" label="response" code={`{ "message": "Resource deleted successfully." }`} />
        <DocsCallout type="warn">
          الحجوزات المرتبطة تُحذف تتابعياً على مستوى قاعدة البيانات (<code>cascadeOnDelete</code>) عند الحذف
          النهائي. الحذف الناعم يُخفي المورد من كل القوائم فوراً لأن الاستعلامات تفلتر على
          <code>status = active</code> و<code>whereNull(deleted_at)</code>.
        </DocsCallout>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/booking/resources" />
    </div>
  );
}

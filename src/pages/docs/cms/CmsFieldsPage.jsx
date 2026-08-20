import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsFieldsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Fields API' }]}
        eyebrow="Schema Builder"
        title="Fields"
        highlight="API"
        subtitle="إضافة وإدارة الحقول لكل DataType — validation rules ديناميكية وdynamic relations."
      />

      {/* POST create field */}
      <DocsEndpointCard method="POST" path="/api/cms/data-types/{dataType}/fields" authTag="🔐 auth.user" authTone="protected" description="إضافة حقل لـ DataType" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Validation Rules — CreateFieldRequest</div>
        <DocsParamTable
          rows={[
            { field: 'name', required: true, type: 'string', notes: 'max:255' },
            { field: 'type', required: true, type: 'string', notes: 'text | number | boolean | select | json | relation | file' },
            { field: 'required', required: false, type: 'boolean', notes: 'default: false' },
            { field: 'translatable', required: false, type: 'boolean', notes: 'default: false — يدعم قيم متعددة اللغات' },
            { field: 'validation_rules', required: false, type: 'array', notes: '["min:3","max:255","email","url"] — strings' },
            { field: 'settings', required: false, type: 'array', notes: 'إعدادات خاصة بالنوع (انظر أدناه)' },
            { field: 'sort_order', required: false, type: 'integer', notes: 'default: 0 — ترتيب الحقل' },
          ]}
        />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Settings للـ Relation Field</div>
        <DocsCodeBlock language="json" label="JSON — Relation Field" code={`{
  "name":     "author",
  "type":     "relation",
  "required": true,
  "settings": {
    "relation_type":       "belongs_to",
    "related_data_type_id": 3,   // ID الـ DataType المرتبط
    "multiple":            false  // true لو many-to-many
  }
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Request Body — Text Field</div>
        <DocsCodeBlock language="json" label="JSON — Text Field" code={`{
  "name":             "title",
  "type":             "text",
  "required":         true,
  "translatable":     true,
  "validation_rules": ["min:3", "max:255"],
  "sort_order":       1
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Response 201</div>
        <DocsCodeBlock language="json" label="201 Created" dotColor="var(--fb-green)" code={`{
  "message": "Field created successfully",
  "data": {
    "id":               12,
    "data_type_id":     5,
    "name":             "title",
    "type":             "text",
    "required":         true,
    "translatable":     true,
    "validation_rules": ["min:3", "max:255"],
    "sort_order":       1
  }
}`} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Error — Unsupported type</div>
        <DocsCodeBlock language="json" code={`{ "message": "Unsupported field type 'video'." }  // 422 — من FieldTypeFactory`} />
      </DocsEndpointCard>

      {/* GET fields */}
      <DocsEndpointCard method="GET" path="/api/cms/data-types/{dataType}/fields" authTag="🔐 auth.user" authTone="protected" description="كل fields لـ DataType محدد">
        <p>يُعيد كل fields مُرتَّبة بـ <code>sort_order</code> من <code>DataTypeFieldService::list()</code>.</p>
        <DocsCodeBlock language="json" label="200 OK" dotColor="var(--fb-green)" code={`// مصفوفة مباشرة مُرتَّبة بـ sort_order
[
  { "id": 12, "data_type_id": 5, "name": "title",   "type": "text",   "required": true,  "translatable": true,  "sort_order": 1 },
  { "id": 13, "data_type_id": 5, "name": "content", "type": "text",   "required": false, "translatable": false, "sort_order": 2 },
  { "id": 14, "data_type_id": 5, "name": "price",   "type": "number", "required": true,  "translatable": false, "sort_order": 3 }
]`} />
      </DocsEndpointCard>

      {/* PUT update */}
      <DocsEndpointCard method="PUT" path="/api/cms/fields/{field}" authTag="permission: cms.field.update" authTone="protected" description="تعديل field">
        <p>يُعيد استخدام <code>CreateFieldRequest</code> مع <code>fromRequestForUpdate()</code> — القيم غير المُرسَلة تبقى كما هي من الـ DB.</p>
        <DocsCodeBlock language="json" label="200 OK" dotColor="var(--fb-green)" code={`{
  "message": "Field updated successfully",
  "data": { "id": 12, "name": "title", "type": "text", "required": true, "updated_at": "2026-06-24T11:00:00Z" }
}`} />
      </DocsEndpointCard>

      {/* DELETE */}
      <DocsEndpointCard method="DELETE" path="/api/cms/fields/{field}" authTag="permission: cms.field.delete" authTone="protected" description="حذف ناعم (SoftDelete)">
        <DocsCodeBlock language="json" code={`// SoftDelete — قابل للاسترجاع
{ "message": "Data-Type Field deleted successfully" }`} />
      </DocsEndpointCard>

      <DocsCallout type="info">
        <strong>Trashed &amp; Restore:</strong> <code>GET /cms/data-types/{'{dataType}'}/fields/trashed</code> —{' '}
        <code>POST /cms/fields/{'{id}'}/restore</code> — <code>DELETE /cms/fields/{'{id}'}/force-delete</code> — نفس
        pattern الـ DataTypes.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/cms/fields" />
    </div>
  );
}
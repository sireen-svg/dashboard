import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsTable from '../../../components/docs/DocsTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const FIELD_TYPES = [
  { name: 'text', desc: 'نصوص، عناوين، محتوى طويل. يدعم translatable.', variant: 'blue' },
  { name: 'number', desc: 'أرقام صحيحة وعشرية — أسعار، كميات، تقييمات.', variant: 'amber' },
  { name: 'boolean', desc: 'true/false — مُفعَّل، منشور، featured.', variant: 'green' },
  { name: 'select', desc: 'قائمة خيارات محددة — الحالة، النوع، الفئة.', variant: 'purple' },
  { name: 'json', desc: 'بيانات JSON مخصصة — metadata، variants، specs.', variant: 'teal' },
  { name: 'relation', desc: 'ربط بـ DataType آخر — belongs_to أو many.', variant: 'red' },
  { name: 'file', desc: 'ملفات ومرفقات — صور، PDF، مقاطع صوت.', variant: 'neutral' },
];

export default function CmsFieldTypesPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Fields', to: '/docs/cms/fields' }, { label: 'Field Types' }]}
        eyebrow="Schema Builder"
        title="Field"
        highlight="Types"
        subtitle="7 أنواع من الحقول — مُنفَّذة بـ Strategy Pattern عبر FieldTypeFactory."
      />

      <DocsCallout type="tip">
        <strong>Strategy Pattern:</strong> <code>FieldTypeFactory::make($type)</code> يُعيد implementation مناسب لكل
        نوع. لإضافة نوع جديد: إنشاء class يُطبِّق <code>FieldTypeStrategy</code> + إضافة سطر في الـ Factory.
      </DocsCallout>

      <div className="docs-fieldtype-grid">
        {FIELD_TYPES.map((ft) => (
          <div className="card docs-fieldtype-card" key={ft.name}>
            <span className={`docs-fieldtype-badge docs-fieldtype-badge--${ft.variant}`}>{ft.name}</span>
            <div className="docs-fieldtype-desc">{ft.desc}</div>
          </div>
        ))}
      </div>

      <DocsSectionTitle icon="bi-link-45deg" variant="blue">Relation Field — شرح تفصيلي</DocsSectionTitle>
      <DocsTable
        headers={['الخاصية', 'القيم المتاحة', 'المعنى']}
        rows={[
          [<code key="1">relation_type</code>, 'belongs_to | has_many', 'نوع العلاقة'],
          [<code key="2">related_data_type_id</code>, 'integer — exists:data_types,id', 'ID الـ DataType المرتبط'],
          [<code key="3">multiple</code>, 'true | false', 'يسمح بربط أكثر من entry'],
        ]}
      />

      <DocsSectionTitle icon="bi-globe" variant="teal">Translatable Fields</DocsSectionTitle>
      <p className="docs-lead">عندما يكون <code>translatable: true</code>، قيمة الحقل تُرسَل كـ object بالـ locales:</p>
      <DocsCodeBlock language="json" label="JSON — Translatable Value" code={`{
  "values": {
    "12": {  // field_id
      "en": "My First Article",
      "ar": "مقالتي الأولى"
    },
    "13": {  // non-translatable field
      "default": "some-value"
    }
  }
}`} />

      <DocsSectionTitle icon="bi-paperclip" variant="red">File Fields — Upload</DocsSectionTitle>
      <p className="docs-lead">ملفات الـ file fields تُرسَل كـ multipart/form-data بدلاً من JSON:</p>
      <DocsCodeBlock language="text" label="multipart/form-data" code={`Content-Type: multipart/form-data

files[{field_id}][en][0]: (binary file)
files[{field_id}][en][1]: (binary file)
values[{other_field_id}][en]: "text value"`} />
      <p className="docs-lead"><code>FileUploadService</code> يرفع الملف ويُعيد path — يُخزَّن كقيمة عادية في <code>data_entry_values</code>.</p>

      <DocsPrevNext currentPath="/docs/cms/field-types" />
    </div>
  );
}
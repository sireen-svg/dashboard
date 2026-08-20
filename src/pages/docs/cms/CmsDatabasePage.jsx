import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsDbTable from '../../../components/docs/DocsDbTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const ENTITY_RELATIONSHIPS = `// One Project → Many DataTypes
Project (1) ──────→ (N) DataType

// One DataType → Many Fields
DataType (1) ─────→ (N) DataTypeField

// One DataType → Many Entries
DataType (1) ─────→ (N) DataEntry

// One Entry → Many Values (EAV)
DataEntry (1) ────→ (N) DataEntryValue

// Entry to Entry Relations
DataEntry (N) ────→ (M) DataEntry  // via data_entry_relations

// Versioning
DataEntry (1) ────→ (N) DataEntryVersion  // snapshot on every save

// Collections
DataCollection (N) ──→ (M) DataEntry  // via data_collection_items

// Cascade Delete rules
Project deleted → DataTypes deleted → Fields deleted → Entries deleted`;

export default function CmsDatabasePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="CMS Service"
        title="Database"
        highlight="Schema"
        subtitle="الجداول الرئيسية والعلاقات — مأخوذة من الـ migrations الفعلية."
      />

      <DocsSectionTitle icon="bi-hdd-stack" variant="blue">Core Tables</DocsSectionTitle>

      <DocsDbTable
        name="projects"
        description="المشاريع — Multi-tenant root"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'public_id', type: 'varchar(36)', desc: 'UUID — يُستخدَم في الـ APIs العامة', badge: 'UNIQUE' },
          { name: 'slug', type: 'varchar', desc: 'URL-friendly identifier', badge: 'UNIQUE' },
          { name: 'name', type: 'varchar', desc: 'اسم المشروع' },
          { name: 'owner_id', type: 'integer', desc: 'user_id من Auth Service' },
          { name: 'supported_languages', type: 'json', desc: '["ar","en"] — اللغات المدعومة' },
          { name: 'enabled_modules', type: 'json', desc: '["cms","ecommerce","booking"]' },
          { name: 'ratings_count / ratings_avg', type: 'int / decimal', desc: 'Denormalized لأداء أفضل' },
        ]}
      />

      <DocsDbTable
        name="data_types"
        description="Schema definitions — أنواع البيانات"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'project_id', type: 'bigint FK', desc: '→ projects.id (cascade delete)', badge: 'FK' },
          { name: 'name', type: 'varchar', desc: 'اسم عرضي (Article, Product)' },
          { name: 'slug', type: 'varchar', desc: 'URL key — unique per project', badge: 'UNIQUE' },
          { name: 'description', type: 'varchar?', desc: 'وصف اختياري' },
          { name: 'is_active', type: 'boolean', desc: 'default: true' },
          { name: 'settings', type: 'json?', desc: 'إعدادات مخصصة لكل DataType' },
          { name: 'deleted_at', type: 'timestamp?', desc: 'SoftDeletes — يمكن الاسترجاع' },
        ]}
      />

      <DocsDbTable
        name="data_type_fields"
        description="Field definitions per DataType"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'data_type_id', type: 'bigint FK', desc: '→ data_types.id (cascade delete)', badge: 'FK' },
          { name: 'name', type: 'varchar', desc: 'اسم الحقل (title, price, image)' },
          { name: 'type', type: 'varchar', desc: 'text | number | boolean | select | json | relation | file' },
          { name: 'required', type: 'boolean', desc: 'default: false' },
          { name: 'translatable', type: 'boolean', desc: 'يدعم قيم متعددة اللغات' },
          { name: 'validation_rules', type: 'json?', desc: '["min:3","max:255","email"]' },
          { name: 'settings', type: 'json?', desc: 'relation_type, related_data_type_id, multiple, options' },
          { name: 'sort_order', type: 'integer', desc: 'ترتيب عرض الحقول — default: 0' },
        ]}
      />

      <DocsDbTable
        name="data_entries"
        description="المحتوى الفعلي لكل DataType"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'slug', type: 'varchar', desc: 'URL identifier — unique per project', badge: 'UNIQUE' },
          { name: 'data_type_id', type: 'bigint FK', desc: '→ data_types.id', badge: 'FK' },
          { name: 'project_id', type: 'bigint FK', desc: '→ projects.id', badge: 'FK' },
          { name: 'status', type: 'enum', desc: 'draft | published | scheduled | archived — default: draft' },
          { name: 'published_at', type: 'timestamp?', desc: 'يُملأ عند النشر' },
          { name: 'scheduled_at', type: 'timestamp?', desc: 'تاريخ النشر المجدوَل' },
          { name: 'created_by / updated_by', type: 'bigint? FK', desc: '→ users — تتبع من أنشأ وعدَّل' },
          { name: 'ratings_count / ratings_avg', type: 'int / decimal(3,2)', desc: 'Denormalized ratings للأداء' },
          { name: 'deleted_at', type: 'timestamp?', desc: 'SoftDeletes' },
        ]}
      />

      <DocsDbTable
        name="data_entry_values"
        description="قيم الحقول — EAV pattern"
        fields={[
          { name: 'data_entry_id', type: 'bigint FK', desc: '→ data_entries.id', badge: 'FK' },
          { name: 'data_type_field_id', type: 'bigint FK', desc: '→ data_type_fields.id', badge: 'FK' },
          { name: 'locale', type: 'varchar', desc: '"en" | "ar" | "default"' },
          { name: 'value', type: 'text', desc: 'القيمة كـ string — يُحوَّل حسب نوع الحقل' },
        ]}
      />

      <DocsSectionTitle icon="bi-diagram-2" variant="blue">Entity Relationships</DocsSectionTitle>
      <DocsCodeBlock language="text" label="Entity Relationships" code={ENTITY_RELATIONSHIPS} />

      <DocsCallout type="info">
        <strong>EAV Pattern:</strong> القيم لا تُخزَّن كـ columns في الـ entries table. بدلاً من ذلك، كل قيمة هي صف في{' '}
        <code>data_entry_values</code> مع field_id + locale + value. هذا يُمكِّن الـ Schema Builder من إضافة fields
        دون migrations.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/cms/database" />
    </div>
  );
}
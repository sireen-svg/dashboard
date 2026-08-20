import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const SCHEMA_FLOW = [
  { label: 'DataType A', sub: 'Article', variant: 'accent' },
  { label: 'Relation Field', sub: 'type: relation' },
  { label: 'DataType B', sub: 'Author', variant: 'teal' },
  { label: 'data_type_relations', sub: 'schema level', variant: 'green' },
];

const RUNTIME_FLOW = [
  { label: 'Entry A', sub: 'Article #88', variant: 'accent' },
  { label: 'relations array', sub: 'في store request' },
  { label: 'data_entry_relations', sub: 'runtime level', variant: 'green' },
  { label: 'Entry B', sub: 'Author #5', variant: 'teal' },
];

const RELATIONS_JSON = `{
  "values": { ... },
  "relations": [
    {
      "relation_id":      3,        // field_id of relation field
      "related_entry_ids": [5]      // IDs of related entries
    },
    {
      "relation_id":      4,        // category field
      "related_entry_ids": [10, 11]  // multiple categories
    }
  ]
}`;

export default function CmsRelationsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'Entries', to: '/docs/cms/entries' }, { label: 'Relations' }]}
        eyebrow="Content"
        title="Entry"
        highlight="Relations"
        subtitle="ربط الـ entries ببعضها عبر DataType Relations — Author لـ Article، Category لـ Product."
      />

      <DocsSectionTitle icon="bi-link-45deg" variant="blue">كيف تعمل Relations؟</DocsSectionTitle>
      <DocsFlowDiagram steps={SCHEMA_FLOW} />
      <DocsFlowDiagram steps={RUNTIME_FLOW} />

      <DocsSectionTitle>إنشاء Relation عند Store</DocsSectionTitle>
      <DocsCodeBlock language="json" label="JSON — Relations in Entry Store" code={RELATIONS_JSON} />

      <DocsCallout type="tip">
        <strong>two-pass provisioning في AI:</strong> عندما يُنشئ AI مشروعاً، تُنشأ DataTypes أولاً (first pass) ثم
        تُعالَج الـ Relation fields بعدها (second pass) — لأن الـ related_data_type_id يجب أن يكون موجوداً قبل إنشاء
        الـ field.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/cms/relations" />
    </div>
  );
}
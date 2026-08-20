import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsLayerStack from '../../../components/docs/DocsLayerStack';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsHeaderBox from '../../../components/docs/DocsHeaderBox';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const FLOW = [
  { label: 'Project', sub: 'public_id + modules', variant: 'accent' },
  { label: 'DataType', sub: 'Article / Product / Hotel' },
  { label: 'Fields', sub: 'text/number/relation' },
  { label: 'Data Entry', sub: 'Draft → Published' },
  { label: 'Search Index', sub: 'auto-indexed', variant: 'teal' },
  { label: 'Version Saved', sub: 'auto-snapshot', variant: 'green' },
];

const LAYERS = [
  { name: 'AI Domain', chips: ['AIProviderChain', 'AiConversationService', 'ProvisionProjectFromSchemaAction'] },
  { name: 'CMS Domain', chips: ['DataTypeService', 'DataEntryService', 'FieldService', 'DataCollectionService', 'State Machine', 'Versioning'] },
  { name: 'Search Domain', chips: ['SearchService', 'SearchResultRanker', 'IntentDetector', 'SearchCacheService'] },
  { name: 'Subscription Domain', chips: ['PlanService', 'SubscriptionService', 'FeatureRuleService'] },
  { name: 'Payment Domain', chips: ['PaymentService', 'GatewayAbstraction', 'InstallmentService'] },
  { name: 'Analytics', chips: ['6 Actions', 'AdminOverviewAction', 'ContentSummaryAction', 'RatingsReportAction'] },
];

const MIDDLEWARE_ROWS = [
  { key: 'resolve.project', value: 'يقرأ X-Project-ID أو project من الـ JWT', note: 'على كل /cms/* routes' },
  { key: 'auth.user', value: 'يتحقق من Bearer token وuser identity', note: 'على كل protected routes' },
  { key: 'permission:cms.datatype.create', value: 'يتحقق من صلاحية إنشاء DataType', note: 'POST /cms/data-types فقط' },
  { key: 'permission:cms.datatype.update', value: 'يتحقق من صلاحية تعديل DataType', note: 'PUT /cms/data-types/{id}' },
  { key: 'permission:cms.datatype.delete', value: 'يتحقق من صلاحية حذف DataType', note: 'DELETE /cms/data-types/{id}' },
];

export default function CmsArchitecturePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="CMS Service"
        title="Architecture"
        highlight="& Data Flow"
        subtitle="كيف تتدفق البيانات من إنشاء المشروع حتى نشر المحتوى."
      />

      <DocsSectionTitle icon="bi-arrow-repeat" variant="blue">Data Flow الكامل</DocsSectionTitle>
      <DocsFlowDiagram steps={FLOW} />

      <DocsSectionTitle icon="bi-bank" variant="teal">Domain Structure</DocsSectionTitle>
      <DocsLayerStack layers={LAYERS} />

      <DocsSectionTitle icon="bi-key" variant="green">Middleware Stack — CMS Endpoints</DocsSectionTitle>
      <DocsCallout type="info">
        كل <code>/api/cms/*</code> endpoint يمر عبر: <strong>resolve.project</strong> (يحدد currentProject) →{' '}
        <strong>auth.user</strong> (يتحقق من JWT وuser) → <strong>permission:{'{name}'}</strong> (اختياري على بعض
        الـ endpoints).
      </DocsCallout>
      <DocsHeaderBox rows={MIDDLEWARE_ROWS} />

      <DocsPrevNext currentPath="/docs/cms/architecture" />
    </div>
  );
}
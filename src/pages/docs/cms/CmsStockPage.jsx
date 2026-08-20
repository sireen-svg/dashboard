import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function CmsStockPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'CMS', to: '/docs/cms' }, { label: 'Stock Control' }]}
        eyebrow="E-Commerce Integration"
        title="Stock"
        highlight="Control"
        subtitle="CMS يُدير الـ stock لـ E-Commerce — خصم المخزون يحدث في CMS بعد checkout."
      />

      <DocsCallout type="info">
        <strong>Cross-Service:</strong> E-Commerce يُنفِّذ checkout ثم يستدعي CMS لخصم الـ stock. هذا يضمن أن الـ
        stock الحقيقي مُخزَّن ومُدار في CMS كـ DataEntry field.
      </DocsCallout>

      <DocsEndpointCard method="POST" path="/api/cms/stock/decrement" authTag="🔐 auth.user + resolve.project" authTone="protected" description="خصم المخزون — بعد checkout" defaultOpen>
        <DocsCodeBlock language="json" code={`{
  "entry_slug": "product-xyz",
  "quantity":   2,
  "field_name": "stock_quantity"
}`} />
        <DocsCallout type="warn">
          <strong>E-Commerce يُنفِّذ two-step stock check:</strong> (1) يتحقق من الـ stock قبل الدفع. (2) يخصم الـ
          stock بعد نجاح الدفع عبر هذا الـ endpoint — يمنع الـ overselling.
        </DocsCallout>
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/cms/stock" />
    </div>
  );
}
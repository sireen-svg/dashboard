import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommercePricingPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Pricing API' }]}
        eyebrow="E-Commerce"
        title="Pricing"
        highlight="API"
      />

      <DocsEndpointCard method="POST" path="/api/ecommerce/pricing/calculate" authTag="🔐 ecommerce.enabled" authTone="protected" description="حساب الأسعار بعد الـ offers" defaultOpen>
        <DocsParamTable
          rows={[
            { field: 'entry_ids', required: true, type: 'array', notes: 'array of integers' },
            { field: 'code', required: false, type: 'string', notes: 'كود خصم اختياري' },
          ]}
        />
        <DocsCodeBlock language="json" code={`{ "entry_ids": [55, 56, 57] }`} />

        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <>
                  <DocsCodeBlock language="json" code={`{
  "items": [
    { "product_id": 55, "title": "MacBook Pro", "price": 1039.20, "quantity": 1, "total": 1039.20, "count": 15 },
    { "product_id": 56, "title": "Mouse",      "price": 29.99,  "quantity": 2, "total": 59.98,  "count": 42 }
  ],
  "total": 1099.18
}`} />
                  <DocsCallout type="info">
                    <strong>count:</strong> الـ stock المتبقي من CMS — يُستخدَم في Step 3 من Checkout لمنع الـ
                    overselling.
                  </DocsCallout>
                </>
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/pricing" />
    </div>
  );
}
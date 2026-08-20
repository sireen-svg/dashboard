import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsParamTable from '../../../components/docs/DocsParamTable';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceProductsPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Products API' }]}
        eyebrow="E-Commerce"
        title="Products"
        highlight="API"
      />

      <DocsCallout type="info">
        <strong>Products = CMS DataEntries:</strong> المنتجات ليست في E-Commerce DB. ProductController يستدعي
        CMSApiClient لجلب DataEntries من نوع محدد مع بيانات الـ offer المطبَّق.
      </DocsCallout>

      <DocsEndpointCard method="GET" path="/api/ecommerce/products/{dataTypeSlug}" authTag="🔐 ecommerce.enabled" authTone="protected" description="منتجات DataType محدد" defaultOpen>
        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>URL Parameters</div>
        <DocsParamTable rows={[{ field: 'dataTypeSlug', required: true, type: 'string', notes: 'slug الـ DataType في CMS مثل "product" أو "laptop"' }]} />

        <div className="docs-lead" style={{ fontWeight: 500, color: 'var(--fb-text-primary)', marginBottom: 8 }}>Query Parameters</div>
        <DocsParamTable rows={[{ field: 'code', required: false, type: 'string', notes: 'كود خصم — لو موجود يطبق الـ code offer على الأسعار' }]} />

        <DocsResponseTabs
          tabs={[
            {
              key: 'ok',
              label: '✅ 200 OK',
              tone: 'success',
              content: (
                <DocsCodeBlock language="json" code={`[
  {
    "id":           55,
    "slug":         "macbook-pro-14",
    "data_type":    "laptop",
    "values": {
      "name":         "MacBook Pro 14",
      "price":        1299.00,
      "stock":        15,
      "description":  "Apple M3 chip..."
    },
    "offer_applied": {
      "type":          "percentage",
      "discount":      20,
      "final_price":   1039.20
    }
  }
]`} />
              ),
            },
            {
              key: 'err',
              label: '❌ Errors',
              tone: 'error',
              content: (
                <DocsCodeBlock language="json" code={`{ "message": "Forbidden" }  // 403 — ecommerce not enabled
{ "message": "DataType not found" }  // 404 — from CMS`} />
              ),
            },
          ]}
        />
      </DocsEndpointCard>

      <DocsPrevNext currentPath="/docs/ecommerce/products" />
    </div>
  );
}
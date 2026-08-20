import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsEndpointCard from '../../../components/docs/DocsEndpointCard';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsResponseTabs from '../../../components/docs/DocsResponseTabs';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcommerceWishlistPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        breadcrumb={[{ label: 'E-Commerce', to: '/docs/ecommerce' }, { label: 'Wishlist API' }]}
        eyebrow="E-Commerce"
        title="Wishlist"
        highlight="API"
      />

      <DocsEndpointCard method="POST" path="/api/ecommerce/wishlists" authTag="🔐 ecommerce.enabled" authTone="protected" description="إنشاء wishlist" defaultOpen>
        <DocsCodeBlock language="json" code={`{ "name": "Electronics Wishlist", "is_private": false }`} />
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 201', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Wishlist created successfully.",
  "data": {
    "id": 5, "user_id": 42, "name": "Electronics Wishlist", "items": [], "share_token": null
  }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="GET" path="/api/ecommerce/wishlists" authTag="🔐 ecommerce.enabled" authTone="protected" description="كل wishlists المستخدم">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: <DocsCodeBlock language="json" code={`{ "message": "Wishlists fetched successfully.", "data": [{/* wishlists */}] }`} />,
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/wishlists/{wishlistId}/share-link" authTag="🔐 ecommerce.enabled" authTone="protected" description="توليد رابط مشاركة">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: <DocsCodeBlock language="json" code={`{ "share_url": "https://api.hypercore.io/api/ecommerce/wishlists/shared/abc123xyz" }`} />,
          },
        ]} />
      </DocsEndpointCard>

      <DocsEndpointCard method="POST" path="/api/ecommerce/wishlists/{wishlistId}/items/{itemId}/move-to-cart" authTag="🔐 ecommerce.enabled" authTone="protected" description="نقل item لـ Cart">
        <DocsResponseTabs tabs={[
          {
            key: 'ok', label: '✅ 200', tone: 'success',
            content: (
              <DocsCodeBlock language="json" code={`{
  "message": "Item moved to cart successfully.",
  "data": { /* updated cart */ }
}`} />
            ),
          },
        ]} />
      </DocsEndpointCard>

      <DocsCallout type="info">
        <strong>Shared Wishlist (Public):</strong> <code>GET /wishlists/shared/{'{shareToken}'}</code> — عام بدون
        authentication، يُعيد قائمة الـ items فقط.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/ecommerce/wishlist" />
    </div>
  );
}
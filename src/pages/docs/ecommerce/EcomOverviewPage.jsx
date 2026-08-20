import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsStatsRow from '../../../components/DocsStatsRow';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsCardGrid from '../../../components/docs/DocsCardGrid';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const STATS = [
  { value: '7', label: 'Order Statuses' },
  { value: '5', label: 'Benefit Types' },
  { value: '8', label: 'Pipeline Steps' },
  { value: '6', label: 'Analytics Reports' },
  { value: 'CB', label: 'Circuit Breaker' },
];

const ENTITIES = [
  { title: 'Cart', body: 'سلة تسوق واحدة لكل (user+project). يُخزَّن item_id فقط — السعر من CMS.', icon: 'bi-cart3', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)', to: '/docs/ecommerce/cart' },
  { title: 'Checkout Pipeline', body: '8 خطوات atomically في DB Transaction — stock check، payment، order creation.', icon: 'bi-credit-card', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)', to: '/docs/ecommerce/checkout' },
  { title: 'Orders', body: '7 حالات: pending → paid → shipped → delivered → cancelled → returned → partially_returned', icon: 'bi-clipboard-check', bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)', to: '/docs/ecommerce/orders' },
  { title: 'Offers', body: '5 benefit types: percentage، fixed_amount، buy_x_get_y، quantity، total_price', icon: 'bi-tag', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)', to: '/docs/ecommerce/offers' },
  { title: 'Wishlist', body: 'قوائم مفضلة مع share links، reorder، وMove to Cart مباشرة.', icon: 'bi-heart', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)', to: '/docs/ecommerce/wishlist' },
  { title: 'Returns', body: 'طلبات إرجاع جزئية أو كاملة — pending → approved/rejected', icon: 'bi-arrow-return-left', bg: 'var(--fb-purple-bg)', fg: 'var(--fb-purple)', to: '/docs/ecommerce/returns' },
];

export default function EcomOverviewPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="E-Commerce Service"
        title="E-Commerce"
        highlight="Module"
        subtitle="نظام تجارة إلكترونية متكامل مبني على CMS كـ data layer — Cart، Checkout pipeline، Offers بـ 5 benefit types، Wishlist، Returns، وAnalytics كاملة."
      />

      <DocsStatsRow stats={STATS} />

      <DocsCallout type="info">
        <strong>ecommerce.enabled Middleware:</strong> كل endpoint يمر عبر <code>resolve.project</code> +{' '}
        <code>auth.user</code> + <code>ecommerce.enabled</code>. لو الـ module غير مُفعَّل للمشروع — يُعيد 403 مباشرة.
      </DocsCallout>
      <DocsCallout type="info">
        <strong>CMS Integration:</strong> المنتجات ليست في E-Commerce DB — هي DataEntries في CMS. E-Commerce يجلبها
        عبر CMSApiClient ويحسب أسعارها. Stock يُخزَّن كـ field في الـ DataEntry.
      </DocsCallout>

      <DocsSectionTitle icon="bi-box-seam" variant="blue">Core Entities</DocsSectionTitle>
      <DocsCardGrid items={ENTITIES} columns={3} />

      <DocsPrevNext currentPath="/docs/ecommerce" />
    </div>
  );
}
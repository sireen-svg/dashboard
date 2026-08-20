import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsFlowDiagram from '../../../components/docs/DocsFlowDiagram';
import DocsStepList from '../../../components/docs/DocsStepList';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsCodeBlock from '../../../components/docs/DocsCodeBlock';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

const BUSINESS_FLOW = [
  { label: 'Product (CMS)', sub: 'DataEntry', variant: 'accent' },
  { label: 'Cart', sub: 'item_id + qty' },
  { label: 'Pricing', sub: 'Offers applied', variant: 'amber' },
  { label: 'Checkout', sub: '8-step pipeline', variant: 'accent' },
  { label: 'Order', sub: 'pending/paid', variant: 'green' },
  { label: 'Fulfillment', sub: 'shipped/delivered', variant: 'teal' },
];

const PIPELINE_STEPS = [
  { name: 'Load Cart & Verify Ownership', desc: <><code>cartRepo-&gt;loadItems(findById(dto-&gt;cart_id))</code> — يتحقق من وجود السلة وانتمائها للمستخدم</>, fail: '→ Exception: "Cart is empty" | "Unauthorized cart"' },
  { name: 'Calculate Pricing with Offers', desc: <><code>CalculateCartPricingAction::execute($cart)</code> — يجلب أسعار المنتجات من CMS ويطبق الـ offers</> },
  { name: '✅ Stock Validation — قبل الدفع', desc: <>يتحقق من <code>item[&#39;quantity&#39;] &gt; item[&#39;count&#39;]</code> لكل منتج. هذا يمنع الـ overselling قبل أن يُخصم أي مبلغ.</>, fail: '→ Exception: "Product X only has N left"', tone: 'teal' },
  { name: 'Process Payment (if online)', desc: <><code>PaymentService::processPayment(PaymentDTO)</code> — gateway: stripe | paypal | wallet. COD يتخطى هذه الخطوة.</>, fail: '→ Exception: "Payment failed" لو status ليس paid/pending' },
  { name: '✅ Decrement Stock in CMS', desc: <><code>UpdateStockInCMSAction::execute($items)</code> — يخصم الكمية من الـ DataEntry field في CMS عبر CMSApiClient</>, tone: 'teal' },
  { name: 'Create Order', desc: 'status: "pending" (COD) أو payment status (online). يُخزَّن total_price + address + currency' },
  { name: 'Create Order Items', desc: 'لكل item: product_id، quantity، price، total، status: "pending"' },
  { name: '✅ Delete Cart + Invalidate Cache', desc: 'يحذف الـ cart + يُلغي: cart cache، user orders cache، stock cache لكل منتج، admin_orders cache tags', ok: '→ SystemLogEvent: create_order', tone: 'green' },
];

const ORDER_LIFECYCLE_1 = [
  { label: 'pending', sub: 'COD أو payment pending', variant: 'amber' },
  { label: 'paid', sub: 'Payment confirmed', variant: 'accent' },
  { label: 'shipped', sub: 'In transit', variant: 'teal' },
  { label: 'delivered', sub: 'Received', variant: 'green' },
];

const ORDER_LIFECYCLE_2 = [
  { label: 'cancelled', sub: 'قبل الشحن', variant: 'red' },
  { label: 'returned', sub: 'إرجاع كامل', variant: 'red' },
  { label: 'partially_returned', sub: 'إرجاع جزئي', variant: 'amber' },
];

const CIRCUIT_BREAKER = [
  { label: 'closed', sub: 'يعمل طبيعياً', variant: 'accent' },
  { label: 'open', sub: 'مغلق — 5 دقائق cooldown', variant: 'red' },
  { label: 'half-open', sub: 'يجرب request واحد', variant: 'amber' },
];

const BENEFIT_TYPES = [
  { name: 'percentage', desc: 'خصم بنسبة مئوية على السعر الأصلي', example: '{"percentage": 20} → -20%', variant: 'blue' },
  { name: 'fixed_amount', desc: 'خصم بمبلغ ثابت', example: '{"fixed_amount": 15} → -$15', variant: 'green' },
  { name: 'buy_x_get_y', desc: 'اشتر X احصل على Y مجاناً', example: '{"targeted_item":1,"acquired_item":2}', variant: 'amber' },
  { name: 'quantity', desc: 'خصم عند شراء كمية معينة', example: '{"quantity":3,"discount_type":"percentage","discount_value":10}', variant: 'teal' },
  { name: 'total_price', desc: 'خصم عند تجاوز مبلغ معين', example: '{"total_price":100,"discount_type":"fixed_amount","discount_value":20}', variant: 'purple' },
  { name: 'code offer', desc: 'is_code_offer=true → كود خصم محدد الوقت', example: 'offer_duration: بالساعات', variant: 'red' },
];

const CACHE_KEYS = `"user:{userId}:project:{projectId}:cart"       // TTL_SHORT = 300s (5 min)
"user:{userId}:project:{projectId}:orders"     // user orders list
"user:{userId}:orders:{orderId}"               // single order
"project:{projectId}:admin:orders:{hash}"      // admin orders (Cache Tags)
"project:{projectId}:offers"                   // all offers
"offers:slug:{slug}"                           // single offer by slug
"stock:ids:md5({productId})"                   // stock count — invalidated on checkout`;

export default function EcomArchitecturePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero eyebrow="E-Commerce" title="Architecture &" highlight="Flows" />

      <DocsSectionTitle icon="bi-arrow-repeat" variant="blue">Complete Business Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={BUSINESS_FLOW} />

      <DocsSectionTitle icon="bi-credit-card" variant="amber">Checkout Pipeline — 8 Steps</DocsSectionTitle>
      <DocsStepList steps={PIPELINE_STEPS} />
      <DocsCallout type="tip">
        كل الخطوات داخل <code>DB::transaction()</code> — أي فشل يُتراجع عن كل شيء.
      </DocsCallout>

      <DocsSectionTitle icon="bi-clipboard-check" variant="green">Order Lifecycle</DocsSectionTitle>
      <DocsFlowDiagram steps={ORDER_LIFECYCLE_1} />
      <DocsFlowDiagram steps={ORDER_LIFECYCLE_2} />

      <DocsSectionTitle icon="bi-tag" variant="amber">Offer Types — BenefitStrategyFactory</DocsSectionTitle>
      <div className="docs-benefit-grid">
        {BENEFIT_TYPES.map((b) => (
          <div className="card docs-benefit-card" key={b.name}>
            <span className={`docs-benefit-badge docs-benefit-badge--${b.variant}`}>{b.name}</span>
            <div className="docs-benefit-desc">{b.desc}</div>
            <div className="docs-benefit-example">{b.example}</div>
          </div>
        ))}
      </div>

      <DocsSectionTitle icon="bi-lightning-charge" variant="red">Circuit Breaker — 3 States</DocsSectionTitle>
      <DocsFlowDiagram steps={CIRCUIT_BREAKER} />
      <DocsCallout type="warn">
        <strong>ملاحظة:</strong> الـ Circuit Breaker state مُخزَّن في MySQL (جدول <code>circuit_breakers</code>) — كل
        فحص يتطلب DB query. يُنصَح بنقله لـ Redis في الإنتاج.
      </DocsCallout>

      <DocsSectionTitle icon="bi-hdd-stack" variant="teal">Cache Strategy</DocsSectionTitle>
      <DocsCodeBlock language="text" code={CACHE_KEYS} />

      <DocsPrevNext currentPath="/docs/ecommerce/architecture" />
    </div>
  );
}
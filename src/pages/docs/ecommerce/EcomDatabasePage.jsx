import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsDbTable from '../../../components/docs/DocsDbTable';
import DocsCallout from '../../../components/docs/DocsCallout';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcomDatabasePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero eyebrow="E-Commerce" title="Database" highlight="Schema" subtitle="7 جداول رئيسية — لا يوجد جدول products، المنتجات تأتي من CMS." />

      <DocsSectionTitle icon="bi-hdd-stack" variant="blue">Core Tables</DocsSectionTitle>

      <DocsDbTable
        name="carts"
        description="سلة واحدة نشطة لكل (user_id, project_id)"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'user_id', type: 'integer', desc: 'من Auth Service' },
          { name: 'project_id', type: 'bigint FK', desc: '→ projects.id', badge: 'FK' },
          { name: 'created_at', type: 'timestamp', desc: '' },
        ]}
      />

      <DocsDbTable
        name="cart_items"
        description="عناصر السلة"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'cart_id', type: 'bigint FK', desc: '→ carts.id', badge: 'FK' },
          { name: 'product_id', type: 'bigint', desc: 'DataEntry ID في CMS (لا FK حقيقي)' },
          { name: 'quantity', type: 'integer', desc: 'min:1' },
        ]}
      />

      <DocsDbTable
        name="orders"
        description="الطلبات"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'user_id', type: 'integer', desc: '' },
          { name: 'project_id', type: 'bigint FK', desc: '→ projects.id', badge: 'FK' },
          { name: 'status', type: 'enum', desc: 'pending|paid|shipped|delivered|cancelled|returned|partially_returned' },
          { name: 'total_price', type: 'decimal(10,2)', desc: '' },
          { name: 'currency', type: 'varchar(3)', desc: 'USD, SAR, JOD...' },
          { name: 'address', type: 'json', desc: 'عنوان الشحن كاملاً' },
        ]}
      />

      <DocsDbTable
        name="order_items"
        description="عناصر الطلب — snapshot من السعر لحظة الشراء"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'order_id', type: 'bigint FK', desc: '→ orders.id', badge: 'FK' },
          { name: 'product_id', type: 'bigint', desc: 'DataEntry ID في CMS' },
          { name: 'quantity', type: 'integer', desc: '' },
          { name: 'price', type: 'decimal(10,2)', desc: 'سعر الوحدة لحظة الشراء (snapshot)' },
          { name: 'total', type: 'decimal(10,2)', desc: 'price × quantity' },
          { name: 'status', type: 'enum', desc: 'pending|returned — مستقل عن حالة order الأم' },
        ]}
      />

      <DocsDbTable
        name="payments"
        description="سجلات الدفع"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'order_id', type: 'bigint FK', desc: '→ orders.id', badge: 'FK' },
          { name: 'gateway', type: 'varchar', desc: 'stripe | paypal | wallet | cod' },
          { name: 'amount', type: 'decimal(10,2)', desc: '' },
          { name: 'status', type: 'enum', desc: 'pending|succeeded|failed|refunded' },
          { name: 'transaction_id', type: 'varchar?', desc: 'من الـ gateway' },
        ]}
      />

      <DocsDbTable
        name="offers"
        description="العروض والخصومات"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'project_id', type: 'bigint FK', desc: '→ projects.id', badge: 'FK' },
          { name: 'slug', type: 'varchar', desc: 'unique per project', badge: 'UNIQUE' },
          { name: 'benefit_type', type: 'enum', desc: 'percentage|fixed_amount|buy_x_get_y|quantity|total_price' },
          { name: 'benefit_config', type: 'json', desc: 'إعدادات خاصة بكل نوع' },
          { name: 'is_code_offer', type: 'boolean', desc: 'يحتاج كود تفعيل' },
          { name: 'is_active', type: 'boolean', desc: '' },
        ]}
      />

      <DocsDbTable
        name="return_requests"
        description="طلبات الإرجاع"
        fields={[
          { name: 'id', type: 'bigint', desc: 'Primary key', badge: 'PK' },
          { name: 'order_id', type: 'bigint FK', desc: '→ orders.id', badge: 'FK' },
          { name: 'status', type: 'enum', desc: 'pending|approved|rejected' },
          { name: 'reason', type: 'text', desc: '' },
          { name: 'items', type: 'json', desc: '[{order_item_id, quantity}] — لدعم الإرجاع الجزئي' },
        ]}
      />

      <DocsCallout type="info">
        <strong>لا يوجد جدول products.</strong> المنتجات هي DataEntries من نوع "Product" في CMS. E-Commerce يخزّن
        فقط <code>product_id</code> (DataEntry ID) في <code>cart_items</code> و<code>order_items</code> — بدون
        foreign key حقيقي عبر الخدمات.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/ecommerce/database" />
    </div>
  );
}
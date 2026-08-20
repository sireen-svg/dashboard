import DocsPageHero from '../../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../../components/docs/DocsSectionTitle';
import DocsTable from '../../../components/docs/DocsTable';
import DocsPrevNext from '../../../components/docs/DocsPrevNext';

export default function EcomBusinessLogicPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero eyebrow="E-Commerce" title="Business" highlight="Logic" subtitle="القواعد التي تحكم السلوك عبر كل الـ endpoints." />

      <DocsSectionTitle icon="bi-cart-check" variant="blue">Cart Rules</DocsSectionTitle>
      <DocsTable
        headers={['القاعدة', 'التفاصيل']}
        rows={[
          ['سلة واحدة نشطة', 'كل (user, project) له سلة واحدة فقط — تُنشأ تلقائياً عند أول إضافة'],
          ['لا يُخزَّن السعر في السلة', 'السعر يُحسَب حية عند كل عملية عرض/checkout من CMS + Offers'],
          ['Stock check عند الإضافة', 'يتحقق من توفر الكمية المطلوبة قبل الإضافة للسلة'],
        ]}
      />

      <DocsSectionTitle icon="bi-tag" variant="amber">Offer Application Rules</DocsSectionTitle>
      <DocsTable
        headers={['القاعدة', 'التفاصيل']}
        rows={[
          ['أفضل عرض فقط', 'لو ينطبق أكثر من عرض على نفس المنتج، يُطبَّق العرض الأعلى قيمة فقط'],
          ['Code Offers منفصلة', 'عروض الأكواد لا تُطبَّق تلقائياً — تحتاج إرسال الكود صراحة عند checkout'],
          ['التحقق من is_active وexpiry', 'العرض المنتهي أو غير المُفعَّل لا يُطبَّق حتى لو استُخدم الكود'],
        ]}
      />

      <DocsSectionTitle icon="bi-shield-check" variant="green">Stock & Overselling Prevention</DocsSectionTitle>
      <DocsTable
        headers={['القاعدة', 'التفاصيل']}
        rows={[
          ['فحص مزدوج', 'مرة عند الإضافة للسلة، ومرة أخرى (نهائية) داخل checkout pipeline قبل الدفع'],
          ['خصم بعد الدفع فقط', 'الـ stock يُخصَم في CMS بعد نجاح الدفع مباشرة — وليس عند إنشاء الطلب'],
        ]}
      />

      <DocsSectionTitle icon="bi-arrow-return-left" variant="red">Return & Cancellation Rules</DocsSectionTitle>
      <DocsTable
        headers={['القاعدة', 'التفاصيل']}
        rows={[
          ['إرجاع جزئي مدعوم', 'يمكن إرجاع بعض عناصر الطلب فقط — order_items.status مستقل لكل عنصر'],
          ['الإلغاء قبل الشحن فقط', 'الطلب بحالة shipped أو delivered لا يمكن إلغاؤه — فقط إرجاعه'],
        ]}
      />

      <DocsPrevNext currentPath="/docs/ecommerce/business-logic" />
    </div>
  );
}
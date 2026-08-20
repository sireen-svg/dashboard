import DocsPageHero from '../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../components/docs/DocsSectionTitle';
import DocsStatsRow from '../../components/docs/DocsStatsRow.jsx';
import DocsCardGrid from '../../components/docs/DocsCardGrid';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsPrevNext from '../../components/docs/DocsPrevNext';

const STATS = [
  { value: '5', suffix: '×', label: 'Microservices مستقلة' },
  { value: '80', suffix: '+', label: 'API Endpoints' },
  { value: '569', label: 'Test Files (PCOV)' },
  { value: 'RS256', label: 'JWT Algorithm' },
  { value: '88', suffix: '%', label: 'Search perf. boost' },
];

const MODULES = [
  { title: 'Auth Service', body: 'JWT RS256، session management، RBAC، service-to-service auth', icon: 'bi-shield-lock', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)', to: '/docs/auth' },
  { title: 'CMS Service', body: 'Dynamic schema builder، AI provisioning، versioning، analytics', icon: 'bi-file-earmark-richtext', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)', to: '/docs/cms' },
  { title: 'E-Commerce', body: 'Cart، checkout pipeline، offers، orders، returns، analytics', icon: 'bi-cart3', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)', to: '/docs/ecommerce' },
  { title: 'Booking', body: 'Resources، slots، cancellations، reschedule، refund policies', icon: 'bi-calendar-check', bg: 'var(--fb-green-bg)', fg: 'var(--fb-green)', to: '/docs/booking' },
  { title: 'AI Agents', body: 'توليد مشاريع من اللغة الطبيعية — Gemini + OpenRouter fallback', icon: 'bi-robot', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)', to: '/docs/ai-agents' },
  { title: 'IR Search Engine', body: '9 ranking signals، intent detection، typo correction ثنائي اللغة', icon: 'bi-search', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)', to: '/docs/search-engine' },
];

export default function IntroductionPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="Documentation · v1.0"
        title="Welcome to"
        highlight="HyperCore"
        subtitle="منصة backend headless متكاملة ومُعيَّرة صناعياً. تُولِّد أنظمة backend جاهزة بالكامل — مع AI Agents، محرك بحث IR متقدم، وبنية microservices قابلة للتوسع."
      />

      <DocsStatsRow stats={STATS} />

      <p className="docs-lead">
        HyperCore تُمكِّن الشركات من توليد وتهيئة أنظمة backend متكاملة في وقت قياسي. بدلاً من البناء من الصفر،
        تُوفِّر المنصة وحدات جاهزة للتهيئة — إدارة محتوى، تجارة إلكترونية، حجوزات، بحث ذكي — كلها متصلة
        بـ AI Agents تقدر تُنشئها بجملة واحدة.
      </p>

      <DocsSectionTitle icon="bi-box-seam" variant="blue">Core Modules</DocsSectionTitle>
      <DocsCardGrid items={MODULES} columns={2} />

      <DocsCallout type="info">
        <strong>Headless First:</strong> HyperCore يُركِّز بالكامل على الـ backend APIs — لا frontend dependency.
        يمكن ربطه بأي frontend framework، mobile app، أو third-party integration.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/introduction" />
    </div>
  );
}
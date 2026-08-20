import DocsPageHero from '../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../components/docs/DocsSectionTitle';
import DocsLayerStack from '../../components/docs/DocsLayerStack';
import DocsFlowDiagram from '../../components/docs/DocsFlowDiagram';
import DocsCardGrid from '../../components/docs/DocsCardGrid';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsPrevNext from '../../components/docs/DocsPrevNext';

const LAYERS = [
  { name: 'HTTP Layer', chips: ['Controllers', 'Form Requests', 'Middleware', 'DTOs'] },
  { name: 'Service Layer', chips: ['Business Orchestration', 'Transaction Management', 'Cross-domain coordination'] },
  { name: 'Actions Layer', chips: ['Single-use-case classes', 'SRP enforced', 'Reusable across services'] },
  { name: 'Repository Layer', chips: ['Interfaces', 'Eloquent Implementations', 'Testable via mocking'] },
  { name: 'Domain Layer', chips: ['Models', 'DTOs', 'Events', 'States'] },
];

const FLOW_STEPS = [
  { label: 'Client', sub: 'Any Frontend / App', variant: 'accent' },
  { label: 'Auth Service', sub: 'JWT Validate' },
  { label: 'Target Service', sub: 'CMS / Booking / etc' },
  { label: 'RabbitMQ', sub: 'Async Events' },
  { label: 'Logging Service', sub: 'Persist logs', variant: 'teal' },
];

const TECH_STACK = [
  { title: 'PHP 8.2 / Laravel 11', body: 'Alpine Linux + PHP-FPM', icon: 'bi-code-slash', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  { title: 'MySQL + Redis', body: 'Primary DB + Caching layer', icon: 'bi-hdd-stack', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  { title: 'RabbitMQ', body: 'Persistent async messaging', icon: 'bi-envelope-paper', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)' },
  { title: 'Docker / WSL', body: 'Container per service', icon: 'bi-box', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)' },
];

export default function ArchitecturePage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="Architecture"
        title="System"
        highlight="Architecture"
        subtitle="Hybrid Microservices + Modular DDD — كل service مستقل بالكامل وكل domain منظَّم بـ Domain-Driven Design صارم."
      />

      <DocsSectionTitle icon="bi-bank" variant="blue">Architectural Layers</DocsSectionTitle>
      <p className="docs-lead">كل service داخل HyperCore يُطبِّق نفس الهيكل المطبَّق، من الـ HTTP layer حتى قاعدة البيانات:</p>
      <DocsLayerStack layers={LAYERS} />

      <DocsSectionTitle icon="bi-arrow-repeat" variant="teal">Communication Flow</DocsSectionTitle>
      <DocsFlowDiagram steps={FLOW_STEPS} />

      <DocsCallout type="info">
        <strong>كل request محدد بـ project_id.</strong> الـ <code>resolve.project</code> middleware في كل service
        يُحدِّد السياق تلقائياً من الـ JWT token — يضمن عزل البيانات بين المشاريع.
      </DocsCallout>

      <DocsSectionTitle icon="bi-tools" variant="green">Tech Stack</DocsSectionTitle>
      <DocsCardGrid items={TECH_STACK} columns={4} />

      <DocsPrevNext currentPath="/docs/architecture" />
    </div>
  );
}
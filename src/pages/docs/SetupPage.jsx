import DocsPageHero from '../../components/docs/DocsPageHero';
import DocsSectionTitle from '../../components/docs/DocsSectionTitle';
import DocsCardGrid from '../../components/docs/DocsCardGrid';
import DocsCodeBlock from '../../components/docs/DocsCodeBlock';
import DocsCallout from '../../components/docs/DocsCallout';
import DocsPrevNext from '../../components/docs/DocsPrevNext';

const REQUIREMENTS = [
  { title: 'Docker + WSL2', body: 'Required for containerized services', icon: 'bi-box', bg: 'var(--fb-cyan-bg)', fg: 'var(--fb-cyan)' },
  { title: 'MySQL 8+', body: 'Primary database engine', icon: 'bi-hdd-stack', bg: 'var(--fb-blue-bg)', fg: 'var(--fb-blue)' },
  { title: 'Redis 7+', body: 'Cache & queue driver', icon: 'bi-lightning-charge', bg: 'var(--fb-red-bg)', fg: 'var(--fb-red)' },
  { title: 'RabbitMQ 3.12+', body: 'Message broker for events', icon: 'bi-envelope-paper', bg: 'var(--fb-yellow-bg)', fg: 'var(--fb-yellow)' },
];

const RSA_KEYS_CODE = `# توليد المفاتيح لـ JWT RS256
openssl genrsa -out storage/keys/private.key 2048
openssl rsa -in storage/keys/private.key -pubout -out storage/keys/public.key`;

const ENV_CODE = `APP_KEY=base64:...
APP_URL=http://localhost:8001

DB_HOST=mysql
DB_DATABASE=auth_db
DB_USERNAME=root
DB_PASSWORD=secret

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest

# JWT Config (from config/jwt.php)
JWT_ALGO=RS256
# access_ttl: 15 minutes | refresh_ttl: 10080 minutes (7 days)

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587`;

const START_CODE = `docker-compose up -d

# Migrate كل service بشكل مستقل
cd authservice  && php artisan migrate --seed
cd ../cms       && php artisan migrate --seed
cd ../ecommerce && php artisan migrate
cd ../booking   && php artisan migrate
cd ../logging   && php artisan migrate

# تشغيل Queue Worker للـ Logging Consumer
cd logging && php artisan rabbitmq:consume-logs`;

export default function SetupPage() {
  return (
    <div className="docs-page-inner">
      <DocsPageHero
        eyebrow="Setup"
        title="Installation &"
        highlight="Setup"
        subtitle="متطلبات التشغيل وخطوات الـ setup الكاملة لتشغيل HyperCore محلياً."
      />

      <DocsSectionTitle variant="blue">Requirements</DocsSectionTitle>
      <DocsCardGrid items={REQUIREMENTS} columns={4} />

      <DocsSectionTitle variant="blue">Generate RSA Keys (Auth Service)</DocsSectionTitle>
      <DocsCodeBlock language="bash" code={RSA_KEYS_CODE} />

      <DocsSectionTitle variant="blue">Environment — Auth Service</DocsSectionTitle>
      <DocsCodeBlock language="bash" label=".env — Auth Service" code={ENV_CODE} />

      <DocsSectionTitle variant="blue">Start Services</DocsSectionTitle>
      <DocsCodeBlock language="bash" code={START_CODE} />

      <DocsCallout type="warn">
        <strong>قاعدة بيانات مستقلة لكل service.</strong> Auth Service تستخدم <code>auth_db</code>، CMS تستخدم{' '}
        <code>cms_db</code>، وهكذا. تأكد من إنشاء كل database قبل الـ migrate.
      </DocsCallout>

      <DocsPrevNext currentPath="/docs/setup" />
    </div>
  );
}
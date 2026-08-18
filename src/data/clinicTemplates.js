const field = (name, type, options = {}) => ({
  name,
  type,
  required: options.required ?? false,
  translatable: options.translatable ?? false,
  validation_rules: options.validationRules ?? [],
  settings: options.settings ?? {},
});

const text = (name, options = {}) => field(name, 'text', options);
const richText = (name, options = {}) => field(name, 'text', {
  ...options,
  // HyperCore has one text storage strategy. This supported rule also lets the
  // admin remember that the field should use a multiline editor.
  validationRules: Array.from(new Set([...(options.validationRules ?? []), 'max:65535'])),
});
const file = (name, options = {}) => field(name, 'file', options);

export const CLINIC_CONTENT_TYPES = [
  {
    slug: 'site_settings',
    name: 'Site Settings',
    description: 'Global clinic identity, contact details, social links and default SEO.',
    singleton: true,
    fields: [
      text('clinic_name', { required: true, translatable: true }),
      text('tagline', { translatable: true }),
      file('logo'),
      file('favicon'),
      text('phone'),
      text('email'),
      text('whatsapp'),
      richText('address', { translatable: true }),
      text('map_url'),
      richText('opening_hours', { translatable: true }),
      text('timezone'),
      text('currency'),
      text('instagram_url'),
      text('facebook_url'),
      richText('footer_text', { translatable: true }),
      text('default_meta_title', { translatable: true }),
      richText('default_meta_description', { translatable: true }),
    ],
  },
  {
    slug: 'home_page',
    name: 'Home Page',
    description: 'Editable hero and section headings for the clinic home page.',
    singleton: true,
    fields: [
      text('eyebrow', { translatable: true }),
      text('title', { required: true, translatable: true }),
      richText('subtitle', { translatable: true }),
      file('hero_image'),
      text('primary_cta_label', { translatable: true }),
      text('secondary_cta_label', { translatable: true }),
      text('features_title', { translatable: true }),
      text('services_title', { translatable: true }),
      richText('services_intro', { translatable: true }),
      text('posts_title', { translatable: true }),
      richText('posts_intro', { translatable: true }),
    ],
  },
  {
    slug: 'clinic_features',
    name: 'Clinic Features',
    description: 'Benefits displayed in the Why Choose Us section.',
    fields: [
      text('title', { required: true, translatable: true }),
      richText('description', { translatable: true }),
      text('icon_key'),
      field('display_order', 'number'),
    ],
  },
  {
    slug: 'doctors',
    name: 'Doctors',
    description: 'Doctor profiles and medical credentials.',
    fields: [
      text('name', { required: true, translatable: true }),
      text('specialty', { required: true, translatable: true }),
      richText('short_bio', { translatable: true }),
      richText('full_bio', { translatable: true }),
      file('photo'),
      field('years_experience', 'number'),
      richText('qualifications', { translatable: true }),
      richText('expertise', { translatable: true }),
      text('languages', { translatable: true }),
      text('location', { translatable: true }),
      field('featured', 'boolean'),
    ],
  },
  {
    slug: 'services',
    name: 'Services',
    description: 'Editorial content linked to transactional Booking resources.',
    fields: [
      text('title', { required: true, translatable: true }),
      richText('excerpt', { translatable: true }),
      richText('body', { translatable: true }),
      file('cover_image'),
      text('icon_key'),
      richText('preparation_instructions', { translatable: true }),
      field('featured', 'boolean'),
    ],
  },
  {
    slug: 'post_categories',
    name: 'Post Categories',
    description: 'Categories used to organize health articles.',
    fields: [
      text('title', { required: true, translatable: true }),
      richText('description', { translatable: true }),
      file('image'),
    ],
  },
  {
    slug: 'health_posts',
    name: 'Health Posts',
    description: 'Medical and wellness articles published by the clinic.',
    fields: [
      text('title', { required: true, translatable: true }),
      richText('excerpt', { translatable: true }),
      richText('body', { required: true, translatable: true }),
      file('cover_image'),
      field('reading_time', 'number'),
      field('featured', 'boolean'),
      text('author_name', { translatable: true }),
      text('medical_reviewer', { translatable: true }),
      text('tags', { translatable: true }),
    ],
  },
  {
    slug: 'testimonials',
    name: 'Testimonials',
    description: 'Approved patient feedback shown on the public website.',
    fields: [
      text('patient_name', { translatable: true }),
      richText('quote', { required: true, translatable: true }),
      field('rating', 'number'),
      file('photo'),
      field('featured', 'boolean'),
    ],
  },
  {
    slug: 'faqs',
    name: 'FAQs',
    description: 'Frequently asked questions and clinic answers.',
    fields: [
      text('question', { required: true, translatable: true }),
      richText('answer', { required: true, translatable: true }),
      text('category', { translatable: true }),
      field('display_order', 'number'),
    ],
  },
  {
    slug: 'legal_pages',
    name: 'Legal Pages',
    description: 'Privacy, terms and clinic policy pages.',
    fields: [
      text('title', { required: true, translatable: true }),
      richText('body', { required: true, translatable: true }),
      text('page_type'),
    ],
  },
  {
    slug: 'navigation_items',
    name: 'Navigation Items',
    description: 'Header and footer navigation managed by the CMS.',
    fields: [
      text('label', { required: true, translatable: true }),
      text('path', { required: true }),
      text('location'),
      field('display_order', 'number'),
      field('enabled', 'boolean'),
    ],
  },
];

export const CLINIC_RELATIONS = [
  {
    source: 'health_posts',
    target: 'post_categories',
    name: 'category_id',
    relationType: 'belongs_to',
  },
  {
    source: 'health_posts',
    target: 'doctors',
    name: 'doctor_id',
    relationType: 'belongs_to',
  },
];

const localized = (en, ar = '') => ({ en, ar });

export const CLINIC_STARTER_ENTRIES = [
  {
    type: 'site_settings',
    slug: 'clinic-settings',
    values: {
      clinic_name: localized('Dr. Sireen Clinic', 'عيادة د. سيرين'),
      tagline: localized('Personalized healthcare you can trust', 'رعاية صحية شخصية يمكنك الوثوق بها'),
      timezone: localized('Asia/Dubai'),
      currency: localized('AED'),
      footer_text: localized(
        'Personalized medical care with attention to comfort, accuracy and trust.',
        'رعاية طبية شخصية تهتم بالراحة والدقة والثقة.',
      ),
      default_meta_title: localized('Dr. Sireen Clinic', 'عيادة د. سيرين'),
      default_meta_description: localized(
        'Explore clinic services, read practical health guidance and book your appointment online.',
        'تعرّف على خدمات العيادة واقرأ إرشادات صحية واحجز موعدك عبر الإنترنت.',
      ),
    },
  },
  {
    type: 'home_page',
    slug: 'home',
    values: {
      eyebrow: localized('Welcome to Dr. Sireen Clinic', 'مرحباً بكم في عيادة د. سيرين'),
      title: localized('Healthcare centered around you', 'رعاية صحية تتمحور حولك'),
      subtitle: localized(
        'Browse our medical services, choose a suitable appointment and manage your care with confidence.',
        'تعرّف على خدماتنا الطبية واختر موعداً مناسباً وأدر رعايتك بكل ثقة.',
      ),
      primary_cta_label: localized('Book an appointment', 'احجز موعداً'),
      secondary_cta_label: localized('Explore services', 'استكشف الخدمات'),
      features_title: localized('Why choose our clinic?', 'لماذا تختار عيادتنا؟'),
      services_title: localized('Medical services', 'الخدمات الطبية'),
      services_intro: localized('Choose the service that fits your needs.', 'اختر الخدمة التي تناسب احتياجاتك.'),
      posts_title: localized('Health guidance', 'إرشادات صحية'),
      posts_intro: localized('Practical articles that help you make informed health decisions.', 'مقالات عملية تساعدك على اتخاذ قرارات صحية واعية.'),
    },
  },
  {
    type: 'doctors',
    slug: 'dr-sireen',
    values: {
      name: localized('Dr. Sireen', 'د. سيرين'),
      specialty: localized('General Practitioner', 'طبيبة عامة'),
      short_bio: localized(
        'Providing personalized healthcare with a focus on comfort, accuracy and trust.',
        'تقدم رعاية صحية شخصية تركّز على الراحة والدقة والثقة.',
      ),
      full_bio: localized(
        'Dr. Sireen provides patient-centered consultations and ongoing care tailored to each patient’s needs.',
        'تقدم د. سيرين استشارات ورعاية مستمرة تتمحور حول المريض وتناسب احتياجاته.',
      ),
      languages: localized('Arabic and English', 'العربية والإنجليزية'),
      featured: localized('1'),
    },
  },
  {
    type: 'clinic_features',
    slug: 'trusted-care',
    values: {
      title: localized('Professional and trusted care', 'رعاية مهنية وموثوقة'),
      description: localized('Personalized medical attention at every step.', 'اهتمام طبي شخصي في كل خطوة.'),
      icon_key: localized('shield-check'),
      display_order: localized('1'),
    },
  },
  {
    type: 'clinic_features',
    slug: 'easy-booking',
    values: {
      title: localized('Easy appointment booking', 'حجز مواعيد بسهولة'),
      description: localized('Choose an available time that works for you.', 'اختر الوقت المتاح الذي يناسبك.'),
      icon_key: localized('calendar-check'),
      display_order: localized('2'),
    },
  },
  {
    type: 'clinic_features',
    slug: 'confidential-care',
    values: {
      title: localized('Safe and confidential', 'آمن وسري'),
      description: localized('Your personal information is handled with care.', 'يتم التعامل مع معلوماتك الشخصية بعناية.'),
      icon_key: localized('lock'),
      display_order: localized('3'),
    },
  },
  {
    type: 'services',
    slug: 'medical-consultation',
    values: {
      title: localized('Medical consultation', 'استشارة طبية'),
      excerpt: localized('Discuss your symptoms and receive an individualized care plan.', 'ناقش أعراضك واحصل على خطة رعاية تناسبك.'),
      body: localized('A patient-centered consultation to review your concerns, medical history and appropriate next steps.', 'استشارة تتمحور حول المريض لمراجعة الأعراض والتاريخ الطبي والخطوات المناسبة التالية.'),
      icon_key: localized('stethoscope'),
      preparation_instructions: localized('Bring your identification and any relevant recent medical reports.', 'يرجى إحضار الهوية وأي تقارير طبية حديثة ذات صلة.'),
      featured: localized('1'),
    },
  },
  {
    type: 'services',
    slug: 'follow-up-visit',
    values: {
      title: localized('Follow-up visit', 'زيارة متابعة'),
      excerpt: localized('Review your progress and update your care plan.', 'راجع تقدمك وحدّث خطة الرعاية.'),
      body: localized('A focused follow-up to discuss progress, results and any recommended adjustments.', 'متابعة مركزة لمناقشة التقدم والنتائج وأي تعديلات موصى بها.'),
      icon_key: localized('clipboard-plus'),
      featured: localized('1'),
    },
  },
  {
    type: 'post_categories',
    slug: 'everyday-health',
    values: {
      title: localized('Everyday health', 'الصحة اليومية'),
      description: localized('Practical guidance for healthy daily habits.', 'إرشادات عملية لعادات يومية صحية.'),
    },
  },
  {
    type: 'health_posts',
    slug: 'preparing-for-your-doctor-visit',
    values: {
      title: localized('How to prepare for your doctor visit', 'كيف تستعد لزيارة الطبيب'),
      excerpt: localized('A simple checklist to help you make the most of your appointment.', 'قائمة بسيطة تساعدك على الاستفادة من موعدك.'),
      body: localized(
        '<p>Write down your main concerns, current medicines and important medical history before your appointment. Bring relevant reports and prepare any questions you want to discuss.</p><p>This article is general information and does not replace medical advice.</p>',
        '<p>دوّن الأعراض الرئيسية والأدوية الحالية والتاريخ الطبي المهم قبل الموعد. أحضر التقارير ذات الصلة وجهّز الأسئلة التي ترغب في مناقشتها.</p><p>هذه المقالة للمعلومات العامة ولا تغني عن الاستشارة الطبية.</p>',
      ),
      reading_time: localized('3'),
      featured: localized('1'),
      author_name: localized('Dr. Sireen Clinic', 'عيادة د. سيرين'),
      tags: localized('appointments, prevention', 'المواعيد، الوقاية'),
    },
    seo: {
      title: 'How to prepare for your doctor visit',
      description: 'A practical checklist for preparing for a medical appointment.',
      keywords: 'doctor visit, appointment preparation',
    },
  },
  {
    type: 'health_posts',
    slug: 'healthy-habits-that-last',
    values: {
      title: localized('Building healthy habits that last', 'بناء عادات صحية تدوم'),
      excerpt: localized('Small, consistent changes can be easier to maintain.', 'التغييرات الصغيرة والمستمرة أسهل في الحفاظ عليها.'),
      body: localized(
        '<p>Choose one realistic goal, make it easy to repeat and track your progress. Sleep, movement, hydration and balanced meals are useful places to begin.</p><p>Speak with a qualified clinician before making changes related to a medical condition.</p>',
        '<p>اختر هدفاً واقعياً واحداً واجعله سهل التكرار وتابع تقدمك. النوم والحركة وشرب الماء والوجبات المتوازنة نقاط جيدة للبدء.</p><p>استشر مختصاً مؤهلاً قبل إجراء تغييرات مرتبطة بحالة طبية.</p>',
      ),
      reading_time: localized('4'),
      featured: localized('1'),
      author_name: localized('Dr. Sireen Clinic', 'عيادة د. سيرين'),
      tags: localized('wellness, prevention', 'العافية، الوقاية'),
    },
  },
  {
    type: 'faqs',
    slug: 'what-to-bring',
    values: {
      question: localized('What should I bring to my appointment?', 'ماذا أحضر إلى موعدي؟'),
      answer: localized('Bring your identification, current medication list and relevant recent medical reports.', 'أحضر هويتك وقائمة الأدوية الحالية والتقارير الطبية الحديثة ذات الصلة.'),
      category: localized('Appointments', 'المواعيد'),
      display_order: localized('1'),
    },
  },
  ...[
    ['home', 'Home', 'الرئيسية', '/', 1],
    ['services', 'Services', 'الخدمات', '/services', 2],
    ['health', 'Health', 'الصحة', '/health', 3],
    ['booking', 'Booking', 'الحجز', '/booking', 4],
  ].map(([slug, en, ar, path, order]) => ({
    type: 'navigation_items',
    slug: `nav-${slug}`,
    values: {
      label: localized(en, ar),
      path: localized(path),
      location: localized('header'),
      display_order: localized(String(order)),
      enabled: localized('1'),
    },
  })),
];

export function clinicTypesAsWizardTables() {
  return CLINIC_CONTENT_TYPES.map((type) => ({
    id: `clinic-${type.slug}`,
    name: type.slug,
    displayName: type.name,
    description: type.description,
    columns: type.fields.map((clinicField, index) => ({
      id: `clinic-${type.slug}-${clinicField.name}`,
      name: clinicField.name,
      displayName: clinicField.name.replaceAll('_', ' '),
      backendType: clinicField.type,
      isRequired: clinicField.required,
      translatable: clinicField.translatable,
      validationRules: clinicField.validation_rules,
      settings: clinicField.settings,
      position: index,
    })),
  }));
}

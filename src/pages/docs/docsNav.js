// Single source of truth for the Documentation nav tree.
// DocsSidebar renders from this, App.jsx's route list mirrors these `to`
// paths, and DocsPrevNext derives "previous / next" links by flattening it.

export const DOCS_NAV = [
  {
    section: "Getting Started",
    links: [
      {
        label: "Introduction",
        to: "/docs/introduction",
        icon: "bi-house-door",
      },
      { label: "Architecture", to: "/docs/architecture", icon: "bi-diagram-3" },
      { label: "Setup & Install", to: "/docs/setup", icon: "bi-gear" },
    ],
  },
  {
    section: "Authentication",
    links: [
      { label: "Auth Service", to: "/docs/auth", icon: "bi-shield-lock" },
    ],
  },
  {
    section: "Request Standards",
    links: [
      { label: "Standards", to: "/docs/standards", icon: "bi-list-check" },
    ],
  },
  {
    section: "Core Modules",
    group: {
      label: "CMS Service",
      icon: "bi-file-earmark-richtext",
      basePath: "/docs/cms",
      links: [
        { label: "Overview", to: "/docs/cms", icon: "bi-grid-1x2" },
        {
          label: "Architecture & Data Flow",
          to: "/docs/cms/architecture",
          icon: "bi-diagram-3",
        },
        {
          label: "Database Schema",
          to: "/docs/cms/database",
          icon: "bi-hdd-stack",
        },
        { label: "Projects API", to: "/docs/cms/projects", icon: "bi-folder" },
        {
          label: "DataTypes API",
          to: "/docs/cms/data-types",
          icon: "bi-puzzle",
        },
        {
          label: "Fields API",
          to: "/docs/cms/fields",
          icon: "bi-input-cursor-text",
        },
        {
          label: "Field Types",
          to: "/docs/cms/field-types",
          icon: "bi-list-ul",
        },
        { label: "Entries API", to: "/docs/cms/entries", icon: "bi-file-text" },
        { label: "Entry States", to: "/docs/cms/states", icon: "bi-flag" },
        {
          label: "Versioning",
          to: "/docs/cms/versions",
          icon: "bi-clock-history",
        },
        { label: "Relations", to: "/docs/cms/relations", icon: "bi-diagram-2" },
        {
          label: "Collections",
          to: "/docs/cms/collections",
          icon: "bi-collection",
        },
        { label: "Payments", to: "/docs/cms/payments", icon: "bi-credit-card" },
        {
          label: "Subscriptions",
          to: "/docs/cms/subscriptions",
          icon: "bi-arrow-repeat",
        },
        { label: "Analytics", to: "/docs/cms/analytics", icon: "bi-bar-chart" },
        { label: "Ratings", to: "/docs/cms/ratings", icon: "bi-star" },
        { label: "AI Provisioning", to: "/docs/cms/ai", icon: "bi-robot" },
        {
          label: "Search Integration",
          to: "/docs/cms/search",
          icon: "bi-search",
        },
        {
          label: "Stock / Inventory",
          to: "/docs/cms/stock",
          icon: "bi-box-seam",
        },
      ],
    },
  },
  {
    section: "Booking",
    group: {
      label: "Booking Service",
      icon: "bi-calendar-check",
      basePath: "/docs/booking",
      links: [
        { label: "Overview", to: "/docs/booking", icon: "bi-grid-1x2" },
        {
          label: "Architecture & Flows",
          to: "/docs/booking/architecture",
          icon: "bi-diagram-3",
        },
        {
          label: "Database Schema",
          to: "/docs/booking/database",
          icon: "bi-hdd-stack",
        },
        {
          label: "Resources API",
          to: "/docs/booking/resources",
          icon: "bi-box-seam",
        },
        {
          label: "Availability & Slots",
          to: "/docs/booking/availability",
          icon: "bi-calendar-week",
        },
        {
          label: "Cancellation Policies",
          to: "/docs/booking/policies",
          icon: "bi-shield-check",
        },
        {
          label: "Bookings API",
          to: "/docs/booking/bookings",
          icon: "bi-calendar-plus",
        },
        {
          label: "Payments & Refunds",
          to: "/docs/booking/payments",
          icon: "bi-wallet2",
        },
        {
          label: "Events & Notifications",
          to: "/docs/booking/events",
          icon: "bi-broadcast",
        },
        {
          label: "Analytics",
          to: "/docs/booking/analytics",
          icon: "bi-bar-chart",
        },
        {
          label: "Reliability & Caching",
          to: "/docs/booking/reliability",
          icon: "bi-lightning-charge",
        },
      ],
    },
  },
  {
    section: "E-Commerce",
    group: {
      label: "E-Commerce Service",
      icon: "bi-cart3",
      basePath: "/docs/ecommerce",
      links: [
        { label: "Overview", to: "/docs/ecommerce", icon: "bi-grid-1x2" },
        {
          label: "Architecture & Flows",
          to: "/docs/ecommerce/architecture",
          icon: "bi-diagram-3",
        },
        {
          label: "Database Schema",
          to: "/docs/ecommerce/database",
          icon: "bi-hdd-stack",
        },
        {
          label: "Business Logic",
          to: "/docs/ecommerce/business-logic",
          icon: "bi-list-check",
        },
        {
          label: "Products API",
          to: "/docs/ecommerce/products",
          icon: "bi-box",
        },
        {
          label: "Pricing API",
          to: "/docs/ecommerce/pricing",
          icon: "bi-cash-coin",
        },
        { label: "Cart API", to: "/docs/ecommerce/cart", icon: "bi-cart3" },
        {
          label: "Checkout API",
          to: "/docs/ecommerce/checkout",
          icon: "bi-credit-card",
        },
        {
          label: "Orders API",
          to: "/docs/ecommerce/orders",
          icon: "bi-clipboard-check",
        },
        { label: "Offers API", to: "/docs/ecommerce/offers", icon: "bi-tag" },
        {
          label: "Wishlist API",
          to: "/docs/ecommerce/wishlist",
          icon: "bi-heart",
        },
        {
          label: "Return Requests API",
          to: "/docs/ecommerce/returns",
          icon: "bi-arrow-return-left",
        },
        {
          label: "Payments API",
          to: "/docs/ecommerce/payments",
          icon: "bi-wallet2",
        },
        {
          label: "Analytics",
          to: "/docs/ecommerce/analytics",
          icon: "bi-bar-chart",
        },
      ],
    },
  },
  {
    section: "Advanced",
    links: [
      { label: "AI Agents", to: "/docs/ai-agents", icon: "bi-robot" },
      { label: "Search Engine", to: "/docs/search-engine", icon: "bi-search" },
      {
        label: "Security & NFR",
        to: "/docs/security",
        icon: "bi-shield-lock-fill",
      },
      {
        label: "ERD & Architecture",
        to: "/docs/erd",
        icon: "bi-diagram-3-fill",
      },
      {
        label: "Deployment & DevOps",
        to: "/docs/deployment",
        icon: "bi-rocket-takeoff",
      },
    ],
  },
];

// Doc pages that have real content today. Everything else in DOCS_NAV still
// renders in the sidebar but resolves to <DocsComingSoon>, not a 404.
export const DOCS_READY_PATHS = new Set([
  "/docs/introduction",
  "/docs/architecture",
  "/docs/setup",
  "/docs/cms",
  "/docs/cms/architecture",
  "/docs/cms/database",
  "/docs/cms/projects",
  "/docs/cms/data-types",
  "/docs/cms/fields",
  "/docs/cms/field-types",
  "/docs/cms/entries",
  "/docs/cms/states",
  "/docs/cms/versions",
  "/docs/cms/relations",
  "/docs/cms/collections",
  "/docs/cms/ratings",
  "/docs/cms/analytics",
  "/docs/cms/subscriptions",
  "/docs/cms/payments",
  "/docs/cms/ai",
  "/docs/cms/search",
  "/docs/cms/stock",
  "/docs/booking",
  "/docs/booking/architecture",
  "/docs/booking/database",
  "/docs/booking/resources",
  "/docs/booking/availability",
  "/docs/booking/policies",
  "/docs/booking/bookings",
  "/docs/booking/payments",
  "/docs/booking/events",
  "/docs/booking/analytics",
  "/docs/booking/reliability",
  "/docs/ecommerce",
  "/docs/ecommerce/architecture",
  "/docs/ecommerce/database",
  "/docs/ecommerce/business-logic",
  "/docs/ecommerce/products",
  "/docs/ecommerce/pricing",
  "/docs/ecommerce/cart",
  '/docs/ecommerce/checkout',
  '/docs/ecommerce/orders',
  '/docs/ecommerce/offers',
'/docs/ecommerce/wishlist',
  '/docs/ecommerce/returns',
  '/docs/ecommerce/payments',
  '/docs/ecommerce/analytics',
]);
// Flattens DOCS_NAV into a single ordered list of {label, to} — used to
// compute "previous / next" footer links without hand-maintaining a second copy.
export function getFlatDocsLinks() {
  const flat = [];
  for (const entry of DOCS_NAV) {
    if (entry.links) flat.push(...entry.links);
    if (entry.group) flat.push(...entry.group.links);
  }
  return flat;
}

export function getPrevNext(currentPath) {
  const flat = getFlatDocsLinks();
  const index = flat.findIndex((l) => l.to === currentPath);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
  };
}

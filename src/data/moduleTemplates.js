import { generateId } from '../lib/utils';

function col(name, displayName, fieldType, opts = {}) {
  return {
    id: generateId(),
    name,
    displayName,
    fieldType,
    isRequired: opts.isRequired ?? false,
    isUnique: opts.isUnique ?? false,
    defaultValue: opts.defaultValue ?? null,
    enumValues: opts.enumValues ?? null,
    position: opts.position ?? 0,
  };
}

function table(name, displayName, columns) {
  return {
    id: generateId(),
    name,
    displayName,
    columns: columns.map((c, i) => ({ ...c, position: i })),
  };
}

const ecommerceTemplates = () => [
  table('products', 'Products', [
    col('name', 'Name', 'string', { isRequired: true }),
    col('slug', 'Slug', 'string', { isRequired: true, isUnique: true }),
    col('description', 'Description', 'text'),
    col('price', 'Price', 'number', { isRequired: true }),
    col('sale_price', 'Sale Price', 'number'),
    col('sku', 'SKU', 'string', { isUnique: true }),
    col('stock', 'Stock', 'number', { defaultValue: '0' }),
    col('status', 'Status', 'enum', { isRequired: true, enumValues: ['active', 'draft', 'archived'] }),
  ]),
  table('categories', 'Categories', [
    col('name', 'Name', 'string', { isRequired: true }),
    col('slug', 'Slug', 'string', { isRequired: true, isUnique: true }),
    col('description', 'Description', 'text'),
    col('image', 'Image', 'media'),
    col('parent_id', 'Parent ID', 'string'),
  ]),
  table('orders', 'Orders', [
    col('order_number', 'Order Number', 'string', { isRequired: true, isUnique: true }),
    col('status', 'Status', 'enum', { isRequired: true, enumValues: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }),
    col('total', 'Total', 'number', { isRequired: true }),
    col('customer_email', 'Customer Email', 'email', { isRequired: true }),
    col('shipping_address', 'Shipping Address', 'text'),
  ]),
  table('order_items', 'Order Items', [
    col('quantity', 'Quantity', 'number', { isRequired: true }),
    col('unit_price', 'Unit Price', 'number', { isRequired: true }),
    col('total_price', 'Total Price', 'number', { isRequired: true }),
  ]),
];

// Booking does NOT generate CMS tables. Resources, availability windows, time slots,
// and bookings live in the Booking service — managed via the Booking pages, not the CMS.
// Resources can still link to a CMS DataEntry via `data_entry_id` (e.g. point a "Room"
// resource at a CMS entry that holds the room's photos and description).

const cmsTemplates = () => [
  table('pages', 'Pages', [
    col('title', 'Title', 'string', { isRequired: true }),
    col('slug', 'Slug', 'string', { isRequired: true, isUnique: true }),
    col('content', 'Content', 'text'),
    col('status', 'Status', 'enum', { isRequired: true, enumValues: ['published', 'draft'] }),
    col('meta_title', 'Meta Title', 'string'),
    col('meta_description', 'Meta Description', 'text'),
  ]),
  table('posts', 'Posts', [
    col('title', 'Title', 'string', { isRequired: true }),
    col('slug', 'Slug', 'string', { isRequired: true, isUnique: true }),
    col('content', 'Content', 'text'),
    col('excerpt', 'Excerpt', 'text'),
    col('status', 'Status', 'enum', { isRequired: true, enumValues: ['published', 'draft'] }),
    col('published_at', 'Published At', 'datetime'),
    col('author', 'Author', 'string'),
  ]),
  table('media', 'Media', [
    col('filename', 'Filename', 'string', { isRequired: true }),
    col('url', 'URL', 'url', { isRequired: true }),
    col('mime_type', 'MIME Type', 'string'),
    col('size', 'Size', 'number'),
    col('alt_text', 'Alt Text', 'string'),
  ]),
  table('tags', 'Tags', [
    col('name', 'Name', 'string', { isRequired: true }),
    col('slug', 'Slug', 'string', { isRequired: true, isUnique: true }),
  ]),
];

export const MODULE_TEMPLATES = {
  'e-commerce': ecommerceTemplates,
  'cms': cmsTemplates,
};

export function getTablesForModules(moduleKeys) {
  const tables = [];
  for (const key of moduleKeys) {
    const templateFn = MODULE_TEMPLATES[key];
    if (templateFn) {
      tables.push(...templateFn());
    }
  }
  return tables;
}

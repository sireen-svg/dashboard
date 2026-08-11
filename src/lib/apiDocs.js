/**
 * API documentation spec.
 *
 * Content lives here as data rather than JSX so adding an endpoint is one
 * object. Every example is interpolated with the *current* project's real
 * values (public_id, data type slug, actual field names), so the curl blocks
 * are copy-paste runnable.
 *
 * Response bodies are written examples derived from reading the service
 * controllers and DB schema — the backend has no JsonResource layer to
 * generate from, so treat them as representative rather than guaranteed.
 */

export const SERVICES = {
  cms: {
    label: 'CMS',
    baseUrl: import.meta.env.VITE_CMS_API_URL || 'http://localhost:8081/api',
    projectHeader: 'X-Project-Key',
  },
  booking: {
    label: 'Booking',
    baseUrl: import.meta.env.VITE_BOOKING_API_URL || 'http://localhost:8004/api',
    projectHeader: 'X-Project-Id',
  },
  ecommerce: {
    label: 'E-Commerce',
    baseUrl: import.meta.env.VITE_ECOMMERCE_API_URL || 'http://localhost:8002/api',
    projectHeader: 'X-Project-Id',
  },
  auth: {
    label: 'Auth',
    baseUrl: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8003/api',
    projectHeader: null,
  },
};

const TOKEN_PLACEHOLDER = '<your-jwt-token>';

/** Headers every project-scoped call needs. */
function headersFor(service, projectKey) {
  const h = { Authorization: `Bearer ${TOKEN_PLACEHOLDER}`, Accept: 'application/json' };
  const cfg = SERVICES[service];
  if (cfg?.projectHeader) h[cfg.projectHeader] = projectKey;
  return h;
}

/** Renders a runnable curl command from an endpoint definition. */
export function toCurl(endpoint, projectKey) {
  const { baseUrl } = SERVICES[endpoint.service];
  const url = `${baseUrl}${endpoint.path}${endpoint.query ? `?${endpoint.query}` : ''}`;
  const headers = headersFor(endpoint.service, projectKey);

  const lines = [`curl -X ${endpoint.method} \\`];
  Object.entries(headers).forEach(([k, v]) => lines.push(`  -H "${k}: ${v}" \\`));
  if (endpoint.body) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(endpoint.body, null, 2)}' \\`);
  }
  lines.push(`  "${url}"`);
  return lines.join('\n');
}

/**
 * Builds a realistic `values` payload from a data type's actual fields.
 * Mirrors EntryForm: keyed by field NAME -> language -> value. File and
 * relation fields are deliberately excluded — they use separate payloads.
 */
function exampleValues(fields, lang = 'en') {
  const out = {};
  (fields || [])
    .filter((f) => !['file', 'image', 'relation'].includes(f.type))
    .slice(0, 6)
    .forEach((f) => {
      let sample = `example ${f.name}`;
      if (['number', 'integer', 'decimal', 'float'].includes(f.type)) sample = 10;
      else if (f.type === 'boolean') sample = true;
      else if (f.type === 'date') sample = '2026-01-31';
      out[f.name] = { [lang]: sample };
    });
  if (Object.keys(out).length === 0) out.title = { [lang]: 'example title' };
  return out;
}

/**
 * @param {object} ctx
 * @param {object} ctx.project      the active project (needs public_id, id)
 * @param {object|null} ctx.dataType the selected data type (slug, fields)
 */
export function buildDocs({ project, dataType }) {
  const projectId = project?.id ?? 1;
  const slug = dataType?.slug || '{data-type-slug}';
  const fields = dataType?.fields || [];
  const values = exampleValues(fields);
  const fieldNames = fields.map((f) => f.name);

  return [
    {
      id: 'getting-started',
      title: 'Getting started',
      icon: 'bi-rocket-takeoff',
      intro:
        'Every request needs a bearer token plus a project header. Note the header name is not the same across services — CMS expects X-Project-Key while Booking and E-Commerce expect X-Project-Id, even though the value is identical.',
      endpoints: [],
    },
    {
      id: 'entries',
      title: 'Entries',
      icon: 'bi-file-text',
      intro:
        'Entries are the rows of a data type. Values are keyed by field NAME, then by language.',
      endpoints: [
        {
          id: 'entries.list',
          service: 'cms',
          method: 'GET',
          path: `/projects/${projectId}/data-types/${slug}/entries`,
          query: 'page=1&per_page=20',
          summary: `List published entries of ${slug}.`,
          params: [
            ['page', 'Page number, default 1'],
            ['per_page', 'Page size, default 20'],
            ['lang', 'Language code for the returned values'],
            ['search', 'Free-text filter'],
            ['date_from / date_to', 'Filter by publish date'],
          ],
          response: {
            data_type_slug: slug,
            entries: [
              { id: 1, slug: 'example-entry', status: 'published', values: values },
            ],
            meta: { current_page: 1, last_page: 1, total: 1, per_page: 20 },
          },
          notes: [
            'Only PUBLISHED entries are returned — drafts are filtered out by the read query.',
          ],
        },
        {
          id: 'entries.show',
          service: 'cms',
          method: 'GET',
          path: '/cms/entries/example-entry',
          summary: 'Fetch a single entry by its slug.',
          response: {
            data: { id: 1, slug: 'example-entry', status: 'published', values: values },
          },
        },
        {
          id: 'entries.create',
          service: 'cms',
          method: 'POST',
          path: `/cms/data-types/${slug}/entries`,
          summary: `Create an entry in ${slug}.`,
          body: { slug: 'my-new-entry', status: 'published', values },
          response: { data: { id: 2, slug: 'my-new-entry', status: 'published' } },
          notes: [
            'values is keyed by field NAME (not id), then by language code.',
            'status must be one of draft, published, scheduled. scheduled_at is required when status is scheduled.',
            'File and image fields are NOT sent in values — use a multipart files[] payload.',
            'Relation fields use a separate relations[] array: { relation_id, related_entry_ids: [] }.',
            fieldNames.length
              ? `Fields on ${slug}: ${fieldNames.join(', ')}.`
              : 'This data type has no fields yet.',
          ],
        },
        {
          id: 'entries.update',
          service: 'cms',
          method: 'PATCH',
          path: '/cms/data-entries/1',
          summary: 'Update an entry. values is optional on PATCH.',
          body: { values },
          response: { data: { id: 1, slug: 'example-entry', status: 'published' } },
        },
        {
          id: 'entries.delete',
          service: 'cms',
          method: 'DELETE',
          path: '/cms/entries/example-entry',
          summary: 'Soft-delete an entry.',
          response: { message: 'Entry deleted' },
        },
      ],
    },
    {
      id: 'collections',
      title: 'Collections',
      icon: 'bi-collection',
      intro:
        'A collection is a named group of entries — either manual (you pick them) or dynamic (rules select them). Offers attach to a collection.',
      endpoints: [
        {
          id: 'collections.list',
          service: 'cms',
          method: 'GET',
          path: '/cms/collections',
          summary: 'List the collections in this project.',
          response: {
            data: [
              {
                id: 1,
                name: 'Featured products',
                slug: 'featured-products',
                type: 'manual',
                is_active: true,
                is_offer: false,
              },
            ],
          },
        },
        {
          id: 'collections.show',
          service: 'cms',
          method: 'GET',
          path: '/cms/collections/featured-products',
          summary: 'Fetch one collection by slug, including its conditions.',
          response: {
            data: {
              id: 1,
              name: 'Featured products',
              slug: 'featured-products',
              type: 'dynamic',
              conditions: [{ field: 'price', operator: '<', value: 100 }],
              conditions_logic: 'and',
            },
          },
        },
        {
          id: 'collections.entries',
          service: 'cms',
          method: 'GET',
          path: '/cms/collections/featured-products/entries',
          summary: 'List the entries inside a collection.',
          response: {
            data: [{ id: 1, slug: 'example-entry', values }],
          },
        },
      ],
    },
    {
      id: 'booking',
      title: 'Booking',
      icon: 'bi-calendar-check',
      intro:
        'The booking flow is: list resources → ask a resource for its free slots on a date → create the booking → cancel if needed. Remember Booking reads X-Project-Id, not X-Project-Key.',
      endpoints: [
        {
          id: 'booking.resources',
          service: 'booking',
          method: 'GET',
          path: '/booking/resources',
          summary: 'List bookable resources (rooms, staff, equipment…).',
          response: {
            data: [
              { id: 1, name: 'Consultation Room', capacity: 1, is_active: true },
            ],
          },
        },
        {
          id: 'booking.slots',
          service: 'booking',
          method: 'POST',
          path: '/booking/resources/1/slots',
          summary: 'Free slots for a resource on one day.',
          body: { date: '2026-02-01' },
          response: {
            data: [
              { start_at: '2026-02-01 09:00:00', end_at: '2026-02-01 09:30:00', available: true },
              { start_at: '2026-02-01 09:30:00', end_at: '2026-02-01 10:00:00', available: false },
            ],
          },
          notes: ['date must be exactly Y-m-d — the request enforces date_format:Y-m-d.'],
        },
        {
          id: 'booking.create',
          service: 'booking',
          method: 'POST',
          path: '/create',
          summary: 'Create a booking and take payment.',
          body: {
            resource_id: 1,
            start_at: '2026-02-01 09:00:00',
            end_at: '2026-02-01 09:30:00',
            amount: 50,
            currency: 'USD',
            gateway: 'stripe',
            token: 'tok_visa',
          },
          response: {
            data: { id: 1, resource_id: 1, status: 'confirmed', start_at: '2026-02-01 09:00:00' },
          },
          notes: [
            'end_at must be after start_at.',
            'amount, currency and gateway are all required — booking and payment are one call.',
          ],
        },
        {
          id: 'booking.cancel',
          service: 'booking',
          method: 'POST',
          path: '/cancel',
          summary: 'Cancel a booking (subject to the resource cancellation policy).',
          body: { booking_id: 1 },
          response: { message: 'Booking cancelled', data: { id: 1, status: 'cancelled' } },
        },
      ],
    },
    {
      id: 'ecommerce',
      title: 'E-Commerce',
      icon: 'bi-bag',
      intro:
        'Products are CMS entries enriched with pricing. The flow is: list products → build a cart → turn the cart into an order.',
      endpoints: [
        {
          id: 'shop.products',
          service: 'ecommerce',
          method: 'GET',
          path: `/ecommerce/products/${slug}`,
          summary: `List entries of ${slug} with pricing and any active offer applied.`,
          response: {
            data: [
              {
                id: 1,
                slug: 'example-entry',
                values,
                price: 100,
                sale_price: 90,
              },
            ],
          },
        },
        {
          id: 'shop.cart.show',
          service: 'ecommerce',
          method: 'GET',
          path: '/ecommerce/cart',
          summary: "Get the current user's cart, creating it if absent.",
          response: {
            data: { id: 1, items: [{ item_id: 1, quantity: 2 }], total: 180 },
          },
        },
        {
          id: 'shop.cart.add',
          service: 'ecommerce',
          method: 'POST',
          path: '/ecommerce/cart',
          summary: 'Add items to the cart.',
          body: { items: [{ item_id: 1, quantity: 2 }] },
          response: { data: { id: 1, items: [{ item_id: 1, quantity: 2 }], total: 180 } },
          notes: ['item_id is the entry id of the product, not the data type id.'],
        },
        {
          id: 'shop.order.create',
          service: 'ecommerce',
          method: 'POST',
          path: '/ecommerce/orders/from-cart',
          summary: 'Convert a cart into an order.',
          body: {
            cart_id: 1,
            address: {
              full_address: '12 Example Street, Apt 4',
              city: 'Damascus',
              street: 'Example Street',
              phone: '+963900000000',
              latitude: 33.5138,
              longitude: 36.2765,
            },
          },
          response: {
            data: { id: 1, status: 'pending', total: 180, items: [{ item_id: 1, quantity: 2 }] },
          },
          notes: ['address.full_address, address.city, address.street and address.phone are required.'],
        },
        {
          id: 'shop.orders',
          service: 'ecommerce',
          method: 'GET',
          path: '/ecommerce/orders',
          summary: "List the current user's orders.",
          response: { data: [{ id: 1, status: 'pending', total: 180 }] },
        },
      ],
    },
  ];
}

export { TOKEN_PLACEHOLDER, headersFor };

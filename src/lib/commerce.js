// Shared e-commerce constants. Kept in a non-component module so React Fast
// Refresh stays happy (component files should only export components).

// Allowed order statuses — mirrors the backend UpdateOrderStatusRequest rule.
export const ORDER_STATUSES = [
  'pending', 'paid', 'shipped', 'delivered', 'cancelled', 'returned', 'partially_returned',
];

// Extract a list from an axios response, tolerating the shapes the e-commerce
// API uses: a bare array, `{ data: [...] }`, or a Laravel paginator
// `{ data: { data: [...] } }`.
export function extractList(res) {
  let d = res?.data ?? res;     // axios response → body
  d = d?.data ?? d;             // unwrap one { data: ... }
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data; // paginator: { current_page, data: [...] }
  return [];
}

export const ORDER_STATUS_VARIANT = {
  pending: 'secondary',
  paid: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'warning',
  partially_returned: 'warning',
};

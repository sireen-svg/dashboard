import { ecommerceClient } from './client';

// All endpoints are served by the E-Commerce service under /api/ecommerce
// (analytics under /api/ecommerce/analytics). The client attaches the bearer
// token and X-Project-Id header automatically.

// -------------------------
// Offers
// -------------------------
export const listOffers = () => ecommerceClient.get('/ecommerce/offers');
export const getOffer = (collectionSlug) => ecommerceClient.get(`/ecommerce/offers/${collectionSlug}`);
export const createOffer = (data) => ecommerceClient.post('/ecommerce/offers', data);
export const updateOffer = (collectionSlug, data) => ecommerceClient.patch(`/ecommerce/offers/${collectionSlug}`, data);
export const deleteOffer = (collectionSlug) => ecommerceClient.delete(`/ecommerce/offers/${collectionSlug}`);
// Both endpoints share ActivationOfferRequest, which requires an is_active boolean.
export const activateOffer = (collectionSlug) => ecommerceClient.post(`/ecommerce/offers/${collectionSlug}/activate`, { is_active: true });
export const deactivateOffer = (collectionSlug) => ecommerceClient.post(`/ecommerce/offers/${collectionSlug}/deactivate`, { is_active: false });
export const addOfferItems = (collectionSlug, items) => ecommerceClient.post(`/ecommerce/offers/${collectionSlug}/insert`, { items });
export const removeOfferItems = (collectionSlug, itemIds) => ecommerceClient.delete(`/ecommerce/offers/${collectionSlug}/items`, { data: { item_ids: itemIds } });

// -------------------------
// Products (CMS entries enriched with pricing) — useful for offer item pickers
// -------------------------
export const listProducts = (dataTypeSlug) => ecommerceClient.get(`/ecommerce/products/${dataTypeSlug}`);

// -------------------------
// Orders
// -------------------------
// Admin: every order in the project (needs order.viewAll permission).
export const listAllOrders = (params = {}) => ecommerceClient.get('/ecommerce/allorders', { params });
export const getOrder = (orderId) => ecommerceClient.get(`/ecommerce/orders/${orderId}`);
export const updateOrderStatus = (orderId, status) => ecommerceClient.patch(`/ecommerce/orders/${orderId}/status`, { status });

// -------------------------
// Return requests (admin)
// -------------------------
export const listReturnRequests = (params = {}) => ecommerceClient.get('/ecommerce/admin/return-requests', { params });
export const updateReturnRequest = (id, status) => ecommerceClient.patch(`/ecommerce/admin/return-requests/${id}`, { status });

// -------------------------
// Analytics
// -------------------------
export const getSalesSummary = (params = {}) => ecommerceClient.get('/ecommerce/analytics/sales', { params });
export const getSalesTrend = (params = {}) => ecommerceClient.get('/ecommerce/analytics/sales/trend', { params });
export const getTopProducts = (params = {}) => ecommerceClient.get('/ecommerce/analytics/products/top', { params });
export const getOffersAnalytics = (params = {}) => ecommerceClient.get('/ecommerce/analytics/offers', { params });
export const getTopCustomers = (params = {}) => ecommerceClient.get('/ecommerce/analytics/customers/top', { params });
export const getReturnsAnalytics = (params = {}) => ecommerceClient.get('/ecommerce/analytics/returns', { params });

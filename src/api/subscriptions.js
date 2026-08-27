// Subscriptions Administration API
// Uses the shared apiClient — the auth token and X-Project-Key header are
// already injected by its request interceptor, so the project-scoped admin
// endpoints need no extra plumbing here.
import apiClient from './client';

/* ── Plans ─────────────────────────────────────────────────────────── */

// The plans endpoints filter on an explicit project_id query param rather than
// the header, so callers must pass the numeric project id.
export const getPlans = (projectId) =>
  apiClient.get('/subscriptions/plans', { params: { project_id: projectId } });

export const getPlan = (id) =>
  apiClient.get(`/subscriptions/plans/${id}`);

export const createPlan = (payload) =>
  apiClient.post('/subscriptions/plans', payload);

/* ── Subscribers (project-scoped, resolved from the header) ────────── */

export const getProjectSubscriptions = (params) =>
  apiClient.get('/admin/subscriptions', { params });

/* ── Feature rules ─────────────────────────────────────────────────── */

export const getFeatureRules = () =>
  apiClient.get('/subscription-feature-rules');

export const createFeatureRule = (payload) =>
  apiClient.post('/subscription-feature-rules', payload);

/* ── Content access ────────────────────────────────────────────────── */

export const getContentAccessRules = (params) =>
  apiClient.get('/content-access', { params });

export const createContentAccess = (payload) =>
  apiClient.post('/content-access', payload);

export const updateContentAccess = (id, payload) =>
  apiClient.put(`/content-access/${id}`, payload);

// Soft-disable: the backend flips is_active to false rather than deleting.
export const disableContentAccess = (id) =>
  apiClient.delete(`/content-access/${id}`);

export const activateContentAccess = (id) =>
  apiClient.patch(`/content-access/${id}/activate`);

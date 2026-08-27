// Search Administration API
// Uses the existing apiClient — auth token and X-Project-Key are already
// injected by its request interceptor. No separate axios instance needed.
import apiClient from './client';

export const getPopularSearches = (params) =>
  apiClient.get('/search/popular', { params });

export const runSearchDebug = (payload) =>
  apiClient.post('/admin/search/debug', payload);

// Per-term IDF weights for the project's corpus — explains why one word
// outranks another. Backed by search_term_stats.
export const getSearchTermWeights = (payload) =>
  apiClient.post('/admin/search/terms', payload);

export const getSearchLogs = (params) =>
  apiClient.get('/admin/search/logs', { params });

export const getSearchProblems = () =>
  apiClient.get('/admin/search/problems');

export const getSearchConfig = () =>
  apiClient.get('/admin/search/config');

export const runAiRerun = (payload) =>
  apiClient.post('/admin/search/ai/re-run', payload);

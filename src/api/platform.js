// Platform Operator API — hyper_core only.
//
// Everything here lives behind the CMS `hypercore` middleware. Note that logs
// come through the CMS too rather than straight from the Logging Service:
// that service has no authentication of its own, so it is never called from
// the browser.
import apiClient from './client';

export const getPlatformOverview = () =>
  apiClient.get('/platform/overview');

export const getSystemHealth = () =>
  apiClient.get('/platform/health');

export const getAllProjects = (params) =>
  apiClient.get('/platform/projects', { params });

export const getPlatformLogs = (params) =>
  apiClient.get('/platform/logs', { params });

export const getPlatformAuditLogs = () =>
  apiClient.get('/platform/audit-logs');

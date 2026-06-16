import apiClient from './client';

// --- Projects ---
export const getProjects = () => apiClient.get('/projects');
export const getProject = (slug) => apiClient.get(`/projects/${slug}`);
export const createProject = (data) => apiClient.post('/projects', data);
export const updateProject = (slug, data) => apiClient.post(`/projects/${slug}`, data);
export const deleteProject = (slug) => apiClient.delete(`/projects/${slug}`);
export const checkProjectAccess = (userId) => apiClient.post('/check-project-access', { user_id: userId });

// --- Data Types ---
export const getDataTypes = () => apiClient.get('/cms/data-types');
export const getDataType = (slug) => apiClient.get(`/cms/data-types/${slug}`);
export const createDataType = (data) => apiClient.post('/cms/data-types', data);
// update/delete bind by slug on the backend (DataType::getRouteKeyName === 'slug')
export const updateDataType = (slug, data) => apiClient.put(`/cms/data-types/${slug}`, data);
export const deleteDataType = (slug) => apiClient.delete(`/cms/data-types/${slug}`);
export const getTrashedDataTypes = () => apiClient.get('/cms/data-types/trashed');
// restore/force-delete bind by id on the backend
export const restoreDataType = (id) => apiClient.post(`/cms/data-types/${id}/restore`);
export const forceDeleteDataType = (id) => apiClient.delete(`/cms/data-types/${id}/force-delete`);

// --- Fields ---
export const getFields = (dataTypeId) => apiClient.get(`/cms/data-types/${dataTypeId}/fields`);
export const createField = (dataTypeId, data) => apiClient.post(`/cms/data-types/${dataTypeId}/fields`, data);
export const updateField = (fieldId, data) => apiClient.put(`/fields/${fieldId}`, data);
export const deleteField = (fieldId) => apiClient.delete(`/fields/${fieldId}`);
export const getTrashedFields = (dataTypeId) => apiClient.get(`/cms/data-types/${dataTypeId}/fields/trashed`);
export const restoreField = (fieldId) => apiClient.post(`/cms/fields/${fieldId}/restore`);
export const forceDeleteField = (fieldId) => apiClient.delete(`/cms/fields/${fieldId}/force-delete`);

// --- Entries ---
export const createEntry = (dataTypeSlug, data) => apiClient.post(`/cms/data-types/${dataTypeSlug}/entries`, data);
export const getEntry = (slug) => apiClient.get(`/cms/entries/${slug}`);
export const getEntryWithRelations = (slug) => apiClient.get(`/cms/entries/${slug}/with-relations`);
// Same-type lookup — backend route is `/cms/entries/{entry:slug}/same-type`, requires an existing entry slug.
export const getEntriesByType = (entrySlug, params) => apiClient.get(`/cms/entries/${entrySlug}/same-type`, { params });
// List-by-data-type endpoint. Backend route is `/projects/{project}/data-types/{slug}/entries`
// (NOT under the /cms prefix). Returns `{ data_type_slug, entries: [{id, status, values}], meta }`.
export const getEntriesByDataType = (projectId, dataTypeSlug, params) =>
  apiClient.get(`/projects/${projectId}/data-types/${dataTypeSlug}/entries`, { params });
// Bulk-fetch full entries by id (returns slug, dates, status, values).
export const getEntriesBulk = (ids) => apiClient.post('/cms/entries/bulk', { ids });
// Use the PATCH route — it's the only update route with the `resolve.project` middleware,
// so the X-Project-Key header actually gets resolved into a current project.
// dataTypeSlug is accepted for call-site compatibility but the route doesn't need it.
export const updateEntry = (_dataTypeSlug, entrySlug, data) => apiClient.patch(`/data-entries/${entrySlug}`, data);
export const patchEntry = (_dataTypeSlug, entrySlug, data) => apiClient.patch(`/data-entries/${entrySlug}`, data);
export const deleteEntry = (slug) => apiClient.delete(`/cms/entries/${slug}`);
export const publishEntry = (slug) => apiClient.post(`/cms/entries/${slug}/publish`);

// --- Versions ---
export const getEntryVersions = (slug, params) => apiClient.get(`/cms/entries/${slug}/versions`, { params });
export const restoreVersion = (versionId) => apiClient.post(`/data-entries/versions/${versionId}/restore`);

// --- Collections ---
export const getCollections = () => apiClient.get('/cms/collections');
export const getCollection = (slug) => apiClient.get(`/cms/collections/${slug}`);
export const createCollection = (data) => apiClient.post('/cms/collections', data);
export const updateCollection = (slug, data) => apiClient.patch(`/cms/collections/${slug}`, data);
export const deleteCollection = (slug) => apiClient.delete(`/cms/collections/${slug}`);
export const addCollectionItems = (slug, items) => apiClient.post(`/cms/collections/${slug}/insert`, { items });
export const removeCollectionItems = (slug, itemIds) => apiClient.delete(`/cms/collections/${slug}/items`, { data: { items: itemIds } });
export const reorderCollectionItems = (slug, items) => apiClient.post(`/cms/collections/${slug}/items/reorder`, { items });
export const getCollectionEntries = (slug) => apiClient.get(`/cms/collections/${slug}/entries`);
export const deactivateCollection = (slug, payload = {}) =>
  apiClient.patch(`/cms/collections/${slug}/deactivate`, payload);

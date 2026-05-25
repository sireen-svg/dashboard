import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Card, Form, Button, Spinner, Badge, Tab, Tabs, Modal } from 'react-bootstrap';
import {
  getDataType,
  getFields,
  getEntry,
  getEntryWithRelations,
  getEntriesBulk,
  getEntriesByDataType,
  getEntryVersions,
  restoreVersion,
  createEntry,
  updateEntry,
} from '../api/cms';
import apiClient from '../api/client';
import { showToast } from '../components/Toast';
import { getApiError, toFrontendFieldType, slugify } from '../lib/utils';

export default function EntryForm() {
  const { entrySlug } = useParams();
  const [searchParams] = useSearchParams();
  const typeSlug = searchParams.get('type');
  const navigate = useNavigate();
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;
  const isEdit = !!entrySlug;

  // After save / cancel, go back to the entries list filtered by this data type
  // so the user lands on the same view they were on.
  const entriesListPath = typeSlug
    ? `/projects/${projectSlug}/entries?type=${encodeURIComponent(typeSlug)}`
    : `/projects/${projectSlug}/entries`;

  const [dataType, setDataType] = useState(null);
  const [fields, setFields] = useState([]);
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [values, setValues] = useState({});
  const [seo, setSeo] = useState({ title: '', description: '', keywords: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Local preview URLs for files the user just picked, keyed by `${field.id}-${lang}`.
  const [filePreviews, setFilePreviews] = useState({});
  // Server-rendered media (already-uploaded files) keyed by field id → array of { url, name, extension }.
  const [serverMedia, setServerMedia] = useState({});
  // Available entries that can be picked for each relation field: { [fieldId]: [{ id, label }] }.
  const [relationOptions, setRelationOptions] = useState({});
  // Related entries (parents/children) shown in the side panel on edit.
  const [relatedEntries, setRelatedEntries] = useState({ parents: [], children: [] });
  // Version history modal state.
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState(null);
  const previewUrlsRef = useRef([]);

  // Revoke any blob URLs we created when the form unmounts.
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const languages = project.supported_languages || ['en'];

  const loadData = useCallback(async () => {
    try {
      if (typeSlug) {
        const dtRes = await getDataType(typeSlug);
        const dt = dtRes.data?.data || dtRes.data;
        setDataType(dt);

        // Backend's data-type show endpoint doesn't eager-load fields, so fetch them separately.
        let dtFields = dt?.fields;
        if (!Array.isArray(dtFields) || dtFields.length === 0) {
          if (dt?.id) {
            try {
              const fieldsRes = await getFields(dt.id);
              dtFields = fieldsRes.data?.data || fieldsRes.data || [];
            } catch {
              dtFields = [];
            }
          } else {
            dtFields = [];
          }
        }
        setFields(dtFields);

        // Initialize values
        const initialValues = {};
        dtFields.forEach((f) => {
          if (f.translatable) {
            initialValues[f.id] = {};
            languages.forEach((lang) => { initialValues[f.id][lang] = ''; });
          } else {
            initialValues[f.id] = { _: '' };
          }
        });

        if (isEdit) {
          // The detail endpoint (/cms/entries/{slug}) returns values as an object keyed by
          // field name and omits slug/scheduled_at. Use bulk to recover the full row with the
          // raw values relation (array of { data_type_field_id, language, value }).
          const detailRes = await getEntry(entrySlug);
          const detail = detailRes.data?.data || detailRes.data || {};
          let entry = detail;

          // The detail endpoint hydrates media fields into { url, name, extension } objects
          // (or arrays of them). Map by field id so the file preview can read them later.
          if (detail?.values && typeof detail.values === 'object' && !Array.isArray(detail.values)) {
            const mediaByField = {};
            Object.entries(detail.values).forEach(([fieldName, val]) => {
              const field = dtFields.find((f) => f.name === fieldName);
              if (!field) return;
              const isMediaField = field.type === 'file' || field.type === 'image';
              if (!isMediaField) return;
              const items = Array.isArray(val) ? val : val ? [val] : [];
              const usable = items.filter((it) => it && typeof it === 'object' && it.url);
              if (usable.length > 0) mediaByField[field.id] = usable;
            });
            setServerMedia(mediaByField);
          }

          if (detail?.id) {
            try {
              const bulkRes = await getEntriesBulk([detail.id]);
              const bulkArr = bulkRes.data?.data || bulkRes.data || [];
              const full = Array.isArray(bulkArr) ? bulkArr[0] : null;
              if (full) entry = { ...detail, ...full };
            } catch {
              // Fall back to whatever the detail endpoint returned.
            }
          }

          setSlug(entry.slug || entrySlug || '');
          setStatus(entry.status || 'draft');
          setScheduledAt(entry.scheduled_at || '');

          if (Array.isArray(entry.values)) {
            // Bulk shape: array of value rows. Non-translatable fields are stored under any
            // language code (usually the project's first language) but the input renderer
            // reads them from the '_' key — so route them there. Relation fields live in
            // the data_entry_relations table, not data_entry_values, so skip them here.
            entry.values.forEach((v) => {
              const fieldId = v.data_type_field_id;
              const field = dtFields.find((f) => f.id === fieldId);
              if (!field || field.type === 'relation') return;
              if (!initialValues[fieldId]) initialValues[fieldId] = {};
              const key = field.translatable ? (v.language || languages[0]) : '_';
              initialValues[fieldId][key] = v.value ?? '';
            });
          } else if (entry.values && typeof entry.values === 'object') {
            // Detail shape: { fieldName: value }. Fall back here if bulk failed.
            Object.entries(entry.values).forEach(([fieldName, val]) => {
              const field = dtFields.find((f) => f.name === fieldName);
              if (!field || field.type === 'relation') return;
              if (!initialValues[field.id]) initialValues[field.id] = {};
              const key = field.translatable ? languages[0] : '_';
              initialValues[field.id][key] =
                typeof val === 'string' || typeof val === 'number' ? String(val) : '';
            });
          }

          // Always fetch parents + children: used both for hydrating relation field selections
          // and for the read-only "Related entries" side panel.
          try {
            const wrRes = await getEntryWithRelations(entrySlug);
            const wr = wrRes.data?.data || wrRes.data || {};
            const parents = Array.isArray(wr.parents) ? wr.parents : [];
            const children = Array.isArray(wr.children) ? wr.children : [];
            const parentIds = parents.map((p) => p?.id).filter(Boolean);
            const childIds = children.map((c) => c?.id).filter(Boolean);

            // Hydrate the side panel with full slug/status from a bulk fetch.
            const allIds = [...new Set([...parentIds, ...childIds])];
            let bulkById = new Map();
            if (allIds.length > 0) {
              try {
                const bulkRes = await getEntriesBulk(allIds);
                const bulkArr = bulkRes.data?.data || bulkRes.data || [];
                bulkById = new Map(bulkArr.map((e) => [e.id, e]));
              } catch {
                // best effort
              }
            }
            const enrich = (list) =>
              list.map((e) => {
                const full = bulkById.get(e.id) || {};
                const valuesObj = e.values && !Array.isArray(e.values) ? e.values : null;
                const label =
                  full.slug ||
                  valuesObj?.title ||
                  valuesObj?.name ||
                  `#${e.id}`;
                return {
                  id: e.id,
                  slug: full.slug,
                  status: full.status || e.status,
                  data_type_id: full.data_type_id,
                  label: typeof label === 'string' ? label : `#${e.id}`,
                };
              });
            setRelatedEntries({ parents: enrich(parents), children: enrich(children) });

            // Hydrate relation field selections by matching data_type_id (works when
            // there's at most one relation between any pair of data types).
            const relationFields = dtFields.filter((f) => f.type === 'relation');
            if (relationFields.length > 0 && parentIds.length > 0) {
              const dataTypeIdByEntry = new Map();
              parents.forEach((p) => {
                const full = bulkById.get(p.id);
                if (full?.data_type_id) dataTypeIdByEntry.set(p.id, full.data_type_id);
              });
              relationFields.forEach((f) => {
                const targetDtId = Number(f.settings?.related_data_type_id);
                if (!targetDtId) return;
                const ids = parentIds.filter((id) => dataTypeIdByEntry.get(id) === targetDtId);
                if (!initialValues[f.id]) initialValues[f.id] = {};
                initialValues[f.id]['_'] = ids;
              });
            }
          } catch {
            // Best effort — leave selections empty if the lookup fails.
          }
        }

        setValues(initialValues);
      }
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [typeSlug, entrySlug, isEdit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch pickable entries for each relation field once we know the data type's fields.
  useEffect(() => {
    const relationFields = fields.filter((f) => f.type === 'relation' && f.settings?.related_data_type_id);
    if (relationFields.length === 0) return;

    let cancelled = false;
    (async () => {
      const next = {};
      for (const field of relationFields) {
        const targetId = Number(field.settings.related_data_type_id);
        const targetDt = dataTypes.find((dt) => dt.id === targetId);
        if (!targetDt) continue;
        try {
          const listRes = await getEntriesByDataType(project.id, targetDt.slug, { per_page: 1000 });
          const listEntries = listRes.data?.entries || listRes.data?.data || [];
          const ids = listEntries.map((e) => e.id).filter(Boolean);
          let bulkById = new Map();
          if (ids.length > 0) {
            try {
              const bulkRes = await getEntriesBulk(ids);
              const bulkArr = bulkRes.data?.data || bulkRes.data || [];
              bulkById = new Map(bulkArr.map((e) => [e.id, e]));
            } catch {
              // best effort
            }
          }
          next[field.id] = listEntries.map((e) => {
            const full = bulkById.get(e.id) || {};
            const valuesObj = e.values && !Array.isArray(e.values) ? e.values : null;
            const label =
              full.slug ||
              valuesObj?.title ||
              valuesObj?.name ||
              `#${e.id}`;
            return { id: e.id, label: typeof label === 'string' ? label : `#${e.id}` };
          });
        } catch {
          next[field.id] = [];
        }
      }
      if (!cancelled) setRelationOptions((prev) => ({ ...prev, ...next }));
    })();

    return () => {
      cancelled = true;
    };
  }, [fields, dataTypes, project.id]);

  function handleValueChange(fieldId, lang, val) {
    setValues((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], [lang]: val },
    }));
  }

  async function openVersions() {
    if (!entrySlug) return;
    setShowVersions(true);
    setLoadingVersions(true);
    try {
      const res = await getEntryVersions(entrySlug);
      // Backend returns { total, page, per_page, items: EntryVersionDTO[] }.
      const body = res.data || {};
      const list = Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];
      setVersions(list);
    } catch (err) {
      showToast(getApiError(err), 'error');
      setVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRestoreVersion(versionId) {
    if (restoringVersionId) return;
    setRestoringVersionId(versionId);
    try {
      await restoreVersion(versionId);
      showToast('Version restored', 'success');
      setShowVersions(false);
      // Reload the form to reflect the restored values.
      await loadData();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setRestoringVersionId(null);
    }
  }

  async function handleSubmit(submitStatus) {
    if (saving) return;
    setSaving(true);

    try {
      // Backend keys the values map by field name (see ValidateFieldsAction +
      // bulkInsert in the CMS service). Build text values keyed by field name; file fields
      // are NOT included here — they go in the `files[...]` map below so the backend's
      // FileUploadService persists them and merges the resulting paths in.
      const valuesPayload = {};
      // Relation selections go into a separate `relations[]` payload that the backend
      // writes into the data_entry_relations table.
      const relationsPayload = [];
      Object.entries(values).forEach(([fieldId, langValues]) => {
        const field = fields.find((f) => f.id === Number(fieldId));
        if (!field) return;
        if (field.type === 'file' || field.type === 'image') return;

        if (field.type === 'relation') {
          const relationId = Number(field.settings?.data_type_relation_id);
          const raw = langValues['_'];
          const ids = Array.isArray(raw)
            ? raw.filter((x) => x !== '' && x != null).map(Number)
            : [];
          if (relationId && ids.length > 0) {
            relationsPayload.push({ relation_id: relationId, related_entry_ids: ids });
          }
          return;
        }

        if (field.translatable) {
          valuesPayload[field.name] = {};
          languages.forEach((lang) => {
            valuesPayload[field.name][lang] = langValues[lang] || '';
          });
        } else {
          valuesPayload[field.name] = {
            [languages[0]]: langValues['_'] || langValues[languages[0]] || '',
          };
        }
      });

      const pendingFiles = Object.entries(filePreviews).filter(([, p]) => p?.file);
      const hasPendingFiles = pendingFiles.length > 0;

      // Backend requires either `slug` or `title` (it derives slug from title via a field
      // literally named "title"). Auto-derive a slug client-side when the user left it blank
      // so we don't bounce off the validation rule for data types without a title field.
      let effectiveSlug = slug;
      if (!isEdit && !effectiveSlug) {
        const preferredOrder = ['title', 'name', 'label', 'heading'];
        const allTextValues = fields
          .filter((f) => f.type !== 'file' && f.type !== 'image' && f.type !== 'boolean')
          .map((f) => {
            const langValues = values[f.id] || {};
            const raw = langValues['_'] || langValues[languages[0]] || '';
            return { name: f.name, value: typeof raw === 'string' ? raw.trim() : '' };
          })
          .filter((x) => x.value);

        const preferred = preferredOrder
          .map((name) => allTextValues.find((v) => v.name === name))
          .find(Boolean);
        const source = preferred || allTextValues[0];
        if (source) {
          effectiveSlug = slugify(source.value);
        }
        if (!effectiveSlug) {
          effectiveSlug = `entry-${Date.now()}`;
        }
      }

      if (hasPendingFiles) {
        // Multipart path — only used when the user actually picked a new file.
        const fd = new FormData();
        if (effectiveSlug) fd.append('slug', effectiveSlug);
        fd.append('status', submitStatus || status);
        if (submitStatus === 'scheduled' && scheduledAt) fd.append('scheduled_at', scheduledAt);

        Object.entries(valuesPayload).forEach(([fieldName, langMap]) => {
          Object.entries(langMap).forEach(([lang, val]) => {
            fd.append(`values[${fieldName}][${lang}]`, val ?? '');
          });
        });

        if (seo.title) fd.append('seo[title]', seo.title);
        if (seo.description) fd.append('seo[description]', seo.description);
        if (seo.keywords) fd.append('seo[keywords]', seo.keywords);

        relationsPayload.forEach((rel, i) => {
          fd.append(`relations[${i}][relation_id]`, String(rel.relation_id));
          rel.related_entry_ids.forEach((id) => {
            fd.append(`relations[${i}][related_entry_ids][]`, String(id));
          });
        });

        // Files keyed by field NAME so MergeFilesAction writes them under the same key
        // bulkInsert / replacePartial expect.
        pendingFiles.forEach(([previewKey, preview]) => {
          const [fieldIdStr, previewLang] = previewKey.split('-');
          const field = fields.find((f) => f.id === Number(fieldIdStr));
          if (!field) return;
          const fmLang = field.translatable ? (previewLang === '_' ? languages[0] : previewLang) : languages[0];
          fd.append(`files[${field.name}][${fmLang}][]`, preview.file, preview.file.name);
        });

        // The shared client interceptor strips Content-Type for FormData bodies so axios
        // can attach the correct multipart boundary.
        if (isEdit) {
          // Laravel reads `_method` to treat a POST as PATCH — needed because PHP doesn't
          // populate $_FILES on real PATCH requests reliably.
          fd.append('_method', 'PATCH');
          await apiClient.post(`/data-entries/${entrySlug}`, fd);
          showToast('Entry updated', 'success');
        } else {
          await apiClient.post(`/cms/data-types/${typeSlug}/entries`, fd);
          showToast('Entry created', 'success');
        }
      } else {
        // No new files — keep the JSON path.
        const payload = {
          slug: effectiveSlug || undefined,
          status: submitStatus || status,
          values: valuesPayload,
          seo: seo.title || seo.description || seo.keywords ? seo : undefined,
          relations: relationsPayload.length > 0 ? relationsPayload : undefined,
        };

        if (submitStatus === 'scheduled' && scheduledAt) {
          payload.scheduled_at = scheduledAt;
        }

        if (isEdit) {
          await updateEntry(typeSlug, entrySlug, payload);
          showToast('Entry updated', 'success');
        } else {
          await createEntry(typeSlug, payload);
          showToast('Entry created', 'success');
        }
      }

      navigate(entriesListPath);
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!dataType) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><i className="bi bi-question-circle"></i></div>
        <div className="empty-title">Data type not found</div>
        <Button variant="primary" size="sm" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  function renderFieldInput(field, lang = '_') {
    const value = values[field.id]?.[lang] || '';
    const key = `${field.id}-${lang}`;
    const frontendType = toFrontendFieldType(field.type);

    switch (field.type) {
      case 'boolean':
        return (
          <Form.Check
            key={key}
            type="switch"
            checked={value === 'true' || value === true || value === '1'}
            onChange={(e) => handleValueChange(field.id, lang, e.target.checked ? 'true' : 'false')}
            label={value === 'true' || value === true || value === '1' ? 'Yes' : 'No'}
          />
        );
      case 'number':
        return (
          <Form.Control
            key={key}
            type="number"
            value={value}
            onChange={(e) => handleValueChange(field.id, lang, e.target.value)}
            placeholder={field.name}
          />
        );
      case 'date':
        return (
          <Form.Control
            key={key}
            type="date"
            value={value}
            onChange={(e) => handleValueChange(field.id, lang, e.target.value)}
          />
        );
      case 'rich-text':
        return (
          <Form.Control
            key={key}
            as="textarea"
            rows={5}
            value={value}
            onChange={(e) => handleValueChange(field.id, lang, e.target.value)}
            placeholder={field.name}
          />
        );
      case 'file': {
        const localPreview = filePreviews[key];
        // Prefer the just-picked local file. Otherwise look for an already-uploaded media item
        // from the detail endpoint, then fall back to whatever `value` currently is.
        const savedMedia = (serverMedia[field.id] || [])[0];
        const previewUrl =
          localPreview?.url ||
          savedMedia?.url ||
          (typeof value === 'string' && /^https?:\/\//.test(value) ? value : '');
        const previewName =
          localPreview?.name ||
          savedMedia?.name ||
          (typeof value === 'string' ? value.split('/').pop() : '');
        const previewExt = localPreview
          ? (localPreview.type || '').split('/')[1] || ''
          : savedMedia?.extension || (previewName.split('.').pop() || '');
        const isImage = localPreview
          ? (localPreview.type || '').startsWith('image/')
          : /^(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(previewExt);
        return (
          <div key={key}>
            <Form.Control
              type="file"
              accept="image/*,application/pdf,video/*,audio/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const objectUrl = URL.createObjectURL(file);
                previewUrlsRef.current.push(objectUrl);
                setFilePreviews((prev) => ({
                  ...prev,
                  [key]: { url: objectUrl, name: file.name, type: file.type, size: file.size, file },
                }));
                handleValueChange(field.id, lang, file.name);
              }}
            />
            {(previewUrl || previewName) && (
              <div className="mt-2 d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}>
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={previewName}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, borderRadius: 6, background: '#e8eaed' }}>
                    <i className="bi bi-file-earmark" style={{ fontSize: 22, color: '#5f6368' }}></i>
                  </div>
                )}
                <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#202124', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {previewName || 'Selected file'}
                  </span>
                  {localPreview?.size != null && (
                    <span style={{ fontSize: 11, color: '#5f6368' }}>
                      {(localPreview.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'relation': {
        // Derive from relation_type — that's the canonical source. The stored `multiple`
        // flag was historically wrong (always true) due to a frontend bug, so we ignore it
        // for `belongs_to` and trust the kind instead.
        const relationType = field.settings?.relation_type;
        const isMultiple = relationType !== 'belongs_to';
        const options = relationOptions[field.id] || [];
        const targetDtName =
          dataTypes.find((dt) => dt.id === Number(field.settings?.related_data_type_id))?.name || 'related';

        // State holds an array of selected ids; coerce to array even if loadData hasn't filled it yet.
        const selectedIds = Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];

        if (!isMultiple) {
          return (
            <Form.Select
              key={key}
              value={selectedIds[0] ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                handleValueChange(field.id, lang, v ? [Number(v)] : []);
              }}
            >
              <option value="">— Select {targetDtName} —</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </Form.Select>
          );
        }

        return (
          <div
            key={key}
            style={{
              border: '1px solid #ced4da',
              borderRadius: 6,
              padding: 8,
              maxHeight: 220,
              overflowY: 'auto',
              background: '#fff',
            }}
          >
            {options.length === 0 ? (
              <div style={{ fontSize: 13, color: '#5f6368', padding: 4 }}>
                No {targetDtName} entries to pick from yet.
              </div>
            ) : (
              options.map((opt) => {
                const checked = selectedIds.includes(opt.id);
                return (
                  <Form.Check
                    key={opt.id}
                    type="checkbox"
                    id={`${key}-${opt.id}`}
                    label={opt.label}
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedIds, opt.id]
                        : selectedIds.filter((id) => id !== opt.id);
                      handleValueChange(field.id, lang, next);
                    }}
                    className="mb-1"
                  />
                );
              })
            )}
          </div>
        );
      }
      default:
        return (
          <Form.Control
            key={key}
            type="text"
            value={value}
            onChange={(e) => handleValueChange(field.id, lang, e.target.value)}
            placeholder={field.name}
          />
        );
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <button
        className="back-nav"
        onClick={() => navigate(entriesListPath)}
      >
        <i className="bi bi-arrow-left"></i> Entries
      </button>

      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h2>{isEdit ? 'Edit entry' : 'New entry'}</h2>
          <p className="page-subtitle">
            {dataType.name} <Badge bg="secondary" style={{ fontSize: 11 }}>{typeSlug}</Badge>
          </p>
        </div>
        {isEdit && (
          <Button variant="outline-secondary" size="sm" onClick={openVersions}>
            <i className="bi bi-clock-history me-1"></i>Versions
          </Button>
        )}
      </div>

      {/* Slug */}
      <Card className="mb-3">
        <Card.Body className="p-3">
          <Form.Group>
            <Form.Label>Slug</Form.Label>
            <Form.Control
              type="text"
              placeholder="Auto-generated if empty"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={isEdit}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Fields */}
      <Card className="mb-3">
        <Card.Body className="p-4">
          <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Content</h6>

          {fields.map((field) => (
            <Form.Group key={field.id} className="mb-3">
              <Form.Label>
                {field.name}
                {field.required && <span className="text-danger ms-1">*</span>}
                {field.translatable && (
                  <Badge bg="info" className="ms-2" style={{ fontSize: 10 }}>translatable</Badge>
                )}
              </Form.Label>

              {field.translatable && languages.length > 1 ? (
                <Tabs defaultActiveKey={languages[0]} className="mb-2" style={{ fontSize: 13 }}>
                  {languages.map((lang) => (
                    <Tab key={lang} eventKey={lang} title={lang.toUpperCase()}>
                      <div className="pt-2">
                        {renderFieldInput(field, lang)}
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              ) : (
                renderFieldInput(field, field.translatable ? languages[0] : '_')
              )}
            </Form.Group>
          ))}
        </Card.Body>
      </Card>

      {/* SEO */}
      <Card className="mb-3">
        <Card.Body className="p-4">
          <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
            <i className="bi bi-search me-1"></i> SEO
          </h6>
          <Form.Group className="mb-3">
            <Form.Label>Meta title</Form.Label>
            <Form.Control
              type="text"
              value={seo.title}
              onChange={(e) => setSeo({ ...seo, title: e.target.value })}
              placeholder="Page title for search engines"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Meta description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={seo.description}
              onChange={(e) => setSeo({ ...seo, description: e.target.value })}
              placeholder="Brief description for search results"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Keywords</Form.Label>
            <Form.Control
              type="text"
              value={seo.keywords}
              onChange={(e) => setSeo({ ...seo, keywords: e.target.value })}
              placeholder="Comma-separated keywords"
            />
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Status & Actions */}
      <Card className="mb-3">
        <Card.Body className="p-4">
          <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>Publishing</h6>
          <div className="d-flex gap-3 align-items-end flex-wrap">
            <Form.Group>
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </Form.Select>
            </Form.Group>
            {status === 'scheduled' && (
              <Form.Group>
                <Form.Label>Schedule date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </Form.Group>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Related entries (read-only) */}
      {isEdit && (relatedEntries.parents.length > 0 || relatedEntries.children.length > 0) && (
        <Card className="mb-3">
          <Card.Body className="p-4">
            <h6 className="fw-medium mb-3" style={{ fontSize: 15 }}>
              <i className="bi bi-diagram-3 me-1"></i> Related entries
            </h6>

            {relatedEntries.parents.length > 0 && (
              <div className="mb-3">
                <div className="text-uppercase fw-medium mb-2" style={{ fontSize: 11, color: '#5f6368', letterSpacing: 0.6 }}>
                  Referenced by this entry
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {relatedEntries.parents.map((p) => (
                    <Badge
                      key={p.id}
                      bg="light"
                      text="dark"
                      className="border"
                      style={{ fontSize: 12, fontWeight: 400, padding: '6px 10px' }}
                    >
                      {p.label}
                      {p.status && (
                        <span style={{ fontSize: 10, color: '#5f6368', marginLeft: 6 }}>· {p.status}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {relatedEntries.children.length > 0 && (
              <div>
                <div className="text-uppercase fw-medium mb-2" style={{ fontSize: 11, color: '#5f6368', letterSpacing: 0.6 }}>
                  References this entry
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {relatedEntries.children.map((c) => (
                    <Badge
                      key={c.id}
                      bg="light"
                      text="dark"
                      className="border"
                      style={{ fontSize: 12, fontWeight: 400, padding: '6px 10px' }}
                    >
                      {c.label}
                      {c.status && (
                        <span style={{ fontSize: 10, color: '#5f6368', marginLeft: 6 }}>· {c.status}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Submit */}
      <div className="d-flex justify-content-between mb-4">
        <Button variant="outline-secondary" onClick={() => navigate(entriesListPath)}>
          Cancel
        </Button>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => handleSubmit('draft')} disabled={saving}>
            Save as draft
          </Button>
          <Button onClick={() => handleSubmit(status)} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : (isEdit ? 'Update' : 'Create')}
          </Button>
        </div>
      </div>

      {/* Version history */}
      <Modal show={showVersions} onHide={() => setShowVersions(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Version history</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingVersions ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-4" style={{ color: '#5f6368', fontSize: 14 }}>
              <i className="bi bi-clock-history" style={{ fontSize: 28, opacity: 0.4 }}></i>
              <div className="mt-2">No previous versions yet</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="d-flex justify-content-between align-items-center p-2 rounded"
                  style={{ background: '#f8f9fa', border: '1px solid #e8eaed' }}
                >
                  <div>
                    <div className="fw-medium" style={{ fontSize: 14 }}>
                      Version {v.version_number ?? v.id}
                    </div>
                    <div style={{ fontSize: 12, color: '#5f6368' }}>
                      {v.created_at ? new Date(v.created_at).toLocaleString() : '—'}
                      {v.created_by && <span className="ms-2">by user #{v.created_by}</span>}
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleRestoreVersion(v.id)}
                    disabled={restoringVersionId === v.id}
                    style={{ fontSize: 12 }}
                  >
                    {restoringVersionId === v.id ? <Spinner size="sm" animation="border" /> : 'Restore'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowVersions(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

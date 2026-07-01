import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Modal, Form } from 'react-bootstrap';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getCollection,
  getCollectionEntries,
  addCollectionItems,
  removeCollectionItems,
  reorderCollectionItems,
  getEntriesByDataType,
  getEntriesBulk,
  deactivateCollection,
  updateCollection,
  getFields,
} from '../api/cms';
import { showToast } from '../components/Toast';
import { getApiError } from '../lib/utils';
import ConditionsBuilder from '../components/ConditionsBuilder';
import { cleanConditions } from '../lib/collectionConditions';

function SortableItem({ entry, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: entry.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style}>
      <td {...attributes} {...listeners} className="grip-handle" style={{ width: 36 }}>
        <i className="bi bi-grip-vertical"></i>
      </td>
      <td className="fw-medium">{entry.slug}</td>
      <td>
        <Badge bg={entry.status === 'published' ? 'success' : 'secondary'}>{entry.status}</Badge>
      </td>
      <td>
        <Button
          variant="link"
          size="sm"
          className="p-0"
          onClick={() => onRemove(entry.id)}
          style={{ color: '#ea4335' }}
        >
          <i className="bi bi-x-lg" style={{ fontSize: 12 }}></i>
        </Button>
      </td>
    </tr>
  );
}

export default function CollectionDetail() {
  const { collectionSlug } = useParams();
  const navigate = useNavigate();
  const { project, dataTypes } = useOutletContext();
  const projectSlug = project.slug;

  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [availableEntries, setAvailableEntries] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [adding, setAdding] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [fields, setFields] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [conditionsLogic, setConditionsLogic] = useState('and');
  const [savingConditions, setSavingConditions] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  async function handleToggleActive() {
    if (togglingActive || !collection) return;
    setTogglingActive(true);
    const next = !collection.is_active;
    try {
      if (next) {
        // Reactivating: the dedicated /deactivate endpoint can only set is_active = false
        // (its repo filters where is_active = true and hard-codes the new value), so we
        // go through the regular update endpoint, which accepts is_active in its DTO.
        await updateCollection(collectionSlug, { is_active: true });
      } else {
        await deactivateCollection(collectionSlug, { is_active: false });
      }
      showToast(next ? 'Collection activated' : 'Collection deactivated', next ? 'success' : 'info');
      setCollection((prev) => (prev ? { ...prev, is_active: next } : prev));
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setTogglingActive(false);
    }
  }

  const loadCollection = useCallback(async () => {
    try {
      const [colRes, itemsRes] = await Promise.all([
        getCollection(collectionSlug),
        getCollectionEntries(collectionSlug),
      ]);
      const col = colRes.data?.data || colRes.data;
      setCollection(col);
      // Seed the dynamic-conditions editor and load the data type's fields from the loaded collection.
      setConditions(Array.isArray(col?.conditions) ? col.conditions : []);
      setConditionsLogic(col?.conditions_logic || 'and');
      if (col?.type === 'dynamic') {
        const dt = dataTypes.find((d) => d.id === Number(col.data_type_id));
        if (dt?.slug) {
          try {
            const fres = await getFields(dt.slug);
            setFields(fres.data?.data || fres.data || []);
          } catch {
            setFields([]);
          }
        }
      } else {
        setFields([]);
      }
      const rawItems = itemsRes.data?.data || itemsRes.data || [];
      // getCollectionEntries returns minimal { id, price } shape — hydrate slugs/statuses for display.
      const ids = rawItems.map((i) => i.id).filter(Boolean);
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      try {
        const bulkRes = await getEntriesBulk(ids);
        const bulkArr = bulkRes.data?.data || bulkRes.data || [];
        const bulkById = new Map(bulkArr.map((e) => [e.id, e]));
        // Preserve the collection's stored order.
        const merged = rawItems.map((i) => {
          const full = bulkById.get(i.id) || {};
          return { ...full, ...i, slug: i.slug || full.slug, status: i.status || full.status };
        });
        setItems(merged);
      } catch {
        setItems(rawItems);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate(`/projects/${projectSlug}/collections`);
      } else {
        showToast(getApiError(err), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [collectionSlug, projectSlug, navigate, dataTypes]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  async function handleSaveConditions() {
    if (savingConditions) return;
    setSavingConditions(true);
    try {
      // Updating a dynamic collection deletes and regenerates its items from these conditions.
      await updateCollection(collectionSlug, {
        conditions: cleanConditions(conditions),
        conditions_logic: conditionsLogic,
      });
      showToast('Conditions saved — items regenerated', 'success');
      await loadCollection();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setSavingConditions(false);
    }
  }

  async function handleRemove(entryId) {
    try {
      await removeCollectionItems(collectionSlug, [entryId]);
      showToast('Item removed', 'info');
      loadCollection();
    } catch (err) {
      showToast(getApiError(err), 'error');
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    // The reorder endpoint keys items by the data_collection_items PIVOT id, not the entry id.
    // getCollectionEntries only exposes entry ids, but the collection `show` payload
    // (getCollection → collection.items[]) carries both the pivot `id` and `item_id` (entry id),
    // so build an entry-id → pivot-id lookup from it. Numeric-coerced to avoid string/number key misses.
    const pivotIdByEntryId = new Map(
      (collection?.items || []).map((it) => [Number(it.item_id), it.id])
    );

    try {
      await reorderCollectionItems(
        collectionSlug,
        reordered.map((item, i) => ({
          item_id: pivotIdByEntryId.get(Number(item.id)) ?? item.id,
          sort_order: i + 1,
        }))
      );
    } catch (err) {
      showToast(getApiError(err), 'error');
      loadCollection();
    }
  }

  async function handleOpenAdd() {
    setShowAdd(true);
    if (!collection?.data_type_id) return;
    const dt = dataTypes.find((d) => d.id === collection.data_type_id);
    if (!dt) return;

    try {
      const listRes = await getEntriesByDataType(project.id, dt.slug, { per_page: 1000 });
      const listEntries = listRes.data?.entries || listRes.data?.data || [];
      const ids = listEntries.map((e) => e.id).filter(Boolean);
      if (ids.length === 0) {
        setAvailableEntries([]);
        return;
      }
      // Hydrate slugs so the checkbox labels are meaningful.
      const bulkRes = await getEntriesBulk(ids);
      const bulkArr = bulkRes.data?.data || bulkRes.data || [];
      const bulkById = new Map(bulkArr.map((e) => [e.id, e]));
      const merged = listEntries.map((e) => {
        const full = bulkById.get(e.id) || {};
        return { ...full, ...e, slug: e.slug || full.slug };
      });
      setAvailableEntries(merged);
    } catch {
      setAvailableEntries([]);
    }
  }

  async function handleAddItems() {
    if (selectedEntries.length === 0 || adding) return;
    setAdding(true);
    try {
      await addCollectionItems(collectionSlug, selectedEntries);
      showToast('Items added', 'success');
      setSelectedEntries([]);
      setShowAdd(false);
      loadCollection();
    } catch (err) {
      showToast(getApiError(err), 'error');
    } finally {
      setAdding(false);
    }
  }

  function toggleEntry(id) {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!collection) return null;

  const existingIds = items.map((i) => i.id);
  const filteredAvailable = availableEntries.filter((e) => !existingIds.includes(e.id));

  return (
    <div>
      <button
        className="back-nav"
        onClick={() => navigate(`/projects/${projectSlug}/collections`)}
      >
        <i className="bi bi-arrow-left"></i> Collections
      </button>

      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h2>{collection.name}</h2>
          <div className="d-flex gap-2 mt-1">
            <Badge bg={collection.type === 'manual' ? 'primary' : 'info'}>{collection.type}</Badge>
            <Badge bg={collection.is_active ? 'success' : 'secondary'}>
              {collection.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {collection.description && (
            <p className="page-subtitle mt-1">{collection.description}</p>
          )}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant={collection.is_active ? 'outline-secondary' : 'outline-success'}
            size="sm"
            onClick={handleToggleActive}
            disabled={togglingActive}
          >
            {togglingActive ? (
              <Spinner size="sm" animation="border" />
            ) : collection.is_active ? (
              <><i className="bi bi-pause-circle me-1"></i>Deactivate</>
            ) : (
              <><i className="bi bi-play-circle me-1"></i>Activate</>
            )}
          </Button>
          {collection.type === 'manual' && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add items
            </Button>
          )}
        </div>
      </div>

      {/* Conditions (dynamic collections only) */}
      {collection.type === 'dynamic' && (
        <Card className="mb-3">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-medium mb-0" style={{ fontSize: 14 }}>Conditions</h6>
              <Button size="sm" onClick={handleSaveConditions} disabled={savingConditions}>
                {savingConditions ? <Spinner size="sm" animation="border" /> : 'Save & regenerate'}
              </Button>
            </div>
            <ConditionsBuilder
              fields={fields}
              conditions={conditions}
              logic={conditionsLogic}
              onChange={({ conditions: c, conditions_logic }) => {
                setConditions(c);
                setConditionsLogic(conditions_logic);
              }}
              disabled={savingConditions}
            />
            <div className="text-muted mt-2" style={{ fontSize: 12 }}>
              Saving deletes and rebuilds this collection&apos;s items from the conditions above.
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-inbox"></i></div>
          <div className="empty-title">No items</div>
          <div className="empty-desc">
            {collection.type === 'manual'
              ? 'Add entries to this collection'
              : 'No entries match the collection conditions'}
          </div>
        </div>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <table className="table column-table mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Entry</th>
                      <th>Status</th>
                      <th style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <SortableItem key={item.id} entry={item} onRemove={handleRemove} />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </Card.Body>
        </Card>
      )}

      {/* Add Items Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Add entries</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {filteredAvailable.length === 0 ? (
            <p style={{ color: '#5f6368', fontSize: 14 }}>No available entries to add.</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {filteredAvailable.map((entry) => (
                <Form.Check
                  key={entry.id}
                  type="checkbox"
                  label={`${entry.slug} (${entry.status})`}
                  checked={selectedEntries.includes(entry.id)}
                  onChange={() => toggleEntry(entry.id)}
                  className="mb-2"
                />
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleAddItems} disabled={selectedEntries.length === 0 || adding}>
            {adding ? <Spinner size="sm" animation="border" /> : `Add ${selectedEntries.length} item${selectedEntries.length !== 1 ? 's' : ''}`}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

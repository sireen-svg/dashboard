import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Modal, Button } from "react-bootstrap";
import { getConversations, deleteConversation } from "../api/aiConversations";
import { showToast } from "../components/Toast";
import { getApiError, timeAgo } from "../lib/utils";
import {
  CONVERSATION_STATUS_VARIANTS,
  extractConversations,
  isProvisioned,
} from "../lib/aiConversations";

const FILTERS = [
  { key: "", label: "All" },
  { key: "provisioned", label: "Provisioned" },
  { key: "not_provisioned", label: "Not provisioned" },
];

function conversationProvisioned(c) {
  return isProvisioned(c.is_provisioned ?? c.provisioned ?? c.provision_status);
}

// ── Single conversation row ────────────────────────────────────────────────────
function ConversationRow({ conv, onDelete, style }) {
  const navigate = useNavigate();
  const provisioned = conversationProvisioned(conv);
  const isActive = (conv.status || "active") === "active";

  function handleRowClick() {
    navigate(`/ai-chat/${conv.id}`);
  }
  function handleDelete(e) {
    e.stopPropagation();
    onDelete(conv);
  }

  return (
    <div
      className="conv-row"
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
      style={style}
    >
      <span
        className={`conv-row__dot conv-row__dot--${isActive ? "active" : "inactive"}`}
      />

      <div className="conv-row__body">
        <div className="conv-row__title">
          {conv.title || `Conversation #${conv.id}`}
        </div>
        <div className="conv-row__meta">
          <span
            className={`conv-row__status-pill conv-row__status-pill--${conv.status || "active"}`}
          >
            {conv.status || "active"}
          </span>
          {provisioned && (
            <span className="conv-row__provision-chip">
              <i className="bi bi-check2-circle"></i> Provisioned
            </span>
          )}
          {conv.provisioned_project_id && (
            <span className="conv-row__project-chip">
              #{conv.provisioned_project_id}
            </span>
          )}
        </div>
      </div>

      <div className="conv-row__right">
        {conv.messages_count != null && (
          <span className="conv-row__msg-count">{conv.messages_count}</span>
        )}
        <span className="conv-row__time">
          {timeAgo(conv.updated_at || conv.created_at)}
        </span>
        <button
          type="button"
          className="conv-row__delete"
          onClick={handleDelete}
          title="Delete"
          aria-label="Delete conversation"
        >
          <i className="bi bi-trash3"></i>
        </button>
      </div>
    </div>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function ConvSkeleton() {
  return (
    <div className="conv-skeleton-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="conv-skeleton-row">
          <div className="conv-skeleton-dot analytics-skeleton-line" />
          <div className="conv-skeleton-body">
            <div
              className="analytics-skeleton-line"
              style={{ width: `${45 + ((i * 7) % 35)}%`, height: 13 }}
            />
            <div
              className="analytics-skeleton-line mt-2"
              style={{ width: "28%", height: 10 }}
            />
          </div>
          <div
            className="analytics-skeleton-line"
            style={{ width: 40, height: 10 }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AiConversationList() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce: only fire the API after the user stops typing for 350 ms
  const debounceRef = useRef(null);
  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 350);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConversations({ per_page: 20, page });
      const { list, meta: m } = extractConversations(res);
      setConversations(list);
      setMeta(m);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side filtering (search + status/provision filter)
  const visible = useMemo(() => {
    let rows = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(q) || String(c.id).includes(q),
      );
    }
    if (filter === "active") rows = rows.filter((c) => c.status === "active");
    if (filter === "archived")
      rows = rows.filter((c) => c.status === "archived");
    if (filter === "provisioned")
      rows = rows.filter((c) => conversationProvisioned(c));
    if (filter === "not_provisioned")
      rows = rows.filter((c) => !conversationProvisioned(c));
    return rows;
  }, [conversations, search, filter]);

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteConversation(deleteTarget.id);
      showToast("Conversation deleted", "success");
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      showToast(getApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="conv-page">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="conv-page__header">
        <div>
          <h2 className="conv-page__title">Conversations</h2>
          <p className="conv-page__subtitle">
            {loading
              ? "Loading…"
              : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          type="button"
          className="conv-new-btn"
          onClick={() => navigate("/ai-chat")}
        >
          <i className="bi bi-plus-lg"></i>
          New conversation
        </button>
      </div>

      {/* ── Search + filters ─────────────────────────────────────────────────── */}
      <div className="conv-toolbar">
        <div className="conv-search-wrapper">
          <i className="bi bi-search conv-search-icon"></i>
          <input
            type="text"
            className="conv-search-input"
            placeholder="Search conversations…"
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              type="button"
              className="conv-search-clear"
              onClick={() => setSearch("")}
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>

        {/* <div className="conv-filter-pills">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`conv-filter-pill ${filter === f.key ? "conv-filter-pill--active" : ""}`}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
            >
              {f.label}
            </button>
          ))}
        </div> */}
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      <div className="conv-list-card">
        {loading ? (
          <ConvSkeleton />
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-wifi-off"></i>
            </div>
            <div className="empty-title">Couldn't load conversations</div>
            <div className="empty-desc">{error}</div>
            <Button variant="primary" size="sm" onClick={load}>
              <i className="bi bi-arrow-clockwise me-1"></i>Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-chat-square-dots"></i>
            </div>
            <div className="empty-title">
              {conversations.length === 0
                ? "No conversations yet"
                : "No results found"}
            </div>
            <div className="empty-desc">
              {conversations.length === 0
                ? "Start a new conversation to get going."
                : "Try a different search or filter."}
            </div>
            {conversations.length === 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/ai-chat")}
              >
                <i className="bi bi-plus-lg me-1"></i>New conversation
              </Button>
            )}
          </div>
        ) : (
          visible.map((c, i) => (
            <ConversationRow
              key={c.id}
              conv={c}
              onDelete={setDeleteTarget}
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {meta?.last_page > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span
            className="d-flex align-items-center"
            style={{ fontSize: 13, color: "#5f6368" }}
          >
            {page} / {meta.last_page}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      <Modal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>
            {deleteTarget?.title || `Conversation #${deleteTarget?.id}`}
          </strong>
          ? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size="sm" animation="border" /> : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

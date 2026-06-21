import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Badge, Spinner, Button, Modal } from "react-bootstrap";
import {
  sendAiMessage,
  getConversation,
  deleteConversation,
} from "../api/aiConversations";
import { showToast } from "../components/Toast";
import { getApiError } from "../lib/utils";
import {
  CONVERSATION_STATUS_VARIANTS,
  getRoleMeta,
  isProvisioned,
  extractConversationId,
  extractActionMessage,
} from "../lib/aiConversations";
import SchemaVisualization from "../components/ai-conversations/SchemaVisualization";

// ── helpers ───────────────────────────────────────────────────────────────────

let _msgKey = 0;
function nextKey() {
  return ++_msgKey;
}

// Try every plausible location the backend may put the assistant reply (Fallback)
function extractAssistantMessage(res) {
  const body = res?.data?.data ?? res?.data ?? {};
  const candidates = [
    body.message_data,
    body.assistant_message,
    body.response,
    body.message,
  ];
  for (const c of candidates) {
    if (c && typeof c === "object" && !Array.isArray(c)) return c;
  }
  if (Array.isArray(body.messages) && body.messages.length > 0) {
    const last = body.messages[body.messages.length - 1];
    if (last?.role === "assistant") return last;
  }
  if (body.content || body.schema) {
    return {
      role: "assistant",
      content: body.content ?? null,
      schema: body.schema ?? null,
      is_provisioned: body.is_provisioned ?? null,
    };
  }
  if (typeof body.message === "string" && body.message) {
    return { role: "assistant", content: body.message };
  }
  return null;
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const role = getRoleMeta(message.role);
  const isUser = message.role === "user";
  const isNew = message._isNew === true;

  return (
    <div
      className={`ai-message-row ai-message-row--${role.align} ${isNew ? "ai-message-row--new" : ""}`}
    >
      {/* Avatar dot */}
      {!isUser && (
        <div className="ai-bubble-avatar">
          <i className={`bi ${role.icon}`}></i>
        </div>
      )}

      <div
        className={`ai-message-bubble ai-message-bubble--${isUser ? "user" : "assistant"} ${isNew ? "ai-message-enter" : ""}`}
      >
        {message.content && (
          <div className="ai-message-content">{message.content}</div>
        )}

        {message.schema && (
          <div className="mt-2">
            <SchemaVisualization schema={message.schema} />
          </div>
        )}

        <div className="ai-message-footer">
          {message.created_at && (
            <span className="ai-message-time">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="ai-bubble-avatar ai-bubble-avatar--user">
          <i className="bi bi-person-fill"></i>
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="ai-message-row ai-message-row--start ai-message-row--new">
      <div className="ai-bubble-avatar">
        <i className="bi bi-stars"></i>
      </div>
      <div className="ai-message-bubble ai-message-bubble--assistant ai-message-enter">
        <div className="ai-typing-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

// ── Main chat page ─────────────────────────────────────────────────────────────
export default function AiChat() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(urlId || null);
  const [conversationTitle, setConversationTitle] = useState(null);
  const [conversationStatus, setConversationStatus] = useState(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(!!urlId);
  const [historyError, setHistoryError] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const lastLoadedId = useRef(null); // Prevents loading-flash triggers on route changes

  // ── Load history ─────────────────────────────────────────────────────────────
  const loadHistory = useCallback(
    async (explicitId = null, showSilent = false) => {
      const targetId = explicitId || urlId;
      if (!targetId) return;

      // Guard: Skip duplicate loading if this ID was just synced silently
      if (!explicitId && targetId === lastLoadedId.current) {
        return;
      }

      lastLoadedId.current = targetId;

      if (!showSilent) {
        setLoadingHistory(true);
      }
      setHistoryError(null);
      try {
        const res = await getConversation(targetId);
        const body = res.data?.data || res.data || {};
        const conv = body.conversation || body;
      console.log(res);

        setConversationTitle(conv.title || `Conversation #${targetId}`);
        setConversationStatus(conv.status);

        // Update messages safely and append the entrance animation to the brand new assistant reply
        setMessages((prevMsgs) => {
          const oldIds = new Set(prevMsgs.map((m) => m.id).filter(Boolean));
          return (body.messages || conv.messages || []).map((m, index, arr) => {
            const isLast = index === arr.length - 1;
            const isBrandNew =
              isLast &&
              m.role === "assistant" &&
              oldIds.size > 0 &&
              !oldIds.has(m.id);
            return {
              ...m,
              _key: m.id || nextKey(),
              _isNew: isBrandNew,
            };
          });
        });

        if (explicitId) {
          setConversationId(explicitId);
        }

        // Automatically remove the entrance animation flag after it renders
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((m) => (m._isNew ? { ...m, _isNew: false } : m)),
          );
        }, 700);
      } catch (err) {
        if (!showSilent) {
          setHistoryError(getApiError(err));
        } else {
          showToast(getApiError(err), "error");
        }
      } finally {
        setLoadingHistory(false);
      }
    },
    [urlId],
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-grow textarea
  function handleInputChange(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    // Optimistically append user message
    const userKey = nextKey();
    const userMsg = {
      role: "user",
      content,
      created_at: new Date().toISOString(),
      _key: userKey,
      _isNew: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);

    // Fade out the user _isNew flag after animation completes
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m._key === userKey ? { ...m, _isNew: false } : m)),
      );
    }, 500);

    try {
      const payload = {
        action: "chat",
        content,
        ...(conversationId ? { conversation_id: conversationId } : {}),
      };
      const res = await sendAiMessage(payload);

      // Determine active conversation context
      let activeId = conversationId;
      if (!activeId) {
        activeId = extractConversationId(res);
        if (activeId) {
          setConversationId(activeId);
          navigate(`/ai-chat/${activeId}`, { replace: true });
        }
      }

      // Force a silent, direct history fetch from the database to guarantee the message renders
      if (activeId) {
        await loadHistory(activeId, true);
      } else {
        // Fallback approach if no ID was returned
        const assistantRaw = extractAssistantMessage(res);
        if (assistantRaw) {
          setMessages((prev) => [
            ...prev,
            { ...assistantRaw, _key: nextKey(), _isNew: true },
          ]);
        }
      }
    } catch (err) {
      showToast(getApiError(err), "error");
      setMessages((prev) => prev.filter((m) => m._key !== userKey));
      setInput(content);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    } finally {
      setSending(false);
    }
  }

  // ── Provision ────────────────────────────────────────────────────────────────
  async function handleProvision() {
    if (!conversationId || sending) return;
    setSending(true);
    try {
      const res = await sendAiMessage({
        action: "provision",
        content: "Provision the project based on the schema.",
        conversation_id: conversationId,
      });
      showToast(
        extractActionMessage(res, "Project provisioning started."),
        "success",
      );
      await loadHistory(conversationId, true);
    } catch (err) {
      showToast(getApiError(err), "error");
    } finally {
      setSending(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteConversation(conversationId || urlId);
      showToast("Conversation deleted", "success");
      navigate("/ai-conversations");
    } catch (err) {
      showToast(getApiError(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Schema / provision helpers ────────────────────────────────────────────────
  const hasSchema = messages.some((m) => m.role === "assistant" && m.schema);
  const alreadyProvisioned = messages.some(
    (m) => m.role === "assistant" && isProvisioned(m.is_provisioned),
  );

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (loadingHistory) {
    return (
      <div className="ai-chat-layout d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="ai-chat-layout d-flex align-items-center justify-content-center">
        <div className="empty-state">
          <div className="empty-icon">
            <i className="bi bi-exclamation-circle"></i>
          </div>
          <div className="empty-title">Couldn't load conversation</div>
          <div className="empty-desc">{historyError}</div>
          <Button variant="primary" size="sm" onClick={() => loadHistory()}>
            <i className="bi bi-arrow-clockwise me-1"></i>Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="ai-chat-layout">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="ai-chat-header">
        <div className="d-flex align-items-center gap-3 min-w-0">
          <Link
            to="/ai-conversations"
            className="ai-chat-back"
            title="All conversations"
          >
            <i className="bi bi-arrow-left"></i>
          </Link>
          <div className="min-w-0">
            <div className="ai-chat-title text-truncate">
              {conversationTitle ||
                (conversationId
                  ? `Conversation #${conversationId}`
                  : "New conversation")}
            </div>
            {/* {conversationStatus && (
              <Badge
                bg={
                  CONVERSATION_STATUS_VARIANTS[conversationStatus] ||
                  "secondary"
                }
                style={{ fontSize: 10 }}
              >
                {conversationStatus}
              </Badge>
            )} */}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {hasSchema && !alreadyProvisioned && conversationId && (
            <Button
              variant="primary"
              size="sm"
              disabled={sending}
              onClick={handleProvision}
            >
              {sending ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <>
                  <i className="bi bi-lightning-fill me-1"></i>Generate project
                </>
              )}
            </Button>
          )}
          {alreadyProvisioned && (
            <span className="ai-chat-provision-badge">
              <i className="bi bi-check-circle-fill me-1"></i>Project
              provisioned
            </span>
          )}
          {(conversationId || urlId) && (
            <button
              type="button"
              className="ai-chat-icon-btn ai-chat-icon-btn--danger"
              onClick={() => setShowDelete(true)}
              title="Delete conversation"
            >
              <i className="bi bi-trash3"></i>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────────── */}
      <div className="ai-chat-messages">
        {messages.length === 0 && !sending && (
          <div className="ai-chat-empty">
            <div className="ai-chat-empty-icon">
              <i className="bi bi-chat-dots"></i>
            </div>
            <div className="ai-chat-empty-title">Start a new conversation</div>
            <div className="ai-chat-empty-desc">
              Describe the project you want to build — you'll get a structured
              schema suggestion you can deploy with one click.
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m._key ?? m.id ?? m.sequence} message={m} />
        ))}

        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <div className="ai-chat-input-bar">
        <div className="ai-chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="ai-chat-textarea"
            rows={1}
            placeholder="Describe your project…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            type="button"
            className="ai-chat-send-btn"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            title="Send"
          >
            {sending ? (
              <Spinner
                size="sm"
                animation="border"
                style={{ width: 16, height: 16 }}
              />
            ) : (
              <i className="bi bi-arrow-up"></i>
            )}
          </button>
        </div>
        <div className="ai-chat-input-hint">
          Enter to send · Shift + Enter for new line
        </div>
      </div>

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Delete conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>
            {conversationTitle || `Conversation #${conversationId || urlId}`}
          </strong>
          ? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDelete(false)}
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

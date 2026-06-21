// Shared constants/helpers for the AI Conversations module. Same separation
// pattern as lib/commerce.js and lib/analytics.js.

export const CONVERSATION_STATUS_VARIANTS = {
  active: "success",
  archived: "secondary",
  pending: "warning",
  failed: "danger",
  completed: "primary",
};

const MESSAGE_ROLE_META = {
  user: { label: "You", icon: "bi-person-fill", align: "end" },
  assistant: { label: "Assistant", icon: "bi-robot", align: "start" },
  system: { label: "System", icon: "bi-gear", align: "start" },
};

export function getRoleMeta(role) {
  return (
    MESSAGE_ROLE_META[role] || {
      label: role || "Unknown",
      icon: "bi-chat-dots",
      align: "start",
    }
  );
}

// Normalizes 1/0, true/false, "true"/"false" coming from whichever field name
// the backend used for a provisioned flag.
export function isProvisioned(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

export function extractConversations(res) {
  // 1. استخراج الـ body الأول (سواء كان عبر Axios أو Fetch)
  const body = res?.data ?? res;

  // 2. بحسب ما طبعته في الكونسول، المحتوى الفعلي موجود داخل مفتاح data إضافي
  const payload = body?.data ?? body;

  // 3. التحقق مما إذا كانت المصفوفة موجودة داخل مفتاح "conversations"
  if (Array.isArray(payload?.conversations)) {
    return {
      list: payload.conversations,
      meta: payload.meta || null,
    };
  }

  // --- الشروط السابقة كاحتياط (Fallback) ---
  if (Array.isArray(payload)) {
    return {
      list: payload,
      meta: (!Array.isArray(body?.meta) && body?.meta) || null,
    };
  }

  if (Array.isArray(payload?.data)) {
    const { data, ...meta } = payload;
    return { list: data, meta };
  }

  // في حال لم يتطابق أي شكل، نُرجع مصفوفة فارغة
  return { list: [], meta: null };
}

// The POST /ai/conversations response shape for a brand-new conversation isn't
// fully specified — this defensively tries every plausible key so the chat UI
// can navigate to /ai-conversations/{id} right after the first message.
export function extractConversationId(res) {
  const body = res?.data?.data ?? res?.data ?? {};
  return (
    body.conversation_id ??
    body.id ??
    body.conversation?.id ??
    body.conversation?.conversation_id ??
    null
  );
}

// Best-effort extraction of a human-readable confirmation message from the
// POST /ai/conversations response, falling back to a sensible default.
export function extractActionMessage(res, fallback) {
  const body = res?.data?.data ?? res?.data ?? {};
  return body.message || res?.data?.message || fallback;
}

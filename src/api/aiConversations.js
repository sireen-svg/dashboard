import apiClient from "./client";

// AI Conversations endpoints. Confirmed to live on the same CMS backend/base URL
// as everything else in this file's sibling api/cms.js (http://.../api), but the
// route segment itself is `/ai/conversations` — there is NO `/cms` prefix on it.
export const getConversations = (params) =>
  apiClient.get("/ai/conversations", { params });
export const getConversation = (id) => apiClient.get(`/ai/conversations/${id}`);
export const deleteConversation = (id) =>
  apiClient.delete(`/ai/conversations/${id}`);

// Talks to the AI. `payload` is `{ conversation_id?, action: 'chat' | 'provision', content? }`.
// conversation_id is omitted entirely when starting a brand new conversation.
// content is only relevant (and required) when action === 'chat'.
export const sendAiMessage = (payload) =>
  apiClient.post("/ai/conversations", payload);

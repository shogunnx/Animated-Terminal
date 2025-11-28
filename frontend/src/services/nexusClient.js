// frontend/src/services/nexusClient.js
import axios from "axios";

/**
 * Recommended setup:
 * - If you deploy TSVterminal with its own backend, enable the proxy (below) and leave env empty.
 * - By default, this client uses "/nexus" (same-origin proxy).
 *
 * Optional envs:
 * - REACT_APP_NEXUS_BASE_URL="https://nexus-multiverse.emergent.host"  (direct, requires CORS)
 * - REACT_APP_NEXUS_BASE_URL="/nexus"                                 (proxy, no CORS)
 */
const NEXUS_BASE = (process.env.REACT_APP_NEXUS_BASE_URL || "/nexus").replace(/\/+$/, "");
console.log("NEXUS BASE =", NEXUS_BASE);

const client = axios.create({
  baseURL: NEXUS_BASE,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const safe = async (fn) => {
  try {
    const r = await fn();
    return r.data;
  } catch (e) {
    console.error("[TSVterminal -> Nexus] error:", {
      baseURL: NEXUS_BASE,
      url: e?.config?.url,
      status: e?.response?.status,
      data: e?.response?.data,
      message: e?.message,
    });
    return null;
  }
};

export const nexusClient = {
  baseURL: NEXUS_BASE,

  // --- Connection diagnostics ---
  ping: async () => {
    const paths = [
      "/api/chat-mind/status",
      "/api/nexus-legacy/status",
      "/api/chat-mind/characters",
      "/api/nexus-legacy/characters",
    ];

    const results = [];
    for (const p of paths) {
      results.push(
        await safe(async () => {
          const r = await client.get(p);
          return { ok: true, path: p, status: r.status };
        }) || { ok: false, path: p }
      );
    }
    return results;
  },

  // --- Real Nexus endpoints (from your Nexus ZIP) ---
  getChatMindStatus: () => safe(() => client.get("/api/chat-mind/status")),
  listChatMindCharacters: () => safe(() => client.get("/api/chat-mind/characters")),

  chatMind: (characterId, message, { sessionId = null, localHistory = null } = {}) =>
    safe(() =>
      client.post(`/api/chat-mind/${characterId}`, {
        message,
        session_id: sessionId,
        local_history: localHistory,
      })
    ),

  getLegacyStatus: () => safe(() => client.get("/api/nexus-legacy/status")),
  listLegacyCharacters: () => safe(() => client.get("/api/nexus-legacy/characters")),
  getLegacyCharacter: (characterId) => safe(() => client.get(`/api/nexus-legacy/characters/${characterId}`)),
};

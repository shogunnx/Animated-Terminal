const API_BASE = "/api";

async function j(url, opts = {}) {
  const res = await fetch(API_BASE + url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

export const api = {
  status: () => j("/status"),
  deviantArtLatest: (limit = 12) => j(`/deviantart/latest?limit=${limit}`),

  // Nexus proxy calls
  nexusGet: (path) => j(`/nexus/${path}`.replaceAll("//", "/")),
  nexusPost: (path, body) => j(`/nexus/${path}`.replaceAll("//", "/"), { method: "POST", body: JSON.stringify(body) }),

  // GirlsMind proxy calls (path depends on your GirlsMind service)
  girlsGet: (path) => j(`/girlsmind/${path}`.replaceAll("//", "/")),
  girlsPost: (path, body) => j(`/girlsmind/${path}`.replaceAll("//", "/"), { method: "POST", body: JSON.stringify(body) }),
};

// A best-effort Nexus chat that tries common payload shapes.
// Adjust the path/payload to match your Nexus endpoint if needed.
export async function nexusChat(characterId, message) {
  // Nexus endpoint: /api/chat-mind/{characterId}
  const path = `api/chat-mind/${characterId}`;
  const body = { message };

  try {
    return await api.nexusPost(path, body);
  } catch (e) {
    throw e;
  }
}

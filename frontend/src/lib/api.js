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
  characters: () => j("/characters"),

  // Nexus proxy calls
  nexusGet: (path) => j(`/nexus/${path}`.replaceAll("//", "/")),
  nexusPost: (path, body) => j(`/nexus/${path}`.replaceAll("//", "/"), { method: "POST", body: JSON.stringify(body) }),

  // GirlsMind proxy calls
  girlsGet: (path) => j(`/girlsmind/${path}`.replaceAll("//", "/")),
  girlsPost: (path, body) => j(`/girlsmind/${path}`.replaceAll("//", "/"), { method: "POST", body: JSON.stringify(body) }),
};

// Fetch characters from Nexus
export async function fetchCharacters() {
  return await api.characters();
}

// A best-effort Nexus chat that tries common payload shapes.
export async function nexusChat(characterId, message) {
  const path = `api/chat-mind/${characterId}`;
  const attempts = [
    { message },
    { prompt: message },
    { text: message },
    { input: message },
  ];

  let lastErr = null;
  for (const body of attempts) {
    try {
      return await api.nexusPost(path, body);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Nexus chat failed");
}
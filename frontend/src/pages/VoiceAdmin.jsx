import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// Friendly labels for each known avatar so the admin doesn't have to memorise UUIDs
const AVATAR_LABELS = {
  "738db1645bc140beb1b476231a8b79f4": "Evil Victoria",
  "d33267ddfad14fc2a8820f1d00eb713c": "Evil Victoria (alt)",
  "94fd37e9ad0b42efb9d828edf5be22ee": "Evil Victoria (talking head)",
  "c8680d9549744019809f0acc04faac65": "Wargirl",
  "faa3f1fcdc0b49b79bb0a3fa11595754": "Victoria Black",
  "f81fa68314f84acb8fe6e527d90adc07": "Vanessa",
  "d8d16687495340c5805ad9821046be3a": "Binary",
  "783e82f2b06948d5b2f882fa351337fd": "Harmony",
};

export default function VoiceAdmin() {
  const navigate = useNavigate();
  const [voices, setVoices] = useState([]);
  const [mappings, setMappings] = useState({ overrides: [], hardcoded_defaults: [], default_voice_id: "", known_invalid_voice_ids: [] });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({});  // per-avatar search text
  const [pendingVoice, setPendingVoice] = useState({});  // avatar_id -> voice_id selected but not yet saved

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [vRes, mRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/storytime/voices/list`),
          fetch(`${BACKEND_URL}/api/storytime/voices/mappings`),
        ]);
        if (!vRes.ok) throw new Error(`Voices fetch failed: ${vRes.status}`);
        if (!mRes.ok) throw new Error(`Mappings fetch failed: ${mRes.status}`);
        const vData = await vRes.json();
        const mData = await mRes.json();
        setVoices(Array.isArray(vData.voices) ? vData.voices : []);
        setMappings(mData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Resolve each avatar's current effective voice (DB override > hardcoded > default)
  const rows = useMemo(() => {
    const overrideMap = new Map(mappings.overrides.map((m) => [m.avatar_id, m.voice_id]));
    const hardcodedMap = new Map(mappings.hardcoded_defaults.map((m) => [m.avatar_id, m.voice_id]));
    const allAvatarIds = new Set([
      ...Object.keys(AVATAR_LABELS),
      ...overrideMap.keys(),
      ...hardcodedMap.keys(),
    ]);
    return Array.from(allAvatarIds).map((aid) => {
      const override = overrideMap.get(aid);
      const hardcoded = hardcodedMap.get(aid);
      const effective = override || hardcoded || mappings.default_voice_id;
      const isDead = mappings.known_invalid_voice_ids.includes(hardcoded);
      return {
        avatar_id: aid,
        label: AVATAR_LABELS[aid] || `(custom) ${aid.slice(0, 8)}…`,
        override,
        hardcoded,
        effective,
        is_dead_default: isDead,
      };
    });
  }, [mappings]);

  const voiceById = useMemo(() => {
    const m = new Map();
    voices.forEach((v) => m.set(v.voice_id, v));
    return m;
  }, [voices]);

  const filterVoices = (avatarId) => {
    const q = (search[avatarId] || "").toLowerCase().trim();
    if (!q) return voices.slice(0, 50);  // cap unfiltered list for perf
    return voices
      .filter((v) => {
        const name = (v.name || "").toLowerCase();
        const lang = (v.language || "").toLowerCase();
        const gender = (v.gender || "").toLowerCase();
        return name.includes(q) || lang.includes(q) || gender.includes(q) || v.voice_id.startsWith(q);
      })
      .slice(0, 50);
  };

  const saveMapping = async (avatarId) => {
    const voiceId = pendingVoice[avatarId];
    if (!voiceId) {
      alert("Pick a voice first.");
      return;
    }
    setSavingId(avatarId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/storytime/voices/mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_id: avatarId, voice_id: voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Save failed (${res.status})`);
      }
      // Refresh mappings
      const mRes = await fetch(`${BACKEND_URL}/api/storytime/voices/mappings`);
      setMappings(await mRes.json());
      setPendingVoice((p) => ({ ...p, [avatarId]: undefined }));
    } catch (e) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const resetMapping = async (avatarId) => {
    if (!confirm("Remove the override and fall back to hardcoded/default?")) return;
    setSavingId(avatarId);
    try {
      await fetch(`${BACKEND_URL}/api/storytime/voices/mappings/${avatarId}`, { method: "DELETE" });
      const mRes = await fetch(`${BACKEND_URL}/api/storytime/voices/mappings`);
      setMappings(await mRes.json());
    } finally {
      setSavingId(null);
    }
  };

  const previewVoice = (voice) => {
    const url = voice?.preview_audio || voice?.preview_url;
    if (!url) {
      alert("No preview audio available for this voice.");
      return;
    }
    const audio = new Audio(url);
    audio.play().catch((err) => alert(`Playback blocked: ${err.message}`));
  };

  return (
    <div data-testid="voice-admin-page" style={{ maxWidth: 1100, margin: "40px auto", padding: 20, color: "#e9e9f1" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="tsv-title" style={{ fontSize: 22, color: "#ff9ad1", letterSpacing: 1 }}>
            🎙️ VOICE PICKER — HeyGen
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Assign a HeyGen voice to each avatar. Overrides take effect within 30s and skip the hardcoded mapping.
          </div>
        </div>
        <button
          data-testid="voice-admin-back-btn"
          className="tsv-btn"
          onClick={() => navigate("/storytime")}
          style={{ fontSize: 12, padding: "8px 16px" }}
        >
          ← BACK TO STORYTIME
        </button>
      </div>

      {loading && <div style={{ padding: 30 }}>Loading {voices.length || "…"} HeyGen voices…</div>}
      {error && (
        <div style={{ padding: 16, background: "rgba(255,80,80,0.15)", border: "1px solid #ff5050", borderRadius: 8 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
            {voices.length} voices loaded · {mappings.overrides.length} custom overrides · {mappings.known_invalid_voice_ids.length} known-dead voice IDs
          </div>

          <div data-testid="voice-admin-rows" style={{ display: "grid", gap: 14 }}>
            {rows.map((row) => {
              const effectiveVoice = voiceById.get(row.effective);
              const pending = pendingVoice[row.avatar_id];
              const pendingDetails = pending ? voiceById.get(pending) : null;
              const filtered = filterVoices(row.avatar_id);
              return (
                <div
                  key={row.avatar_id}
                  data-testid={`voice-row-${row.avatar_id}`}
                  style={{
                    padding: 16,
                    border: `1px solid ${row.is_dead_default && !row.override ? "#ff7070" : "rgba(255,154,209,0.3)"}`,
                    borderRadius: 12,
                    background: "rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div className="tsv-title" style={{ fontSize: 15, color: "#ff9ad1" }}>{row.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.55, fontFamily: "monospace", marginTop: 2 }}>{row.avatar_id}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11 }}>
                      <div>
                        <span style={{ opacity: 0.6 }}>Current voice: </span>
                        <strong style={{ color: row.is_dead_default && !row.override ? "#ff7070" : "#9affc5" }}>
                          {effectiveVoice ? effectiveVoice.name : row.effective}
                        </strong>
                        {row.override && <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", background: "#9affc5", color: "#000", borderRadius: 4 }}>OVERRIDE</span>}
                        {row.is_dead_default && !row.override && (
                          <span style={{ marginLeft: 6, fontSize: 9, padding: "1px 6px", background: "#ff7070", color: "#000", borderRadius: 4 }}>DEAD — falls back to default</span>
                        )}
                      </div>
                      {effectiveVoice && (
                        <div style={{ opacity: 0.55, marginTop: 2 }}>
                          {effectiveVoice.gender || "?"} · {effectiveVoice.language || "?"}
                          {(effectiveVoice.preview_audio || effectiveVoice.preview_url) && (
                            <button
                              data-testid={`voice-preview-current-${row.avatar_id}`}
                              onClick={() => previewVoice(effectiveVoice)}
                              style={{ marginLeft: 8, fontSize: 10, background: "none", border: "1px solid #9affc5", color: "#9affc5", borderRadius: 4, padding: "1px 6px", cursor: "pointer" }}
                            >
                              ▶ preview
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    <input
                      data-testid={`voice-search-${row.avatar_id}`}
                      type="text"
                      placeholder="Search voices (name, gender, language)…"
                      value={search[row.avatar_id] || ""}
                      onChange={(e) => setSearch((s) => ({ ...s, [row.avatar_id]: e.target.value }))}
                      style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6, border: "1px solid rgba(255,154,209,0.3)", background: "rgba(0,0,0,0.5)", color: "#fff", outline: "none" }}
                    />
                    <button
                      data-testid={`voice-save-${row.avatar_id}`}
                      className="tsv-btn"
                      disabled={!pending || savingId === row.avatar_id}
                      onClick={() => saveMapping(row.avatar_id)}
                      style={{ fontSize: 11, padding: "8px 16px", opacity: pending ? 1 : 0.4 }}
                    >
                      {savingId === row.avatar_id ? "Saving…" : "💾 SAVE"}
                    </button>
                  </div>

                  {pendingDetails && (
                    <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                      Pending: <strong style={{ color: "#ff9ad1" }}>{pendingDetails.name}</strong> ({pendingDetails.gender || "?"}, {pendingDetails.language || "?"})
                    </div>
                  )}

                  <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", border: "1px solid rgba(255,154,209,0.15)", borderRadius: 6 }}>
                    {filtered.length === 0 && (
                      <div style={{ padding: 12, fontSize: 11, opacity: 0.6 }}>No voices match.</div>
                    )}
                    {filtered.map((v) => (
                      <div
                        key={v.voice_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderBottom: "1px solid rgba(255,154,209,0.08)",
                          background: pending === v.voice_id ? "rgba(154,255,197,0.1)" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setPendingVoice((p) => ({ ...p, [row.avatar_id]: v.voice_id }))}
                      >
                        <div style={{ fontSize: 12, flex: 1, marginRight: 8 }}>
                          <div style={{ color: "#fff" }}>{v.name || v.voice_id}</div>
                          <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "monospace" }}>
                            {v.gender || "?"} · {v.language || "?"} · {v.voice_id}
                          </div>
                        </div>
                        {(v.preview_audio || v.preview_url) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); previewVoice(v); }}
                            style={{ fontSize: 10, background: "none", border: "1px solid #ff9ad1", color: "#ff9ad1", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                          >
                            ▶
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {row.override && (
                    <div style={{ marginTop: 10, textAlign: "right" }}>
                      <button
                        data-testid={`voice-reset-${row.avatar_id}`}
                        onClick={() => resetMapping(row.avatar_id)}
                        style={{ fontSize: 10, background: "none", border: "1px solid #ff7070", color: "#ff7070", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
                      >
                        ↺ Remove override (fall back to hardcoded)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const PAGE_SIZE = 24;

const overlay = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(3,4,12,.82)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 };
const panel = { color: "#e8f6ff", width: "100%", maxWidth: 960, maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 16, gap: 12 };
const input = { flex: 1, minWidth: 160, background: "rgba(0,0,0,.45)", color: "#e8f6ff", border: "1px solid rgba(0,255,255,.25)", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "inherit" };

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Media Library request failed (${res.status})`);
  return data;
}

function AssetCard({ asset, backendUrl, onPick }) {
  return (
    <button type="button" className="tsv-btn" data-testid={`nexus-media-item-${asset.id}`} onClick={() => onPick(asset)}
      style={{ padding: 6, display: "flex", flexDirection: "column", gap: 6, textAlign: "left", minWidth: 0 }}>
      <div style={{ aspectRatio: "3 / 4", width: "100%", borderRadius: 8, overflow: "hidden", background: "linear-gradient(110deg, rgba(0,255,255,.05) 30%, rgba(0,255,255,.14) 50%, rgba(0,255,255,.05) 70%)" }}>
        <img src={`${backendUrl}${asset.thumb_url}`} alt={asset.title} loading="lazy"
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{asset.title}</div>
      <div style={{ fontSize: 9, opacity: .6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{asset.filename}</div>
    </button>
  );
}

function PickerModal({ backendUrl, characters, defaultCharacter, onPick, onClose }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [character, setCharacter] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ q: submitted, character, page, limit: PAGE_SIZE });
      const data = await readJson(await fetch(`${backendUrl}/api/nexus-library/media?${params}`));
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e.message || "Could not reach the Media Library", data: null });
    }
  }, [backendUrl, submitted, character, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const search = () => { setPage(1); setSubmitted(query.trim()); };
  const { loading, error, data } = state;

  return (
    <div style={overlay} role="dialog" aria-label="Nexus Media Library" data-testid="nexus-media-modal" onClick={onClose}>
      <div className="tsv-glass tsv-glow" style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div className="tsv-title" style={{ fontSize: 13 }}>NEXUS MEDIA LIBRARY</div>
          <button type="button" className="tsv-btn" data-testid="nexus-media-close-btn" onClick={onClose} style={{ fontSize: 11, padding: "4px 10px" }}>✕ Close</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input style={input} value={query} placeholder="Search title, filename, tags, character or asset ID"
            onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} data-testid="nexus-media-search-input" />
          <select style={{ ...input, flex: "0 0 auto" }} value={character} onChange={(e) => { setPage(1); setCharacter(e.target.value); }} data-testid="nexus-media-character-filter">
            <option value="">All characters</option>
            {characters.map(c => <option key={c} value={c}>{c}{c === defaultCharacter ? " (current)" : ""}</option>)}
          </select>
          <button type="button" className="tsv-btn" onClick={search} data-testid="nexus-media-search-btn" style={{ fontSize: 11, padding: "6px 14px" }}>Search</button>
        </div>
        {data?.fuzzy && <div style={{ fontSize: 10, color: "#ffa500" }} data-testid="nexus-media-fuzzy-note">No exact match — showing closest results for “{submitted}”.</div>}
        <div style={{ overflowY: "auto", flex: 1, minHeight: 200 }}>
          {loading && <div data-testid="nexus-media-loading" style={{ padding: 30, textAlign: "center", opacity: .7, fontSize: 12 }}>Loading Media Library…</div>}
          {!loading && error && (
            <div data-testid="nexus-media-error" style={{ padding: 20, textAlign: "center", color: "#ff6b6b", fontSize: 12 }}>
              ⚠️ {error}
              <div><button type="button" className="tsv-btn" onClick={load} style={{ marginTop: 10, fontSize: 11, padding: "4px 12px" }} data-testid="nexus-media-retry-btn">Retry</button></div>
            </div>
          )}
          {!loading && !error && data?.items.length === 0 && (
            <div data-testid="nexus-media-empty" style={{ padding: 30, textAlign: "center", opacity: .7, fontSize: 12 }}>No approved images match your search.</div>
          )}
          {!loading && !error && data?.items.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }} data-testid="nexus-media-grid">
              {data.items.map(a => <AssetCard key={a.id} asset={a} backendUrl={backendUrl} onPick={onPick} />)}
            </div>
          )}
        </div>
        {data && data.pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontSize: 11 }}>
            <button type="button" className="tsv-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="nexus-media-prev-btn" style={{ fontSize: 11, padding: "4px 10px" }}>‹ Prev</button>
            <span data-testid="nexus-media-page-info">Page {data.page} of {data.pages} · {data.total} images</span>
            <button type="button" className="tsv-btn" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} data-testid="nexus-media-next-btn" style={{ fontSize: 11, padding: "4px 10px" }}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function NexusMediaPicker({ backendUrl, characters = [], currentCharacter, active, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="tsv-btn" data-testid="nexus-media-library-btn" onClick={() => setOpen(true)}
        style={{ fontSize: 10, padding: "6px 10px", opacity: active ? 1 : 0.75, whiteSpace: "nowrap" }}>
        🗂️ Nexus Media Library
      </button>
      {open && createPortal(
        <PickerModal backendUrl={backendUrl} characters={characters} defaultCharacter={currentCharacter}
          onClose={() => setOpen(false)} onPick={(a) => { setOpen(false); onSelect(a); }} />,
        document.body
      )}
    </>
  );
}

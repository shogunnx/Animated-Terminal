import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const overlay = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(3,4,12,.82)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 };
const panel = { color: "#e8f6ff", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 };
const field = { width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,.45)", color: "#e8f6ff", border: "1px solid rgba(5,204,71,.35)", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontFamily: "inherit" };
const label = { fontSize: 10, opacity: .75, marginBottom: 4, display: "block", letterSpacing: ".06em" };
const NEW = "__new__";
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const MATURE_TYPES = ["nudity", "sexual", "gore", "language", "ideology"];

async function daFetch(url, headers, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.body ? { "Content-Type": "application/json" } : {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(typeof data.detail === "string" ? data.detail : `DeviantArt request failed (${res.status})`), { status: res.status });
  return data;
}

function FolderPicker({ folders, value, onChange, newName, setNewName }) {
  return (
    <div>
      <span style={label}>GALLERY FOLDER</span>
      <select style={field} value={value} onChange={(e) => onChange(e.target.value)} data-testid="da-form-folder-select">
        <option value="">Featured (no folder)</option>
        {folders.map(f => <option key={f.folderid} value={f.folderid}>{f.name}</option>)}
        <option value={NEW}>+ Create new folder…</option>
      </select>
      {value === NEW && (
        <input style={{ ...field, marginTop: 6 }} value={newName} maxLength={50} onChange={(e) => setNewName(e.target.value)}
          placeholder="New folder name" data-testid="da-form-new-folder-input" />
      )}
    </div>
  );
}

function MatureOptions({ form, set }) {
  return (
    <div style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(255,153,0,.3)", background: "rgba(255,153,0,.06)" }}>
      <label style={{ fontSize: 11, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
        <input type="checkbox" checked={form.is_mature} onChange={(e) => set({ is_mature: e.target.checked })} data-testid="da-form-mature-checkbox" />
        Mature content
      </label>
      {form.is_mature && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <select style={field} value={form.mature_level} onChange={(e) => set({ mature_level: e.target.value })} data-testid="da-form-mature-level">
            <option value="moderate">Moderate</option>
            <option value="strict">Strict</option>
          </select>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 10 }}>
            {MATURE_TYPES.map(t => (
              <label key={t} style={{ display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={form.mature_classification.includes(t)} data-testid={`da-form-mature-${t}`}
                  onChange={(e) => set({ mature_classification: e.target.checked ? [...form.mature_classification, t] : form.mature_classification.filter(x => x !== t) })} />
                {t}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DeviantArtPostForm({ backendUrl, headers, username, image, characterName, defaults, onClose, onPosted, onAuthLost }) {
  const [folders, setFolders] = useState(null);
  const [folderErr, setFolderErr] = useState(null);
  const [folder, setFolder] = useState("");
  const [newName, setNewName] = useState(characterName);
  const [form, setForm] = useState({ ...defaults, is_mature: false, mature_level: "moderate", mature_classification: [], allow_comments: true, noai: true });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  useEffect(() => {
    daFetch(`${backendUrl}/api/deviantart/galleries`, headers).then(({ galleries }) => {
      setFolders(galleries);
      const match = galleries.find(g => norm(g.name) === norm(characterName));
      setFolder(match ? match.folderid : NEW);
    }).catch((e) => { if (e.status === 401) onAuthLost(e.message); setFolderErr(e.message); setFolders([]); setFolder(NEW); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl, headers, characterName]);

  const submit = async () => {
    if (!form.title.trim()) return setError("Add a title");
    if (folder === NEW && !newName.trim()) return setError("Name the new folder");
    setPosting(true); setError(null);
    try {
      const data = await daFetch(`${backendUrl}/api/deviantart/post-outfit`, headers, {
        method: "POST",
        body: JSON.stringify({
          ...form, image_base64: image, title: form.title.trim(),
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          folder_id: folder && folder !== NEW ? folder : null,
          new_folder_name: folder === NEW ? newName.trim() : null,
          mature_level: form.is_mature ? form.mature_level : null,
        }),
      });
      onPosted(data);
    } catch (e) {
      if (e.status === 401) onAuthLost(e.message);
      setError(e.message);
    } finally {
      setPosting(false);
    }
  };

  return createPortal(
    <div style={overlay} role="dialog" aria-label="Post to DeviantArt" data-testid="da-post-form" onClick={onClose}>
      <div className="tsv-glass tsv-glow" style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="tsv-title" style={{ fontSize: 13, color: "#05cc47" }}>POST TO DEVIANTART</div>
          <button type="button" className="tsv-btn" onClick={onClose} data-testid="da-form-close-btn" style={{ fontSize: 11, padding: "4px 10px" }}>✕</button>
        </div>
        <div style={{ fontSize: 10, opacity: .7 }} data-testid="da-form-account">Posting as <b>{username || "your DeviantArt account"}</b></div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <img src={image} alt="To post" style={{ width: 96, borderRadius: 8, flexShrink: 0 }} data-testid="da-form-preview" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={label}>TITLE ({form.title.length}/50)</span>
            <input style={field} value={form.title} maxLength={50} onChange={(e) => set({ title: e.target.value })} data-testid="da-form-title-input" />
          </div>
        </div>
        <div>
          <span style={label}>DESCRIPTION</span>
          <textarea style={{ ...field, minHeight: 80, resize: "vertical" }} value={form.description} maxLength={5000}
            onChange={(e) => set({ description: e.target.value })} data-testid="da-form-description-input" />
        </div>
        <div>
          <span style={label}>TAGS (comma separated, up to 30)</span>
          <input style={field} value={form.tags} onChange={(e) => set({ tags: e.target.value })} data-testid="da-form-tags-input" />
        </div>
        {folders === null ? <div style={{ fontSize: 11, opacity: .7 }} data-testid="da-form-folders-loading">Loading your gallery folders…</div>
          : <FolderPicker folders={folders} value={folder} onChange={setFolder} newName={newName} setNewName={setNewName} />}
        {folderErr && <div style={{ fontSize: 10, color: "#ff9900" }} data-testid="da-form-folders-error">⚠️ Couldn't load folders: {folderErr}</div>}
        <MatureOptions form={form} set={set} />
        <label style={{ fontSize: 11, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={form.allow_comments} onChange={(e) => set({ allow_comments: e.target.checked })} data-testid="da-form-comments-checkbox" /> Allow comments
        </label>
        <label style={{ fontSize: 11, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <input type="checkbox" checked={form.noai} onChange={(e) => set({ noai: e.target.checked })} data-testid="da-form-noai-checkbox" /> Block use in AI datasets
        </label>
        <div style={{ fontSize: 9, opacity: .6 }}>Marked as AI-generated, as DeviantArt requires.</div>
        {error && <div style={{ fontSize: 11, color: "#ff6b6b" }} data-testid="da-form-error">⚠️ {error}</div>}
        <button type="button" className="tsv-btn" onClick={submit} disabled={posting || folders === null} data-testid="da-form-submit-btn"
          style={{ padding: 10, fontSize: 12, borderColor: "#05cc47", background: "linear-gradient(135deg, #00d46a40, #05cc4730)" }}>
          {posting ? "⏳ POSTING..." : "🎨 PUBLISH TO DEVIANTART"}
        </button>
      </div>
    </div>,
    document.body
  );
}

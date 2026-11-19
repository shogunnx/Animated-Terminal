import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STYLE_CATEGORIES = ["tops", "bottoms", "dresses", "fashionTrends", "shoes", "sneakers", "sensualShoes", "hairstyles", "accessories", "backgrounds"];

async function shrink(dataUrl, max = 768) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

export function StyleMe({ backendUrl, photo, categories, labels, onTry }) {
  const [state, setState] = useState({ loading: false, error: null, suggestions: [] });

  const run = async () => {
    setState({ loading: true, error: null, suggestions: [] });
    try {
      const catalog = Object.fromEntries(STYLE_CATEGORIES.filter(c => categories[c]).map(c => [c, categories[c]]));
      const res = await fetch(`${backendUrl}/api/dressing-room/style-me`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: await shrink(photo), catalog }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Style Me failed (${res.status})`);
      setState({ loading: false, error: null, suggestions: data.suggestions });
    } catch (e) {
      setState({ loading: false, error: e.message, suggestions: [] });
    }
  };

  return (
    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid rgba(255,61,242,.4)", background: "rgba(255,61,242,.06)" }} data-testid="style-me-panel">
      <button type="button" className="tsv-btn" onClick={run} disabled={state.loading} data-testid="style-me-btn"
        style={{ width: "100%", padding: 9, fontSize: 11, borderColor: "#FF3DF2" }}>
        {state.loading ? "✨ Looking at your photo..." : state.suggestions.length ? "✨ New Style Me ideas" : "✨ STYLE ME — 3 outfit ideas for this photo"}
      </button>
      {state.error && <div style={{ fontSize: 10, color: "#ff6b6b", marginTop: 8 }} data-testid="style-me-error">⚠️ {state.error}</div>}
      {state.suggestions.map((s, i) => (
        <div key={s.title + i} style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "rgba(0,0,0,.25)" }} data-testid={`style-me-suggestion-${i}`}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#ffb3f6" }}>{s.title}</div>
            <button type="button" className="tsv-btn" onClick={() => onTry(s.items)} data-testid={`style-me-try-${i}`} style={{ fontSize: 10, padding: "4px 10px", whiteSpace: "nowrap" }}>Try this</button>
          </div>
          {s.why && <div style={{ fontSize: 10, opacity: .75, marginTop: 4 }}>{s.why}</div>}
          <div style={{ fontSize: 10, marginTop: 6, opacity: .9 }}>
            {Object.entries(s.items).map(([c, v]) => `${labels[c] || c}: ${v}`).join(" · ")}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SelfieCamera({ onCapture }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackRef = useRef(null);

  const stop = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setOpen(false); };

  const start = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) { fallbackRef.current?.click(); return; }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false });
      setOpen(true);
    } catch (e) {
      setError(e.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access or upload a photo instead." : "No camera available. Upload a photo instead.");
    }
  };

  useEffect(() => {
    if (open && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [open]);
  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  const snap = () => {
    const v = videoRef.current;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.translate(c.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.92));
    stop();
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => onCapture(r.result);
    r.readAsDataURL(f);
  };

  return (
    <>
      <button type="button" className="tsv-btn" onClick={start} data-testid="selfie-camera-btn"
        style={{ flex: 1, minWidth: 120, fontSize: 10, padding: "6px 10px", borderColor: "#FF3DF2" }}>
        📷 Take a Selfie
      </button>
      <input ref={fallbackRef} type="file" accept="image/*" capture="user" onChange={onFile} style={{ display: "none" }} data-testid="selfie-fallback-input" />
      {error && <div style={{ width: "100%", fontSize: 10, color: "#ff6b6b" }} data-testid="selfie-camera-error">⚠️ {error}</div>}
      {open && createPortal(
        <div role="dialog" aria-label="Take a selfie" data-testid="selfie-camera-modal"
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(3,4,12,.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 12 }}>
          <video ref={videoRef} autoPlay playsInline muted data-testid="selfie-camera-video"
            style={{ width: "min(92vw, 640px)", maxHeight: "70vh", borderRadius: 14, transform: "scaleX(-1)", background: "#000", objectFit: "cover" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="tsv-btn" onClick={snap} data-testid="selfie-capture-btn" style={{ padding: "10px 22px", fontSize: 13, borderColor: "#FF3DF2" }}>📸 Capture</button>
            <button type="button" className="tsv-btn" onClick={stop} data-testid="selfie-cancel-btn" style={{ padding: "10px 18px", fontSize: 12 }}>Cancel</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

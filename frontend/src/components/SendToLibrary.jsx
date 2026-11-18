import { useState } from "react";

const field = { width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,.45)", color: "#e8f6ff", border: "1px solid rgba(0,255,255,.25)", borderRadius: 8, padding: "7px 9px", fontSize: 11, fontFamily: "inherit" };

async function submit(backendUrl, payload) {
  const res = await fetch(`${backendUrl}/api/nexus-library/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Could not send (HTTP ${res.status})`);
  return data;
}

export function SendToLibrary({ backendUrl, image, details }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState({ state: "idle", text: "" });
  const [sentImage, setSentImage] = useState(null);
  const alreadySent = sentImage === image;

  const send = async () => {
    setStatus({ state: "sending", text: "" });
    try {
      await submit(backendUrl, { ...details, image, submitter_name: name, note });
      setSentImage(image);
      setOpen(false);
      setStatus({ state: "ok", text: "Sent to the Nexus Media Library. It will appear once an admin approves it." });
    } catch (e) {
      setStatus({ state: "error", text: e.message });
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" className="tsv-btn" data-testid="send-to-library-btn" disabled={alreadySent}
        onClick={() => { setOpen(o => !o); setStatus({ state: "idle", text: "" }); }}
        style={{ width: "100%", fontSize: 11, padding: 8, opacity: alreadySent ? 0.6 : 1 }}>
        {alreadySent ? "✓ SENT TO LIBRARY" : "🗂️ SEND TO NEXUS LIBRARY"}
      </button>
      {open && !alreadySent && (
        <div data-testid="send-to-library-form" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          <input style={field} value={name} maxLength={60} placeholder="Your name or handle (optional)"
            onChange={(e) => setName(e.target.value)} data-testid="send-to-library-name-input" />
          <textarea style={{ ...field, minHeight: 50, resize: "vertical" }} value={note} maxLength={500} placeholder="Note for the admin (optional)"
            onChange={(e) => setNote(e.target.value)} data-testid="send-to-library-note-input" />
          <div style={{ fontSize: 9, opacity: 0.65 }}>The outfit details are attached automatically. Submissions stay private until approved.</div>
          <button type="button" className="tsv-btn" onClick={send} disabled={status.state === "sending"} data-testid="send-to-library-submit-btn"
            style={{ fontSize: 11, padding: 8, borderColor: "#00FF88" }}>
            {status.state === "sending" ? "⏳ SENDING..." : "SEND FOR APPROVAL"}
          </button>
        </div>
      )}
      {status.text && (
        <div data-testid={status.state === "ok" ? "send-to-library-success" : "send-to-library-error"}
          style={{ fontSize: 10, marginTop: 6, color: status.state === "ok" ? "#00FF88" : "#ff6b6b" }}>
          {status.state === "ok" ? "✓ " : "⚠️ "}{status.text}
        </div>
      )}
    </div>
  );
}

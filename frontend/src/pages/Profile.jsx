import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import HoloPortrait from "../components/HoloPortrait.jsx";
import { nexusChat } from "../lib/api.js";

export default function Profile() {
  const { id } = useParams();
  const nav = useNavigate();
  const c = useMemo(() => TSV_CHARACTERS.find(x => x.id === id), [id]);

  const [msg, setMsg] = useState("");
  const [log, setLog] = useState("OPEN FILE…\nUse chat to talk through Nexus.\n");

  if (!c) {
    return (
      <div className="tsv-glass" style={{ padding: 16 }}>
        <div className="tsv-title">PROFILE NOT FOUND</div>
        <button className="tsv-btn" style={{ marginTop: 12 }} onClick={() => nav("/characters")}>Back</button>
      </div>
    );
  }

  const send = async () => {
    const text = msg.trim();
    if (!text) return;

    setLog((p) => `${p}\n> YOU: ${text}\n`);
    setMsg("");

    try {
      const res = await nexusChat(c.id, text);
      const reply = res?.reply || res?.message || res?.output || res?.text || JSON.stringify(res, null, 2);
      setLog((p) => `${p}\n${c.name.toUpperCase()}: ${reply}\n`);
    } catch (e) {
      setLog((p) => `${p}\n[ERROR] Nexus chat failed: ${String(e.message || e)}\n`);
    }
  };

  return (
    <>
      <style>{`
        .profile-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          align-items: start;
        }
        @media (min-width: 768px) {
          .profile-container {
            grid-template-columns: 360px 1fr;
          }
        }
      `}</style>
      <div className="profile-container">
      <div className="tsv-glass tsv-glow" style={{ padding: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>{c.name}</div>
        <div style={{ fontSize: 12, opacity:.72, marginTop: 6 }}>{c.subtitle}</div>

        <div className="tsv-scanlines tsv-noise" style={{ marginTop: 12, borderRadius: 16, border:"1px solid rgba(255,255,255,.10)", overflow:"hidden", position:"relative" }}>
          <div style={{ aspectRatio:"4/5", position:"relative" }}>
            <img src={c.portrait} alt={c.name} onError={(e)=>{e.currentTarget.style.display="none";}} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              <HoloPortrait name={c.name} accent={c.accent} glow={c.glow} />
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginTop: 12 }}>
          <button className="tsv-btn" onClick={() => nav(`/rooms/${c.id}`)}>Enter Room</button>
          <button className="tsv-btn" onClick={() => nav(`/characters`)}>All Files</button>
        </div>
      </div>

      <div className="tsv-glass tsv-glow" style={{ padding: 14, minHeight: 560, position:"relative", overflow:"hidden" }}>
        <div className="tsv-title" style={{ fontSize: 13, opacity:.88 }}>DIRECT LINK // NEXUS CHAT</div>

        <div className="tsv-scanlines tsv-noise" style={{ marginTop: 10, borderRadius: 16, border:"1px solid rgba(255,255,255,.10)", padding: 12, minHeight: 420 }}>
          <pre style={{ margin:0, whiteSpace:"pre-wrap", fontSize: 12, lineHeight: 1.4, opacity:.90 }}>
            {log}
          </pre>
        </div>

        <div style={{ display:"flex", gap: 10, marginTop: 12 }}>
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Type…"
            style={{
              flex:1,
              borderRadius: 14,
              border:"1px solid rgba(255,255,255,.16)",
              background:"rgba(0,0,0,.22)",
              color:"rgba(255,255,255,.92)",
              padding:"10px 12px"
            }}
          />
          <button className="tsv-btn" onClick={send}>Send</button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity:.70 }}>
          If this fails, update <code>nexusChat()</code> in <code>src/lib/api.js</code> to match your Nexus chat endpoint.
        </div>
      </div>
    </div>
  );
}
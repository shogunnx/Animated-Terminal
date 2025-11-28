import { useMemo, useState } from "react";
import { nexusChat } from "../lib/api.js";

function Backdrop({ a, b, title }) {
  return (
    <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" style={{ display:"block" }}>
      <defs>
        <linearGradient id="wall" x1="0" x2="1">
          <stop offset="0" stopColor={b} stopOpacity=".22"/>
          <stop offset="1" stopColor={a} stopOpacity=".18"/>
        </linearGradient>
        <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".20"/>
          <stop offset="1" stopColor="#000" stopOpacity=".58"/>
        </linearGradient>
      </defs>

      <rect width="1200" height="470" fill="url(#wall)" />
      <rect y="470" width="1200" height="230" fill="url(#floor)" />

      <g opacity=".95">
        <rect x="90" y="70" width="260" height="220" rx="18" fill="#0A1030" opacity=".55" />
        <rect x="110" y="92" width="220" height="176" rx="14" fill={a} opacity=".10" />
        <path d="M110 180H330" stroke={a} strokeOpacity=".26" />
        <path d="M220 92V268" stroke={a} strokeOpacity=".26" />
      </g>

      <rect y="458" width="1200" height="6" fill={a} opacity=".26" />
      <rect y="466" width="1200" height="2" fill={b} opacity=".20" />

      <g>
        <rect x="420" y="360" width="560" height="200" rx="26" fill="#0B0F1F" opacity=".70" />
        <rect x="450" y="385" width="500" height="130" rx="22" fill={b} opacity=".12" />
        <rect x="458" y="404" width="220" height="78" rx="18" fill={a} opacity=".10" />
        <rect x="720" y="404" width="220" height="78" rx="18" fill={a} opacity=".08" />
      </g>

      <g opacity=".88">
        <rect x="880" y="280" width="220" height="180" rx="18" fill="#0B0F1F" opacity=".62" />
        <rect x="900" y="300" width="180" height="28" rx="10" fill={a} opacity=".12" />
        <rect x="900" y="338" width="180" height="28" rx="10" fill={a} opacity=".10" />
        <rect x="900" y="376" width="180" height="28" rx="10" fill={a} opacity=".09" />
      </g>

      <text x="600" y="50" textAnchor="middle" fill="#fff" opacity=".55"
        style={{ fontFamily:"ui-monospace, Menlo, monospace", letterSpacing:".16em", fontSize: 16 }}>
        {title?.toUpperCase()}
      </text>
    </svg>
  );
}

export default function RoomScene({ room, characterId, onTalk }) {
  const [selected, setSelected] = useState(null);
  const [payload, setPayload] = useState("");

  const a = room?.palette?.a || "#76FFE1";
  const b = room?.palette?.b || "#8C50FF";

  const promptForAction = useMemo(() => ({
    memories: (label) => `Return a SHORT in-universe MEMORY TRACE about: ${label}.`,
    personality: (label) => `Return a SHORT in-universe PERSONALITY FILE snippet about: ${label}.`,
    status: (label) => `Return a SHORT SYSTEM STATUS readout tied to: ${label}.`,
    raid_logs: (label) => `Return a SHORT RAID LOG excerpt tied to: ${label}.`,
    evolution: (label) => `Return a SHORT EVOLUTION DATABASE excerpt tied to: ${label}.`,
    relationship: (label) => `Return a SHORT RELATIONSHIP SNAPSHOT tied to: ${label}.`,
  }), []);

  const clickHotspot = async (h) => {
    setSelected(h);
    setPayload("SYNCING WITH NEXUS…");

    try {
      const prompt = (promptForAction[h.action] || ((x) => `Scan object: ${x}.`))(h.label);
      const res = await nexusChat(characterId, prompt);
      const reply = res?.reply || res?.message || res?.output || res?.text || JSON.stringify(res, null, 2);
      setPayload(`[ROOM: ${room.title}]\nHOTSPOT: ${h.label}\nACTION: ${h.action}\n\n${reply}`);
    } catch (e) {
      setPayload(`NEXUS LINK FAILED.\n\n${String(e.message || e)}\n\nTip: verify your Nexus has POST /api/chat/{characterId} or adjust nexusChat() in src/lib/api.js`);
    }
  };

  return (
    <div className="tsv-glass tsv-glow" style={{ position:"relative", overflow:"hidden", minHeight: 520 }}>
      <div className="tsv-scanlines tsv-noise" style={{ position:"absolute", inset:0 }}>
        <Backdrop a={a} b={b} title={room.title} />
      </div>

      <div className="tsv-float" style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background: `radial-gradient(900px 500px at 50% 10%, ${a}18, transparent 60%),
                     radial-gradient(700px 420px at 70% 30%, ${b}14, transparent 55%)`,
        opacity: .95
      }} />

      <div style={{ position:"absolute", inset:0 }}>
        {(room.hotspots || []).map((h) => (
          <button
            key={h.key}
            onClick={() => clickHotspot(h)}
            className="tsv-pill tsv-pulse"
            style={{
              position:"absolute",
              left:`${h.x}%`, top:`${h.y}%`,
              transform:"translate(-50%,-50%)",
              borderColor:`${a}55`,
              boxShadow:`0 0 18px ${a}22`,
              background:`linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))`,
              cursor:"pointer",
            }}
            title={h.label}
          >
            <span style={{ width:8, height:8, borderRadius:999, background:a, boxShadow:`0 0 14px ${a}` }} />
            <span className="tsv-title" style={{ fontSize:12, opacity:.92 }}>{h.label}</span>
          </button>
        ))}
      </div>

      <div style={{ position:"absolute", left:14, right:14, bottom:14, display:"grid", gridTemplateColumns:"1.2fr .8fr", gap: 12 }}>
        <div className="tsv-glass" style={{ padding: 12, borderRadius: 16, position:"relative" }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.75, marginBottom: 8 }}>
            {selected ? `READOUT — ${selected.label}` : "ROOM READOUT"}
          </div>
          <pre style={{ margin:0, whiteSpace:"pre-wrap", fontSize: 12, opacity:.88, lineHeight: 1.35 }}>
            {payload || room.vibe}
          </pre>
        </div>

        <div className="tsv-glass" style={{ padding: 12, borderRadius: 16 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.75, marginBottom: 8 }}>CONTROLS</div>
          <button className="tsv-btn" style={{ width:"100%", marginBottom: 10 }} onClick={onTalk}>
            Talk to Her
          </button>
          <div style={{ fontSize: 12, opacity:.72 }}>
            Click glowing items to pull Nexus readouts into the room.
          </div>
        </div>
      </div>
    </div>
  );
}

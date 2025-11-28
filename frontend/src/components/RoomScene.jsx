import { useMemo, useState } from "react";
import { nexusClient } from "../services/nexusClient";

function RoomBackdropSVG({ palette, title }) {
  const a = palette?.a || "#76FFE1";
  const b = palette?.b || "#8C50FF";

  // Stylized bedroom: wall, window, bed, dresser, neon strips
  return (
    <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" style={{ display:"block" }}>
      <defs>
        <linearGradient id="wall" x1="0" x2="1">
          <stop offset="0" stopColor={b} stopOpacity=".22"/>
          <stop offset="1" stopColor={a} stopOpacity=".18"/>
        </linearGradient>
        <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".20"/>
          <stop offset="1" stopColor="#000" stopOpacity=".55"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge>
            <feMergeNode in="b"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* wall */}
      <rect x="0" y="0" width="1200" height="470" fill="url(#wall)" />
      {/* floor */}
      <rect x="0" y="470" width="1200" height="230" fill="url(#floor)" />

      {/* window */}
      <g opacity=".9">
        <rect x="90" y="70" width="260" height="220" rx="18" fill="#0A1030" opacity=".55" />
        <rect x="110" y="92" width="220" height="176" rx="14" fill={a} opacity=".10" />
        <path d="M110 180H330" stroke={a} strokeOpacity=".26" />
        <path d="M220 92V268" stroke={a} strokeOpacity=".26" />
      </g>

      {/* neon strips */}
      <g filter="url(#glow)">
        <rect x="0" y="458" width="1200" height="6" fill={a} opacity=".28" />
        <rect x="0" y="466" width="1200" height="2" fill={b} opacity=".22" />
      </g>

      {/* bed */}
      <g>
        <rect x="420" y="360" width="560" height="200" rx="26" fill="#0B0F1F" opacity=".70" />
        <rect x="450" y="385" width="500" height="130" rx="22" fill={b} opacity=".12" />
        <rect x="458" y="404" width="220" height="78" rx="18" fill={a} opacity=".10" />
        <rect x="720" y="404" width="220" height="78" rx="18" fill={a} opacity=".08" />
      </g>

      {/* dresser */}
      <g opacity=".88">
        <rect x="880" y="280" width="220" height="180" rx="18" fill="#0B0F1F" opacity=".62" />
        <rect x="900" y="300" width="180" height="28" rx="10" fill={a} opacity=".12" />
        <rect x="900" y="338" width="180" height="28" rx="10" fill={a} opacity=".10" />
        <rect x="900" y="376" width="180" height="28" rx="10" fill={a} opacity=".09" />
      </g>

      {/* label */}
      <text x="595" y="55" textAnchor="middle" fill="#fff" opacity=".55"
        style={{ fontFamily:"ui-monospace, Menlo, monospace", letterSpacing:".16em", fontSize: 16 }}>
        {title?.toUpperCase()}
      </text>
    </svg>
  );
}

export default function RoomScene({ room, characterId, onTalk }) {
  const [selected, setSelected] = useState(null);
  const [payload, setPayload] = useState("");

  const palette = room?.palette || { a:"#76FFE1", b:"#8C50FF" };
  const bgImage = room?.bgImage || "";

  const promptForAction = useMemo(() => ({
    memories: (label) => `Return a short in-universe “memory trace” about: ${label}.`,
    personality: (label) => `Return a short in-universe “personality file snippet” about: ${label}.`,
    status: (label) => `Return a short “system status readout” tied to: ${label}.`,
    raid_logs: (label) => `Return a short “raid log excerpt” tied to: ${label}.`,
    evolution: (label) => `Return a short “evolution database excerpt” tied to: ${label}.`,
    relationship: (label) => `Return a short “relationship snapshot” tied to: ${label}.`,
  }), []);

  const clickHotspot = async (h) => {
    setSelected(h);
    setPayload("LOADING FROM NEXUS…");

    // Use your nexus client. If you only have chat-mind, this still works.
    const promptFn = promptForAction[h.action] || ((label) => `Scan object: ${label}. Return in-universe readout.`);
    const prompt = promptFn(h.label);

    // Preferred: use chat mind if available in your client.
    const res = (nexusClient.chatMind)
      ? await nexusClient.chatMind(characterId, prompt, { localHistory: null })
      : await nexusClient.sendChat?.(characterId, prompt);

    const reply = res?.reply ?? res?.message ?? res?.output ?? res?.text ?? null;

    if (!reply) {
      setPayload("NEXUS LINK FAILED.\n(Proxy/CORS/endpoint mismatch)\nOpen Debug panel and verify /nexus/* routes.");
      return;
    }

    setPayload(`[${room.title}]\nHOTSPOT: ${h.label}\nACTION: ${h.action}\n\n${reply}`);
  };

  return (
    <div className="tsv-glass tsv-glow" style={{ position:"relative", overflow:"hidden", minHeight: 520 }}>
      {/* Optional background image layer (if you add room art later) */}
      {bgImage ? (
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:`url(${bgImage})`,
          backgroundSize:"cover", backgroundPosition:"center",
          opacity:.18, filter:"saturate(1.15) contrast(1.05)",
        }} />
      ) : null}

      {/* SVG bedroom backdrop (always present) */}
      <div className="tsv-scanlines tsv-noise" style={{ position:"absolute", inset:0 }}>
        <RoomBackdropSVG palette={palette} title={room.title} />
      </div>

      {/* Floating particles (simple) */}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        background: `radial-gradient(900px 500px at 50% 10%, ${palette.a}18, transparent 60%),
                     radial-gradient(700px 420px at 70% 30%, ${palette.b}14, transparent 55%)`,
        animation: "floaty 6s ease-in-out infinite",
      }} />

      {/* Hotspots */}
      <div style={{ position:"absolute", inset:0 }}>
        {room.hotspots.map((h) => (
          <button
            key={h.key}
            onClick={() => clickHotspot(h)}
            className="tsv-pill tsv-pulse"
            style={{
              position:"absolute",
              left:`${h.x}%`, top:`${h.y}%`,
              transform:"translate(-50%,-50%)",
              borderColor:`${palette.a}55`,
              boxShadow:`0 0 18px ${palette.a}22`,
              background:`linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))`,
              cursor:"pointer",
            }}
            title={h.label}
          >
            <span style={{ width:8, height:8, borderRadius:999, background:palette.a, boxShadow:`0 0 14px ${palette.a}` }} />
            <span style={{ fontFamily:"ui-monospace, Menlo, monospace", fontSize:12, letterSpacing:".06em" }}>
              {h.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom HUD */}
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
          <div className="tsv-title" style={{ fontSize: 12, opacity:.75, marginBottom: 8 }}>
            CONTROLS
          </div>
          <button className="tsv-btn" style={{ width:"100%", marginBottom: 10 }} onClick={onTalk}>
            Talk to Her
          </button>
          <div style={{ fontSize: 12, opacity:.72 }}>
            Tip: Click glowing items to pull Nexus logs into the room.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floaty {
          0%,100% { transform: translateY(0px); opacity: .95; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

import HoloPortrait from "./HoloPortrait";

export default function CharacterCard({ character, onOpen }) {
  const { name, subtitle, accent, glow, portrait } = character;

  return (
    <div className="tsv-glass tsv-glow" style={{ position:"relative", overflow:"hidden", padding: 14 }}>
      <div className="tsv-title" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, opacity: .95 }}>{name}</div>
          <div style={{ fontSize: 12, opacity: .70, marginTop: 4 }}>{subtitle}</div>
        </div>
        <span className="tsv-pill" style={{ borderColor: `${accent}33` }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, boxShadow: `0 0 16px ${accent}` }} />
          FILE
        </span>
      </div>

      <div className="tsv-scanlines tsv-noise" style={{ marginTop: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,.10)", overflow:"hidden", position:"relative" }}>
        {/* If portrait exists, show it; otherwise show hologram portrait */}
        <div style={{ aspectRatio: "4 / 5", background: `radial-gradient(900px 520px at 50% 15%, ${glow}22, transparent 65%)` }}>
          <img
            src={portrait}
            alt={name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
          {/* Always render fallback under it */}
          <div style={{ position:"absolute", inset: 0, pointerEvents:"none" }}>
            <HoloPortrait name={name} accent={accent} glow={glow} />
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <button className="tsv-btn" onClick={() => onOpen("profile")}>Open File</button>
        <button className="tsv-btn" onClick={() => onOpen("room")}>Enter Room</button>
      </div>

      <div style={{
        position:"absolute", inset: -2, pointerEvents:"none",
        background: `radial-gradient(700px 260px at 50% 0%, ${accent}18, transparent 60%)`
      }} />
    </div>
  );
}

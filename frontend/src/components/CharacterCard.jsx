import HoloPortrait from "./HoloPortrait.jsx";

export default function CharacterCard({ c, onProfile, onRoom }) {
  return (
    <div className="tsv-glass tsv-glow" style={{ padding: 14, position:"relative", overflow:"hidden" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap: 10, alignItems:"flex-start" }}>
        <div>
          <div className="tsv-title" style={{ fontSize: 14 }}>{c.name}</div>
          <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>{c.subtitle}</div>
        </div>
        <span className="tsv-pill" style={{ borderColor: `${c.accent}33` }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: c.accent, boxShadow: `0 0 16px ${c.accent}` }} />
          FILE
        </span>
      </div>

      <div className="tsv-scanlines tsv-noise" style={{ marginTop: 12, borderRadius: 16, border:"1px solid rgba(255,255,255,.10)", overflow:"hidden", position:"relative" }}>
        <div style={{ aspectRatio:"4/5", background:`radial-gradient(900px 520px at 50% 15%, ${c.glow}22, transparent 65%)`, position:"relative" }}>
          <img
            src={c.portrait}
            alt={c.name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
          <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
            <HoloPortrait name={c.name} accent={c.accent} glow={c.glow} />
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginTop: 12 }}>
        <button className="tsv-btn" onClick={onProfile}>Open Profile</button>
        <button className="tsv-btn" onClick={onRoom}>Enter Room</button>
      </div>

      <div style={{
        position:"absolute", inset:-2, pointerEvents:"none",
        background:`radial-gradient(700px 260px at 50% 0%, ${c.accent}18, transparent 60%)`
      }} />
    </div>
  );
}

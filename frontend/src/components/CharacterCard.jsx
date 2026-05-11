import HoloPortrait from "./HoloPortrait.jsx";
import CharacterAnimations from "./CharacterAnimations.jsx";

export default function CharacterCard({ c, onProfile, onRoom, onWatchNexus }) {
  // Set default values for Nexus data
  const accent = c.accent || "#00ffff";
  const glow = c.glow || "#8800ff";
  const subtitle = c.role || c.subtitle || "TSV Character";
  const portrait = c.avatar || c.portrait || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=400&background=1a1a2e&color=00ffff&bold=true`;

  return (
    <div className="tsv-glass tsv-glow tsv-float" style={{ padding: 16, position:"relative", overflow:"hidden" }}>
      {/* POWER INDICATOR STRIP */}
      <div style={{ 
        position:"absolute", 
        top:0, 
        left:0, 
        right:0, 
        height:3, 
        background:`linear-gradient(90deg, transparent, ${accent}, transparent)`,
        boxShadow:`0 0 10px ${accent}`
      }} />

      <div style={{ display:"flex", justifyContent:"space-between", gap: 10, alignItems:"flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div className="tsv-title" style={{ fontSize: 14, color: accent, wordWrap: "break-word" }}>{c.name}</div>
          <div style={{ fontSize: 11, color:"var(--text-dim)", marginTop: 6, textTransform:"uppercase", letterSpacing:".08em", lineHeight: 1.4 }}>
            {subtitle.substring(0, 80)}{subtitle.length > 80 ? "..." : ""}
          </div>
        </div>
        <span className="tsv-pill tsv-pulse" style={{ 
          borderColor: accent, 
          background:`linear-gradient(135deg, ${accent}15, ${glow}10)`,
          flexShrink: 0
        }}>
          <span className="tsv-holo" style={{ 
            width: 8, 
            height: 8, 
            background: accent, 
            boxShadow: `0 0 12px ${accent}, inset 0 0 4px ${accent}`,
            clipPath:"polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"
          }} />
          <span style={{fontSize:10,letterSpacing:".1em"}}>FILE</span>
        </span>
      </div>

      {/* 3D PORTRAIT FRAME */}
      <div className="tsv-scanlines tsv-noise" style={{ 
        marginTop: 14, 
        overflow:"hidden", 
        position:"relative",
        border:`2px solid ${accent}`,
        borderTop:`2px solid ${accent}88`,
        borderLeft:`2px solid ${accent}88`,
        clipPath:"polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
        boxShadow:`0 0 20px ${accent}40, inset 0 0 30px ${glow}20`
      }}>
        <div style={{ 
          aspectRatio:"4/5", 
          background:`
            radial-gradient(circle at 50% 30%, ${glow}35, transparent 60%),
            radial-gradient(circle at 20% 80%, ${accent}25, transparent 50%),
            linear-gradient(180deg, #0a0a12, #050508)
          `, 
          position:"relative" 
        }}>
          <CharacterAnimations characterId={c.id} intensity="medium">
            <img
              src={portrait}
              alt={c.name}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.92 }}
            />
            <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
              <HoloPortrait name={c.name} accent={accent} glow={glow} />
            </div>
          </CharacterAnimations>
          
          {/* CORNER BRACKETS */}
          <svg style={{position:"absolute",inset:0,pointerEvents:"none"}} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 0 L8 0 L8 1 L1 1 L1 8 L0 8 Z" fill={accent} opacity=".6"/>
            <path d="M100 0 L92 0 L92 1 L99 1 L99 8 L100 8 Z" fill={accent} opacity=".6"/>
            <path d="M0 100 L8 100 L8 99 L1 99 L1 92 L0 92 Z" fill={accent} opacity=".6"/>
            <path d="M100 100 L92 100 L92 99 L99 99 L99 92 L100 92 Z" fill={accent} opacity=".6"/>
          </svg>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10, marginTop: 14 }}>
        <button className="tsv-btn" onClick={onProfile} style={{fontSize:11, padding: "10px 12px"}}>
          OPEN PROFILE
        </button>
        <button className="tsv-btn" onClick={onRoom} style={{fontSize:11, padding: "10px 12px"}}>
          ENTER ROOM
        </button>
      </div>

      {onWatchNexus && (
        <button
          className="tsv-btn"
          onClick={onWatchNexus}
          style={{
            fontSize: 11,
            padding: "10px 12px",
            marginTop: 8,
            width: "100%",
            background: `linear-gradient(135deg, rgba(255,107,0,.18), rgba(255,184,0,.12))`,
            borderColor: "rgba(255,107,0,.55)",
            color: "#FFB800",
            letterSpacing: ".08em",
          }}
        >
          🎬 WATCH ON NEXUS
        </button>
      )}

      {/* AMBIENT GLOW */}
      <div style={{
        position:"absolute", 
        bottom:-20, 
        left:"50%",
        transform:"translateX(-50%)",
        width:"80%",
        height:60,
        pointerEvents:"none",
        background:`radial-gradient(ellipse, ${accent}30, transparent 70%)`,
        filter:"blur(20px)"
      }} />
    </div>
  );
}
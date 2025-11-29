import { useNavigate } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";

export default function InteractiveMap() {
  const navigate = useNavigate();

  // Map positions for each room
  const roomPositions = {
    victoria_black: { x: 50, y: 15, label: "Victoria" },
    wargirl: { x: 20, y: 35, label: "Wargirl" },
    binary: { x: 80, y: 35, label: "Binary" },
    vanessa: { x: 35, y: 55, label: "Vanessa" },
    harmony: { x: 65, y: 55, label: "Harmony" },
    evil_victoria: { x: 15, y: 75, label: "Evil V." },
    veronica: { x: 85, y: 75, label: "Veronica" },
    gameroom: { x: 50, y: 85, label: "GAME ROOM", special: true }
  };

  return (
    <div className="tsv-glass tsv-glow" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
      <div className="tsv-title" style={{ fontSize: 14, marginBottom: 12 }}>
        🗺️ INTERACTIVE MAP — SELECT DESTINATION
      </div>

      <div style={{ position: "relative", width: "100%", height: 400, background: "linear-gradient(135deg, #0a0a12, #1a1a2e)", borderRadius: 12, overflow: "hidden" }}>
        {/* Background grid */}
        <svg style={{ position: "absolute", inset: 0, opacity: 0.15 }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 5} x2="100" y2={i * 5} stroke="#00ffff" strokeWidth="0.1" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 5} y1="0" x2={i * 5} y2="100" stroke="#00ffff" strokeWidth="0.1" />
          ))}
        </svg>

        {/* Connecting lines */}
        <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGlow" x1="0" x2="1">
              <stop offset="0" stopColor="#00ffff" stopOpacity="0.3" />
              <stop offset="0.5" stopColor="#8800ff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#00ffff" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Lines connecting rooms */}
          <line x1="50" y1="15" x2="20" y2="35" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="50" y1="15" x2="80" y2="35" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="20" y1="35" x2="35" y2="55" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="80" y1="35" x2="65" y2="55" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="35" y1="55" x2="15" y2="75" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="65" y1="55" x2="85" y2="75" stroke="url(#lineGlow)" strokeWidth="0.3" />
          <line x1="50" y1="85" x2="35" y2="55" stroke="url(#lineGlow)" strokeWidth="0.4" />
          <line x1="50" y1="85" x2="65" y2="55" stroke="url(#lineGlow)" strokeWidth="0.4" />
        </svg>

        {/* Room nodes */}
        {Object.entries(roomPositions).map(([id, pos]) => {
          const char = TSV_CHARACTERS.find(c => c.id === id);
          if (!char) return null;

          return (
            <button
              key={id}
              onClick={() => navigate(`/rooms/${id}`)}
              className="tsv-pulse"
              style={{
                position: "absolute",
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                background: pos.special 
                  ? `radial-gradient(circle, ${char.accent}88, ${char.glow}55)` 
                  : `radial-gradient(circle, ${char.accent}66, ${char.glow}44)`,
                border: `3px solid ${char.accent}`,
                borderRadius: "50%",
                width: pos.special ? 90 : 70,
                height: pos.special ? 90 : 70,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px ${char.accent}, 0 0 40px ${char.glow}`,
                transition: "all 0.2s ease",
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.15)";
                e.currentTarget.style.boxShadow = `0 0 30px ${char.accent}, 0 0 60px ${char.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
                e.currentTarget.style.boxShadow = `0 0 20px ${char.accent}, 0 0 40px ${char.glow}`;
              }}
            >
              <div style={{ 
                fontSize: pos.special ? 24 : 18, 
                marginBottom: 4,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
              }}>
                {pos.special ? "🎮" : "👤"}
              </div>
              <div className="tsv-title" style={{ 
                fontSize: pos.special ? 9 : 8, 
                textAlign: "center",
                textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                fontWeight: pos.special ? "bold" : "normal"
              }}>
                {pos.label}
              </div>
            </button>
          );
        })}

        {/* Central hub indicator */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 150,
          height: 150,
          borderRadius: "50%",
          border: "2px dashed rgba(0,255,255,0.3)",
          pointerEvents: "none",
          animation: "spin 30s linear infinite"
        }} />
      </div>

      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.7, textAlign: "center" }}>
        Click any room to enter • Lines show connections • Gold = Special Zone
      </div>

      <style>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

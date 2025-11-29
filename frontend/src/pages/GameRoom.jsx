import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TSV_GAMES, GIRL_COACHES, TSV_CHARACTERS } from "../content/tsvContent.js";

export default function GameRoom() {
  const nav = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedCoach, setSelectedCoach] = useState("harmony");
  const [selectedMode, setSelectedMode] = useState("coach");

  if (selectedGame) {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="tsv-title" style={{ fontSize: 14 }}>Select Your Coach & Mode</div>
          <button className="tsv-btn" onClick={() => setSelectedGame(null)}>← Back</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          {/* Coach Selection */}
          <div className="tsv-glass" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>Choose Your Coach:</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {Object.entries(GIRL_COACHES).map(([id, coach]) => (
                <button
                  key={id}
                  className="tsv-btn"
                  onClick={() => setSelectedCoach(id)}
                  style={{
                    background: selectedCoach === id ? `linear-gradient(135deg, ${TSV_CHARACTERS.find(c => c.id === id)?.accent || "#00ffff"}33, rgba(0,0,0,0.3))` : undefined,
                    borderColor: selectedCoach === id ? (TSV_CHARACTERS.find(c => c.id === id)?.accent || "#00ffff") : undefined
                  }}
                >
                  <div style={{ fontSize: 10 }}>{coach.name}</div>
                  <div style={{ fontSize: 8, opacity: 0.6, marginTop: 4 }}>{coach.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="tsv-glass" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>Game Mode:</div>
            {["coach", "rival", "date"].map(mode => (
              <button
                key={mode}
                className="tsv-btn"
                onClick={() => setSelectedMode(mode)}
                style={{
                  width: "100%",
                  marginBottom: 8,
                  background: selectedMode === mode ? "linear-gradient(135deg, #00ff8833, rgba(0,0,0,0.3))" : undefined,
                  borderColor: selectedMode === mode ? "#00ff88" : undefined
                }}
              >
                {mode === "coach" && "🎓 Coach Mode"}
                {mode === "rival" && "⚔️ Rival Mode"}
                {mode === "date" && "♥ Date Mode"}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="tsv-btn" 
          style={{ width: "100%", marginTop: 14, fontSize: 16, padding: "16px" }}
          onClick={() => nav(`/game/${selectedGame}?coach=${selectedCoach}&mode=${selectedMode}`)}
        >
          START GAME! →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div className="tsv-title" style={{ fontSize: 14 }}>🎮 GAME ROOM — Select Your Game</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
            Choose from addictive Nintendo-style games to play with the girls!
          </div>
        </div>
        <button className="tsv-btn" onClick={() => nav(-1)}>
          ← BACK
        </button>
      </div>

      {/* Games Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {TSV_GAMES.map((game) => (
          <div key={game.id} className="tsv-glass tsv-glow tsv-float" style={{ padding: 16, position: "relative", overflow: "hidden" }}>
            {/* Game icon background */}
            <div style={{
              position: "absolute",
              right: -20,
              top: -20,
              fontSize: 120,
              opacity: 0.08,
              pointerEvents: "none"
            }}>
              {game.icon}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 36 }}>{game.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="tsv-title" style={{ fontSize: 14 }}>{game.name}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>{game.type}</div>
              </div>
            </div>

            <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12, lineHeight: 1.4 }}>
              {game.description}
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span className="tsv-pill" style={{
                fontSize: 10,
                background: game.difficulty === "Easy" ? "rgba(0,255,136,0.2)" :
                           game.difficulty === "Medium" ? "rgba(255,208,0,0.2)" :
                           "rgba(255,75,75,0.2)",
                borderColor: game.difficulty === "Easy" ? "#00ff88" :
                            game.difficulty === "Medium" ? "#ffd000" :
                            "#ff4b4b"
              }}>
                {game.difficulty}
              </span>
            </div>

            <button 
              className="tsv-btn" 
              style={{ width: "100%" }}
              onClick={() => game.implemented ? setSelectedGame(game.id) : alert("Coming soon!")}
            >
              {game.implemented ? "PLAY NOW ▶" : "COMING SOON"}
            </button>

            {/* Glow effect */}
            <div style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: 40,
              background: "radial-gradient(ellipse, #FFD70060, transparent)",
              filter: "blur(15px)",
              pointerEvents: "none"
            }} />
          </div>
        ))}
      </div>

      {/* Add Game Instructions */}
      <div className="tsv-glass" style={{ padding: 16, marginTop: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, marginBottom: 8 }}>
          ➕ WANT TO ADD MORE GAMES?
        </div>
        <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.5 }}>
          To add new games, edit: <code>/app/frontend/src/content/tsvContent.js</code>
          <br />
          Add new entries to the <code>TSV_GAMES</code> array with: id, name, type, description, difficulty, and icon (emoji)
        </div>
      </div>
    </div>
  );
}

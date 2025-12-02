import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import CharacterAnimations from "../components/CharacterAnimations.jsx";
import IdleTerminalMessages from "../components/IdleTerminalMessages.jsx";
import UnlockTracker from "../components/UnlockTracker.jsx";

export default function Home() {
  const nav = useNavigate();
  const [selectedChar, setSelectedChar] = useState(null);
  const [unlockedSecret, setUnlockedSecret] = useState(false);

  useEffect(() => {
    // Check if user has unlocked secret content
    const unlocked = localStorage.getItem('tsv_secret_unlocked') === 'true';
    setUnlockedSecret(unlocked);
  }, []);

  const characters = TSV_CHARACTERS.filter(c => !c.isSpecial);
  const secretChar = TSV_CHARACTERS.find(c => c.id === 'evil_victoria');

  return (
    <div>
      {/* Idle Messages Component */}
      <IdleTerminalMessages characters={characters} />
      
      {/* Unlock Tracker */}
      <UnlockTracker onUnlock={() => setUnlockedSecret(true)} />

      {/* Terminal Header */}
      <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 16, position:"relative", marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>TIME PATROL // DRESSING ROOM ACCESS</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity:.78, lineHeight: 1.5 }}>
          <span style={{ color: "#76FFE1" }}>SYSTEM:</span> Select a subject for immediate Dressing Room access.
          <br />
          <span style={{ opacity: 0.6, fontSize: 11 }}>
            ⚡ Generate AI outfits • 🎨 Mix & match clothing • 💾 Save & share creations
          </span>
        </div>
        {unlockedSecret && (
          <div style={{ 
            marginTop: 12, 
            padding: 8, 
            background: "rgba(255,0,0,.1)", 
            border: "1px solid rgba(255,0,0,.3)",
            borderRadius: 8
          }}>
            <div className="tsv-title" style={{ fontSize: 11, color: "#ff4444" }}>
              🔓 CLASSIFIED ACCESS GRANTED
            </div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>
              Subject EVIL_VICTORIA now available for dressing protocols
            </div>
          </div>
        )}
      </div>

      {/* Character Selection Grid - Large Avatars */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: 14 
      }}>
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => nav(`/dressing-room/${c.id}`)}
            onMouseEnter={() => setSelectedChar(c.id)}
            onMouseLeave={() => setSelectedChar(null)}
            className="tsv-glass tsv-glow"
            style={{
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              border: selectedChar === c.id ? `2px solid ${c.accent}` : "2px solid rgba(255,255,255,.14)",
              background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
              overflow: "hidden",
              transition: "all 0.3s ease",
              transform: selectedChar === c.id ? "translateY(-4px)" : "translateY(0)",
              boxShadow: selectedChar === c.id ? `0 8px 24px ${c.accent}40, 0 0 40px ${c.accent}30` : "0 4px 12px rgba(0,0,0,.4)"
            }}
          >
            {/* Large Avatar Image */}
            <div className="tsv-scanlines tsv-noise" style={{ 
              position: "relative",
              aspectRatio: "4/5",
              overflow: "hidden"
            }}>
              <CharacterAnimations characterId={c.id} intensity="medium">
                <img 
                  src={c.portrait} 
                  alt={c.name}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              </CharacterAnimations>
              
              {/* Overlay Gradient */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60%",
                background: `linear-gradient(to top, rgba(0,0,0,0.95), transparent)`,
                pointerEvents: "none"
              }} />

              {/* Character Info Overlay */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 14
              }}>
                <div className="tsv-title" style={{ 
                  fontSize: 14, 
                  color: c.accent,
                  textShadow: `0 0 20px ${c.accent}, 0 0 40px ${c.glow}`
                }}>
                  {c.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                  {c.subtitle}
                </div>
                
                {/* Likes Counter */}
                <div style={{ 
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: c.accent }}>❤</span>
                    <span style={{ opacity: 0.7 }}>OUTFIT_LIKES:</span>
                    <span style={{ color: c.accent, fontWeight: "bold" }}>
                      {localStorage.getItem(`tsv_likes_${c.id}`) || 0}
                    </span>
                  </div>
                </div>

                {/* Hover Action */}
                {selectedChar === c.id && (
                  <div style={{
                    marginTop: 10,
                    padding: "6px 12px",
                    background: `linear-gradient(135deg, ${c.accent}30, ${c.glow}20)`,
                    borderRadius: 8,
                    border: `1px solid ${c.accent}`,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "bold",
                    color: c.accent,
                    textShadow: `0 0 10px ${c.accent}`
                  }}>
                    ⚡ ACCESS DRESSING ROOM
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}

        {/* Secret Character - Only if Unlocked */}
        {unlockedSecret && secretChar && (
          <button
            key={secretChar.id}
            onClick={() => nav(`/dressing-room/${secretChar.id}`)}
            onMouseEnter={() => setSelectedChar(secretChar.id)}
            onMouseLeave={() => setSelectedChar(null)}
            className="tsv-glass tsv-glow"
            style={{
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              border: selectedChar === secretChar.id ? `2px solid ${secretChar.accent}` : "2px solid rgba(255,75,75,.4)",
              background: "linear-gradient(180deg, rgba(255,0,0,.15), rgba(0,0,0,.4))",
              overflow: "hidden",
              transition: "all 0.3s ease",
              transform: selectedChar === secretChar.id ? "translateY(-4px)" : "translateY(0)",
              boxShadow: selectedChar === secretChar.id ? `0 8px 24px ${secretChar.accent}60, 0 0 40px ${secretChar.accent}40` : "0 4px 12px rgba(255,0,0,.3)",
              animation: "secretPulse 2s ease-in-out infinite"
            }}
          >
            <div className="tsv-scanlines tsv-noise" style={{ 
              position: "relative",
              aspectRatio: "4/5",
              overflow: "hidden"
            }}>
              <CharacterAnimations characterId={secretChar.id} intensity="medium">
                <img 
                  src={secretChar.portrait} 
                  alt={secretChar.name}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              </CharacterAnimations>
              
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "60%",
                background: `linear-gradient(to top, rgba(0,0,0,0.95), transparent)`,
                pointerEvents: "none"
              }} />

              {/* Secret Badge */}
              <div style={{
                position: "absolute",
                top: 10,
                right: 10,
                padding: "4px 8px",
                background: "rgba(255,0,0,.3)",
                border: "1px solid #ff4444",
                borderRadius: 4,
                fontSize: 9,
                fontWeight: "bold",
                color: "#ff4444",
                textShadow: "0 0 10px #ff4444"
              }}>
                🔒 CLASSIFIED
              </div>

              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 14
              }}>
                <div className="tsv-title" style={{ 
                  fontSize: 14, 
                  color: secretChar.accent,
                  textShadow: `0 0 20px ${secretChar.accent}, 0 0 40px ${secretChar.glow}`
                }}>
                  {secretChar.name.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
                  {secretChar.subtitle}
                </div>
                
                <div style={{ 
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 10
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: secretChar.accent }}>❤</span>
                    <span style={{ opacity: 0.7 }}>OUTFIT_LIKES:</span>
                    <span style={{ color: secretChar.accent, fontWeight: "bold" }}>
                      {localStorage.getItem(`tsv_likes_${secretChar.id}`) || 0}
                    </span>
                  </div>
                </div>

                {selectedChar === secretChar.id && (
                  <div style={{
                    marginTop: 10,
                    padding: "6px 12px",
                    background: `linear-gradient(135deg, ${secretChar.accent}30, ${secretChar.glow}20)`,
                    borderRadius: 8,
                    border: `1px solid ${secretChar.accent}`,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: "bold",
                    color: secretChar.accent,
                    textShadow: `0 0 10px ${secretChar.accent}`
                  }}>
                    ⚡ ACCESS FORBIDDEN PROTOCOLS
                  </div>
                )}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Quick Access Terminal Commands */}
      <div className="tsv-glass" style={{ padding: 14, marginTop: 14 }}>
        <div className="tsv-title" style={{ fontSize: 12, opacity:.85, marginBottom: 10 }}>QUICK ACCESS TERMINALS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <button className="tsv-btn" onClick={() => nav("/storytime")} style={{ fontSize: 11 }}>
            📖 StoryTime Chamber
          </button>
          <button className="tsv-btn" onClick={() => nav("/map")} style={{ fontSize: 11 }}>
            🗺️ Interactive Map
          </button>
          <button className="tsv-btn" onClick={() => nav("/characters")} style={{ fontSize: 11 }}>
            📂 Character Files
          </button>
          <button className="tsv-btn" onClick={() => nav("/gameroom")} style={{ fontSize: 11 }}>
            🎮 Game Room
          </button>
          <button className="tsv-btn" onClick={() => nav("/deviantart")} style={{ fontSize: 11 }}>
            🎨 DeviantArt Feed
          </button>
        </div>
      </div>

      {/* Secret Pulse Animation */}
      <style>{`
        @keyframes secretPulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(255,0,0,.3), 0 0 20px rgba(255,75,75,.2); }
          50% { box-shadow: 0 4px 12px rgba(255,0,0,.5), 0 0 40px rgba(255,75,75,.4); }
        }
      `}</style>
    </div>
  );
}

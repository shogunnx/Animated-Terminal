import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCharacters } from "../lib/api.js";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import CharacterCard from "../components/CharacterCard.jsx";

export default function Characters() {
  const nav = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const data = await fetchCharacters();
        const nexusChars = data.characters || [];
        
        // Merge Nexus data with local TSV_CHARACTERS to include portraits and colors
        const merged = TSV_CHARACTERS.filter(c => !c.isSpecial).map(localChar => {
          const nexusChar = nexusChars.find(nc => 
            nc.displayName?.toLowerCase() === localChar.name.toLowerCase()
          );
          
          if (nexusChar) {
            return {
              ...localChar,
              ...nexusChar,
              name: localChar.name,
              portrait: nexusChar.avatar_image || localChar.portrait,
              avatar: nexusChar.avatar_image || localChar.portrait,
              accent: localChar.accent,
              glow: localChar.glow,
              subtitle: localChar.subtitle
            };
          }
          return localChar;
        });
        
        setCharacters(merged);
        setLoading(false);
      } catch (err) {
        // Fallback to local TSV_CHARACTERS data
        setCharacters(TSV_CHARACTERS.filter(c => !c.isSpecial));
        setError(null);
        setLoading(false);
      }
    }
    loadCharacters();
  }, []);

  return (
    <div>
      <div className="tsv-glass tsv-glow" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>TSV CHARACTER ARCHIVE</div>
        <div style={{ fontSize: 12, opacity:.72, marginTop: 8 }}>
          Live character data from Nexus. Click any card to see their profile.
        </div>
      </div>

      {loading && (
        <div className="tsv-glass" style={{ padding: 20, textAlign: "center" }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity: 0.7 }}>
            LOADING CHARACTERS FROM NEXUS...
          </div>
        </div>
      )}

      {error && (
        <div className="tsv-glass" style={{ padding: 20, textAlign: "center", borderColor: "#ff0088" }}>
          <div className="tsv-title" style={{ fontSize: 12, color: "#ff0088" }}>
            ERROR: {error}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={{ 
          display:"grid", 
          gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", 
          gap: 14 
        }}>
          {characters.map((c) => (
            <CharacterCard
              key={c.id}
              c={c}
              onProfile={() => nav(`/characters/${c.id}`)}
              onRoom={() => nav(`/rooms/${c.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
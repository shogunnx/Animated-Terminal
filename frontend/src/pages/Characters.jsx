import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCharacters } from "../lib/api.js";
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
        setCharacters(data.characters || []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
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
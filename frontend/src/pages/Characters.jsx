import { useNavigate } from "react-router-dom";
import { TSV_CHARACTERS } from "../content/tsvContent.js";
import CharacterCard from "../components/CharacterCard.jsx";

export default function Characters() {
  const nav = useNavigate();
  return (
    <div>
      <div className="tsv-glass tsv-glow" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>TSV CHARACTER ARCHIVE</div>
        <div style={{ fontSize: 12, opacity:.72, marginTop: 8 }}>
          Portrait cards + full bedrooms for every girl.
          Add real portraits later at <code>/assets/portraits/&lt;id&gt;.png</code>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {TSV_CHARACTERS.map((c) => (
          <CharacterCard
            key={c.id}
            c={c}
            onProfile={() => nav(`/characters/${c.id}`)}
            onRoom={() => nav(`/rooms/${c.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

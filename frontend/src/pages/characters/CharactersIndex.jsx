import { useNavigate } from "react-router-dom";
import CharacterCard from "../../components/CharacterCard";
import { TSV_CHARACTERS } from "../../content/tsvContent";

export default function CharactersIndex() {
  const nav = useNavigate();

  return (
    <div className="tsv-bg" style={{ padding: 18 }}>
      <div style={{ maxWidth: 1100, margin:"0 auto" }}>
        <div className="tsv-glass tsv-glow" style={{ padding: 16, marginBottom: 14, position:"relative", overflow:"hidden" }}>
          <div className="tsv-title" style={{ fontSize: 14 }}>TSV — CHARACTER ARCHIVE</div>
          <div style={{ fontSize: 12, opacity: .72, marginTop: 8 }}>
            Visual file cards + bedrooms. Drop real portraits into <code>/public/assets/portraits</code> anytime.
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {TSV_CHARACTERS.filter(c => c.id !== "veronica").map((c) => (
            <CharacterCard
              key={c.id}
              character={c}
              onOpen={(mode) => mode === "room" ? nav(`/rooms/${c.id}`) : nav(`/characters/${c.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

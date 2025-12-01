import InteractiveMap from "../components/InteractiveMap.jsx";

export default function Map() {
  return (
    <div>
      <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 16, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>TIME PATROL // NAVIGATION SYSTEM</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.78, lineHeight: 1.5 }}>
          <span style={{ color: "#76FFE1" }}>SYSTEM:</span> Interactive map of all character rooms and facilities.
          <br />
          <span style={{ opacity: 0.6, fontSize: 11 }}>
            Click any location to navigate to that character's room.
          </span>
        </div>
      </div>

      <InteractiveMap />
    </div>
  );
}

import { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

// VixenVictoria's Archive — a rotating daily "sacred place that fell" widget.
// Shows today's entry by default; user can shuffle forward/back to explore.
export default function VixenArchiveWidget() {
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState(null);

  const load = async (endpoint) => {
    try {
      const r = await fetch(`${BACKEND_URL}${endpoint}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setEntry(await r.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load("/api/storytime/vixen-archive/today");
  }, []);

  if (error) return null;  // Silent failure — widget is optional
  if (!entry) {
    return (
      <div
        data-testid="vixen-archive-widget"
        className="tsv-glass"
        style={{
          padding: 16,
          marginBottom: 14,
          borderLeft: "3px solid #C0B8C9",
          fontSize: 12,
          opacity: 0.6,
        }}
      >
        Loading VixenVictoria's Archive…
      </div>
    );
  }

  const goNext = () => load(`/api/storytime/vixen-archive/${entry.index + 1}`);
  const goPrev = () => load(`/api/storytime/vixen-archive/${(entry.index - 1 + entry.total_entries) % entry.total_entries}`);
  const goToday = () => load(`/api/storytime/vixen-archive/today`);

  return (
    <div
      data-testid="vixen-archive-widget"
      className="tsv-glass"
      style={{
        padding: 18,
        marginBottom: 14,
        background: "linear-gradient(135deg, rgba(192,184,201,0.08), rgba(140,122,153,0.05))",
        borderLeft: "3px solid #C0B8C9",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div className="tsv-title" style={{ fontSize: 11, color: "#C0B8C9", letterSpacing: 1.5 }}>
            📜 VIXENVICTORIA'S ARCHIVE
          </div>
          <div style={{ fontSize: 9, opacity: 0.55, marginTop: 2 }}>
            Daily blurb · entry {entry.index + 1} of {entry.total_entries}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            data-testid="vixen-archive-prev"
            onClick={goPrev}
            title="Previous entry"
            style={archiveBtn}
          >‹</button>
          <button
            data-testid="vixen-archive-today"
            onClick={goToday}
            title="Back to today's entry"
            style={archiveBtn}
          >TODAY</button>
          <button
            data-testid="vixen-archive-next"
            onClick={goNext}
            title="Next entry"
            style={archiveBtn}
          >›</button>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
        {entry.title}
      </div>
      <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 10, fontStyle: "italic" }}>
        {entry.era}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.7, color: "#e9e9f1", whiteSpace: "pre-wrap" }}>
        “{entry.blurb}”
      </div>
    </div>
  );
}

const archiveBtn = {
  background: "rgba(192,184,201,0.12)",
  border: "1px solid rgba(192,184,201,0.4)",
  color: "#C0B8C9",
  fontSize: 10,
  padding: "4px 10px",
  borderRadius: 6,
  cursor: "pointer",
  letterSpacing: 0.5,
};

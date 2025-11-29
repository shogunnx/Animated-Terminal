import InteractiveMap from "../components/InteractiveMap.jsx";

export default function Home() {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 16, position:"relative", marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>WELCOME // IN-UNIVERSE TERMINAL</div>
        <div style={{ marginTop: 10, fontSize: 13, opacity:.78, lineHeight: 1.5 }}>
          This terminal is the "link hub" for TSV — but upgraded to feel like a Time Patrol system.
          <br />
          Use <b>Characters</b> to open files and enter bedrooms. New: <b>🎮 Game Room</b> for arcade fun!
        </div>
      </div>

      {/* Interactive Map */}
      <InteractiveMap />

      {/* Info Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 14 }}>
        <div className="tsv-glass" style={{ padding: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>COMMAND SUGGESTIONS</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity:.74 }}>
            • Click map nodes to teleport to rooms<br/>
            • Open profiles → chat through Nexus<br/>
            • Enter game room → play Nintendo-style games<br/>
            • Click hotspots for memories & logs
          </div>
        </div>
        <div className="tsv-glass" style={{ padding: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>LIVE LINKS</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity:.74 }}>
            Backend proxies Nexus and GirlsMind for stable connections.
            <br />
            ⭐ New gold node = Special Game Room zone!
          </div>
        </div>
      </div>
    </div>
  );
}
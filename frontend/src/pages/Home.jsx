export default function Home() {
  return (
    <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 16, position:"relative" }}>
      <div className="tsv-title" style={{ fontSize: 14 }}>WELCOME // IN-UNIVERSE TERMINAL</div>
      <div style={{ marginTop: 10, fontSize: 13, opacity:.78, lineHeight: 1.5 }}>
        This terminal is the “link hub” for TSV — but upgraded to feel like a Time Patrol system.
        <br />
        Use <b>Characters</b> to open files and enter bedrooms. Use <b>DeviantArt</b> for live gallery pulls.
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 14 }}>
        <div className="tsv-glass" style={{ padding: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>COMMAND SUGGESTIONS</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity:.74 }}>
            • Open a profile → chat with her through Nexus<br/>
            • Enter a room → click hotspots (memories, status, raid logs)<br/>
            • Plug in real portraits later → drop into <code>/assets/portraits</code>
          </div>
        </div>
        <div className="tsv-glass" style={{ padding: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>LIVE LINKS</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity:.74 }}>
            The backend proxies Nexus and GirlsMind to keep everything same-origin and stable.
            If Nexus/GirlsMind are down, the terminal stays online.
          </div>
        </div>
      </div>
    </div>
  );
}

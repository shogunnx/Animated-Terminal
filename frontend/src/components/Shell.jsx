import { Link, useLocation } from "react-router-dom";
import StatusBar from "./StatusBar.jsx";

export default function Shell({ children }) {
  const loc = useLocation();

  const NavLink = ({ to, label }) => {
    const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
    return (
      <Link to={to} className="tsv-pill" style={{ borderColor: active ? "rgba(255,255,255,.26)" : "rgba(255,255,255,.14)", opacity: active ? 1 : .84 }}>
        {label}
      </Link>
    );
  };

  const ExternalLink = ({ href, label, style = {} }) => {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="tsv-pill" 
        style={{ 
          textDecoration: "none",
          ...style 
        }}
      >
        {label}
      </a>
    );
  };

  return (
    <div className="tsv-bg">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "12px", minHeight: "100vh" }}>
        <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 14, position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12, flexWrap:"wrap" }}>
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
              <div className="tsv-title" style={{ fontSize: 14, opacity:.95 }}>TIME PATROL // TSV TERMINAL</div>
              <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>
                Live Nexus + GirlsMind + DeviantArt. Rooms for every girl.
              </div>
            </div>
            <div style={{ display:"flex", gap: 10, flexWrap:"wrap", justifyContent: "flex-end" }}>
              <NavLink to="/" label="Terminal" />
              <NavLink to="/characters" label="Characters" />
              <NavLink to="/dressing-room" label="👗 Dressing Room" />
              <NavLink to="/deviantart" label="DeviantArt" />
              <ExternalLink 
                href="https://rosebud.ai/p/9ae128f9-db5f-4ce9-b573-55d98d6f3807" 
                label="🔥 Fractured Power" 
                style={{ 
                  background: "linear-gradient(135deg, rgba(255,0,100,.3), rgba(200,0,255,.3))",
                  borderColor: "rgba(255,50,150,.6)",
                  color: "#ff80cc"
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <StatusBar />
          </div>
        </div>

        <div style={{ marginTop: 14, paddingBottom: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
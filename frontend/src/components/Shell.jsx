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

  return (
    <div className="tsv-bg">
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: 16 }}>
        <div className="tsv-glass tsv-glow tsv-scanlines tsv-noise" style={{ padding: 14, position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12, flexWrap:"wrap" }}>
            <div>
              <div className="tsv-title" style={{ fontSize: 14, opacity:.95 }}>TIME PATROL // TSV TERMINAL</div>
              <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>
                Live Nexus + GirlsMind + DeviantArt. Rooms for every girl.
              </div>
            </div>
            <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
              <NavLink to="/" label="Terminal" />
              <NavLink to="/characters" label="Characters" />
              <NavLink to="/deviantart" label="DeviantArt" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <StatusBar />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

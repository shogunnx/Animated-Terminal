import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

function Dot({ ok, label }) {
  return (
    <span className="tsv-pill" style={{ opacity: .95 }}>
      <span style={{
        width: 8, height: 8, borderRadius: 999,
        background: ok ? "#59ffb0" : "#ff5c72",
        boxShadow: ok ? "0 0 16px rgba(89,255,176,.45)" : "0 0 16px rgba(255,92,114,.35)"
      }} />
      <span className="tsv-title" style={{ fontSize: 12, opacity: .86 }}>{label}</span>
    </span>
  );
}

export default function StatusBar() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const st = await api.status();
        if (mounted) { setS(st); setErr(""); }
      } catch (e) {
        if (mounted) setErr(String(e.message || e));
      }
    })();
    const t = setInterval(async () => {
      try {
        const st = await api.status();
        if (mounted) { setS(st); setErr(""); }
      } catch (e) {
        if (mounted) setErr(String(e.message || e));
      }
    }, 15000);

    return () => { mounted = false; clearInterval(t); };
  }, []);

  if (err) {
    return (
      <div className="tsv-glass" style={{ padding: 12 }}>
        <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>STATUS</div>
        <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>Backend reachable, but status failed: {err}</div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="tsv-glass" style={{ padding: 12 }}>
        <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>STATUS</div>
        <div style={{ fontSize: 12, opacity:.70, marginTop: 6 }}>Scanning links…</div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
      <Dot ok={true} label="Terminal Online" />
      <Dot ok={!!s?.nexus?.ping?.ok} label="Nexus Link" />
      <Dot ok={!!s?.girlsmind?.ping?.ok} label="GirlsMind Link" />
      <Dot ok={!!s?.deviantart?.ping?.ok} label="DeviantArt Feed" />
    </div>
  );
}

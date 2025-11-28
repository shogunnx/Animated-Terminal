import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function DeviantArt() {
  const [items, setItems] = useState([]);
  const [rss, setRss] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.deviantArtLatest(18);
        if (!mounted) return;
        setRss(res.rss);
        setItems(res.items || []);
        setErr("");
      } catch (e) {
        if (!mounted) return;
        setErr(String(e.message || e));
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <div className="tsv-glass tsv-glow" style={{ padding: 14, marginBottom: 14 }}>
        <div className="tsv-title" style={{ fontSize: 14 }}>DEVIANTART // LIVE FEED</div>
        <div style={{ fontSize: 12, opacity:.72, marginTop: 8 }}>
          RSS source: {rss || "(not configured)"}<br/>
          Configure via env: <code>DEVIANTART_USERNAME</code> or <code>DEVIANTART_RSS_URL</code>
        </div>
      </div>

      {err ? (
        <div className="tsv-glass" style={{ padding: 14 }}>
          <div className="tsv-title" style={{ fontSize: 12, opacity:.85 }}>ERROR</div>
          <div style={{ marginTop: 8, opacity:.75, fontSize: 12 }}>{err}</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {items.map((it, idx) => (
            <a key={idx} href={it.link} target="_blank" rel="noreferrer" className="tsv-glass tsv-glow" style={{ padding: 12, display:"block" }}>
              <div className="tsv-title" style={{ fontSize: 12, opacity:.90 }}>{it.title || "Untitled"}</div>
              <div style={{ fontSize: 11, opacity:.65, marginTop: 6 }}>{it.published || ""}</div>
              <div className="tsv-scanlines tsv-noise" style={{ marginTop: 10, borderRadius: 14, overflow:"hidden", border:"1px solid rgba(255,255,255,.10)" }}>
                <div style={{ aspectRatio:"16/10", background:"rgba(0,0,0,.25)", position:"relative" }}>
                  {it.media_thumbnail ? (
                    <img src={it.media_thumbnail} alt={it.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  ) : (
                    <div style={{ padding: 12, fontSize: 12, opacity:.70 }}>
                      No thumbnail found in feed.
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity:.72 }}>
                Open on DeviantArt →
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

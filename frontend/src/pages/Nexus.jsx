import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * Nexus — Embedded SaiyanVictoria video player.
 * Loads https://saiyan-media-core.emergent.host/terminal?embed=1 inside an iframe
 * and uses the `saiyan-nexus` postMessage bridge to drive playback from the terminal.
 *
 * Deep-link URL params on /nexus that get forwarded to the embedded player:
 *   ?id=<videoId>           -> auto-loads that video
 *   ?cat=<category>         -> filters list mode by category
 *   ?type=short|long        -> filters list mode by type
 *   ?q=<text>               -> searches title/description/tags
 * e.g. /nexus?q=Vanessa  (used by character cards to surface that character's videos)
 *
 * Bridge spec:
 *   Outbound from iframe -> here:
 *     { source: "saiyan-nexus", type: "ready"|"loaded"|"play"|"pause"|"time"|"ended"|"error"|"select"|"filtered"|"navigate", payload }
 *   Inbound from here -> iframe (must use target):
 *     { target: "saiyan-nexus", type: "play"|"pause"|"toggle"|"seek"|"mute"|"volume"|"load"|"filter"|"next"|"prev"|"exit", payload }
 */
const NEXUS_ORIGIN = "https://saiyan-media-core.emergent.host";
const NEXUS_BASE_PARAMS = "embed=1&autoplay=0&muted=1&bg=transparent&fx=off&theme=aura&next=1";

export default function Nexus() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [progress, setProgress] = useState(0);
  const [matchCount, setMatchCount] = useState(null);

  // Deep-link inputs from /nexus URL
  const dlId = params.get("id") || "";
  const dlCat = params.get("cat") || "";
  const dlType = params.get("type") || "";
  const dlQ = params.get("q") || "";

  // Build the iframe src once with any baked-in deep-link params for first paint
  const iframeSrc = useMemo(() => {
    const qp = new URLSearchParams(NEXUS_BASE_PARAMS);
    if (dlCat) qp.set("cat", dlCat);
    if (dlType) qp.set("type", dlType);
    if (dlQ) qp.set("q", dlQ);
    if (dlId) qp.set("play", dlId);
    return `${NEXUS_ORIGIN}/terminal?${qp.toString()}`;
    // intentionally only on mount — subsequent changes go via postMessage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (type, payload = {}) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ target: "saiyan-nexus", type, payload }, NEXUS_ORIGIN);
  };

  // Listen for messages from the embedded Nexus iframe
  useEffect(() => {
    const onMsg = (e) => {
      const d = e?.data;
      if (!d || typeof d !== "object" || d.source !== "saiyan-nexus") return;
      switch (d.type) {
        case "ready":
          setReady(true);
          break;
        case "loaded":
          setNowPlaying(d.payload || null);
          setProgress(0);
          break;
        case "filtered":
          setMatchCount(d.payload?.count ?? null);
          break;
        case "navigate": {
          // Reverse bridge: Nexus iframe asks the terminal to navigate
          // (e.g. "open Vanessa's profile" pill while a Vanessa video plays).
          const route = d.payload?.route;
          if (typeof route === "string" && route.startsWith("/")) nav(route);
          break;
        }
        case "time": {
          const { currentTime = 0, duration = 0 } = d.payload || {};
          if (duration > 0) setProgress(Math.min(1, currentTime / duration));
          break;
        }
        case "ended":
          setProgress(1);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [nav]);

  // When URL deep-link params change AFTER the iframe is ready, drive the iframe
  // via postMessage instead of reloading it (preserves player state, no flicker).
  useEffect(() => {
    if (!ready) return;
    if (dlId) {
      send("load", { id: dlId, cat: dlCat, type: dlType, q: dlQ });
    } else if (dlCat || dlType || dlQ) {
      send("filter", { cat: dlCat, type: dlType, q: dlQ });
    } else {
      send("filter", { cat: "", type: "", q: "" });
    }
  }, [ready, dlId, dlCat, dlType, dlQ]);

  const filterChip =
    [dlQ && `"${dlQ}"`, dlCat, dlType].filter(Boolean).join(" · ") || null;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Header card */}
      <div className="tsv-glass tsv-glow tsv-scanlines" style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div className="tsv-title" style={{ fontSize: 14, opacity: 0.95 }}>
              TIME PATROL // NEXUS PLAYER
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              {ready ? (
                nowPlaying ? (
                  <>
                    <span style={{ color: "#76FFE1" }}>▶ NOW PLAYING:</span>{" "}
                    <span style={{ color: "#fff" }}>{nowPlaying.title}</span>
                  </>
                ) : filterChip ? (
                  <>
                    <span style={{ color: "#76FFE1" }}>FILTER:</span>{" "}
                    <span style={{ color: "#FFB800" }}>{filterChip}</span>
                    {matchCount !== null && (
                      <span style={{ opacity: 0.6, marginLeft: 8 }}>
                        ({matchCount} match{matchCount === 1 ? "" : "es"})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ color: "#76FFE1" }}>SYSTEM:</span> Select a transmission below to begin playback.
                  </>
                )
              ) : (
                <>
                  <span style={{ color: "#FFB800" }}>LINKING:</span> Establishing Nexus channel…
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="tsv-pill" onClick={() => send("toggle")} disabled={!ready} style={{ fontSize: 11 }}>
              ⏯ Play / Pause
            </button>
            <button className="tsv-pill" onClick={() => send("next")} disabled={!ready} style={{ fontSize: 11 }}>
              ⏭ Next
            </button>
            <button className="tsv-pill" onClick={() => send("prev")} disabled={!ready} style={{ fontSize: 11 }}>
              ⏮ Prev
            </button>
            {filterChip && (
              <button
                className="tsv-pill"
                onClick={() => send("filter", { cat: "", type: "", q: "" })}
                disabled={!ready}
                style={{ fontSize: 11 }}
              >
                ✕ Clear Filter
              </button>
            )}
            <a
              className="tsv-pill"
              href={`${NEXUS_ORIGIN}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, textDecoration: "none" }}
            >
              ↗ Open Nexus
            </a>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 10,
            height: 3,
            background: "rgba(255,255,255,.08)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.round(progress * 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FF6B00, #FFB800)",
              transition: "width 0.4s linear",
            }}
          />
        </div>
      </div>

      {/* Embedded player */}
      <div
        className="tsv-glass tsv-glow"
        style={{
          padding: 0,
          overflow: "hidden",
          minHeight: 520,
          height: "70vh",
          position: "relative",
        }}
      >
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Nexus Player"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            background: "transparent",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

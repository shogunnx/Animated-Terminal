import { useEffect, useState } from "react";
import {
  DRESSING_ROOM_SEO as SEO, DRESSING_ROOM_H1, DRESSING_ROOM_INTRO, DRESSING_ROOM_SECTIONS,
  DRESSING_ROOM_FAQ, webApplicationJsonLd,
} from "../content/dressingRoomSeo.mjs";

const EXAMPLE_TAG = "dressingroom-example";

function setTag(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  const prev = el ? el.cloneNode(true) : null;
  if (!el) { el = create(); document.head.appendChild(el); }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return () => (prev ? el.replaceWith(prev) : el.remove());
}

const meta = (key, value, content) => setTag(`meta[${key}="${value}"]`, () => {
  const m = document.createElement("meta"); m.setAttribute(key, value); return m;
}, { content });

export function useDressingRoomSeo(characterName) {
  useEffect(() => {
    const prevTitle = document.title;
    const title = characterName ? `${characterName} DressingRoom | AI Outfit Generator | TheSaiyanVictoria` : SEO.title;
    document.title = title;
    const undo = [
      meta("name", "description", SEO.description),
      setTag('link[rel="canonical"]', () => { const l = document.createElement("link"); l.rel = "canonical"; return l; }, { href: SEO.canonical }),
      meta("property", "og:title", title),
      meta("property", "og:description", SEO.description),
      meta("property", "og:url", SEO.canonical),
      meta("property", "og:image", SEO.image),
      meta("name", "twitter:card", "summary_large_image"),
      meta("name", "twitter:title", title),
      meta("name", "twitter:description", SEO.description),
      meta("name", "twitter:image", SEO.image),
    ];
    let ld = null;
    if (!document.head.querySelector('script[type="application/ld+json"]')) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify(webApplicationJsonLd());
      document.head.appendChild(ld);
    }
    return () => { document.title = prevTitle; undo.forEach(fn => fn()); ld?.remove(); };
  }, [characterName]);
}

export function DressingRoomIntro() {
  return (
    <header className="tsv-glass tsv-glow" style={{ padding: "18px 16px", marginBottom: 14 }} data-testid="seo-intro">
      <h1 style={{ margin: 0, fontSize: "clamp(18px, 3.2vw, 28px)", lineHeight: 1.25, letterSpacing: ".02em" }} data-testid="seo-h1">
        {DRESSING_ROOM_H1}
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.65, opacity: .8, maxWidth: 820 }}>{DRESSING_ROOM_INTRO}</p>
    </header>
  );
}

function altFor(item) {
  const isSubmission = (item.tags || []).includes("terminal-submission");
  const who = (item.characters || [])[0];
  if (isSubmission) return `${who || "Character"} outfit created by a visitor in the AI DressingRoom`;
  if (item.description) return item.description.split("\n")[0].slice(0, 140);
  const readable = item.title && !/^[0-9A-F-]{30,}$/i.test(item.title) ? item.title : null;
  return `${who || readable || "TheSaiyanVictoria character"} artwork from the Nexus Media Library`;
}

function ExampleCard({ item, backendUrl }) {
  const isSubmission = (item.tags || []).includes("terminal-submission");
  return (
    <figure style={{ margin: 0 }} data-testid={`seo-example-${item.id}`}>
      <div style={{ aspectRatio: "3 / 4", borderRadius: 10, overflow: "hidden", background: "rgba(0,255,255,.06)", border: "1px solid rgba(255,255,255,.1)" }}>
        <img src={`${backendUrl}${item.thumb_url}`} alt={altFor(item)} loading="lazy" decoding="async"
          width={item.width || undefined} height={item.height || undefined}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      <figcaption style={{ fontSize: 10, opacity: .65, marginTop: 6 }}>
        {isSubmission ? `Visitor creation · ${(item.characters || [])[0] || "DressingRoom"}` : "From the Nexus Media Library"}
      </figcaption>
    </figure>
  );
}

function Examples({ backendUrl }) {
  const [state, setState] = useState({ loading: true, items: [], error: false });
  useEffect(() => {
    fetch(`${backendUrl}/api/nexus-library/media?limit=60`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        const tagged = d.items.filter(i => (i.tags || []).includes(EXAMPLE_TAG));
        setState({ loading: false, items: (tagged.length ? tagged : d.items).slice(0, 8), error: false });
      })
      .catch(() => setState({ loading: false, items: [], error: true }));
  }, [backendUrl]);

  return (
    <section aria-labelledby="seo-examples-h2" style={{ marginTop: 18 }} data-testid="seo-examples">
      <h2 id="seo-examples-h2" style={h2}>What you can create</h2>
      <p style={p}>Clothing color changes, formalwear and casual looks, full character outfit redesigns, fashion poses and new backgrounds. These approved images come straight from the Nexus Media Library and can be used as starting points in any character room.</p>
      {state.loading && <div style={{ fontSize: 11, opacity: .6 }} data-testid="seo-examples-loading">Loading examples…</div>}
      {state.error && <div style={{ fontSize: 11, opacity: .6 }} data-testid="seo-examples-error">Examples are unavailable right now.</div>}
      {!state.loading && state.items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 10 }}>
          {state.items.map(i => <ExampleCard key={i.id} item={i} backendUrl={backendUrl} />)}
        </div>
      )}
    </section>
  );
}

const h2 = { fontSize: 16, margin: "0 0 8px", letterSpacing: ".04em", color: "#7ff7ff" };
const h3 = { fontSize: 13, margin: "12px 0 4px", color: "#ffb3dc" };
const p = { fontSize: 12.5, lineHeight: 1.65, margin: 0, opacity: .82 };

export function DressingRoomGuide({ backendUrl }) {
  return (
    <div className="tsv-glass" style={{ padding: "18px 16px", marginTop: 18 }} data-testid="seo-guide">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "18px 26px" }}>
        {DRESSING_ROOM_SECTIONS.map(s => (
          <section key={s.heading}>
            <h2 style={h2}>{s.heading}</h2>
            {s.parts.map(part => (
              <div key={part.heading}>
                <h3 style={h3}>{part.heading}</h3>
                <p style={p}>{part.text}</p>
              </div>
            ))}
          </section>
        ))}
      </div>
      <Examples backendUrl={backendUrl} />
      <section aria-labelledby="seo-faq-h2" style={{ marginTop: 22 }} data-testid="seo-faq">
        <h2 id="seo-faq-h2" style={h2}>Frequently asked questions</h2>
        {DRESSING_ROOM_FAQ.map((f, i) => (
          <div key={f.q} style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "10px 0" }} data-testid={`seo-faq-item-${i}`}>
            <h3 style={{ ...h3, marginTop: 0 }}>{f.q}</h3>
            <p style={p}>{f.a}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

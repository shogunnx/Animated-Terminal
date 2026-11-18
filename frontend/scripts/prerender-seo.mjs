// Post-build: writes dist/dressing-room.html with SEO tags and crawlable content in the initial HTML.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DRESSING_ROOM_SEO as SEO, DRESSING_ROOM_H1, DRESSING_ROOM_INTRO, DRESSING_ROOM_SECTIONS,
  DRESSING_ROOM_FAQ, webApplicationJsonLd,
} from "../src/content/dressingRoomSeo.mjs";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const head = `
    <title>${esc(SEO.title)}</title>
    <meta name="description" content="${esc(SEO.description)}" />
    <link rel="canonical" href="${SEO.canonical}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="TheSaiyanVictoria" />
    <meta property="og:title" content="${esc(SEO.title)}" />
    <meta property="og:description" content="${esc(SEO.description)}" />
    <meta property="og:url" content="${SEO.canonical}" />
    <meta property="og:image" content="${SEO.image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(SEO.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(SEO.title)}" />
    <meta name="twitter:description" content="${esc(SEO.description)}" />
    <meta name="twitter:image" content="${SEO.image}" />
    <meta name="twitter:image:alt" content="${esc(SEO.imageAlt)}" />
    <script type="application/ld+json">${JSON.stringify(webApplicationJsonLd()).replace(/</g, "\\u003c")}</script>
`;

const body = `
      <main style="font-family:monospace;color:#e8f6ff;background:#05060f;padding:24px;max-width:960px;margin:0 auto">
        <h1>${esc(DRESSING_ROOM_H1)}</h1>
        <p>${esc(DRESSING_ROOM_INTRO)}</p>
        <p><a href="/dressing-room">Open the AI DressingRoom</a> · <a href="/characters">Characters</a> · <a href="/storytime">Storytime</a> · <a href="/">TSV Terminal</a></p>
        ${DRESSING_ROOM_SECTIONS.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.parts.map((p) => `<h3>${esc(p.heading)}</h3><p>${esc(p.text)}</p>`).join("")}</section>`).join("\n        ")}
        <section><h2>Frequently asked questions</h2>${DRESSING_ROOM_FAQ.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>
      </main>`;

const index = readFileSync(join(dist, "index.html"), "utf8");
const page = index
  .replace(/<title>[\s\S]*?<\/title>/, "")
  .replace("</head>", `${head}  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${body}\n    </div>`);

if (!page.includes(SEO.canonical) || !page.includes(DRESSING_ROOM_H1)) throw new Error("SEO prerender failed");
writeFileSync(join(dist, "dressing-room.html"), page);
console.log("SEO prerender: dist/dressing-room.html written");

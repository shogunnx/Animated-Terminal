"""Find real reference pictures of named props and costumes on fan wikis (MediaWiki pageimages)."""
import re
import asyncio
from typing import Optional

import httpx

UA = {"User-Agent": "TSVTerminal/1.0 (DressingRoom reference lookup)"}
MAX_BYTES = 8 * 1024 * 1024

WIKIS = [
    (r"ranger|zord|megazord|zeo|saba|rita repulsa|scorpina|astronema|divatox|drakkon", "powerrangers.fandom.com"),
    (r"saiyan|zamasu|goku|vegeta|broly|bulma|android 18|caulifla|kefla|kale|videl|chi-chi|dragon ball|majin|trunks|gohan", "dragonball.fandom.com"),
    (r"zelda|link's|hylian|master sword|ganondorf", "zelda.fandom.com"),
    (r"cloud strife|buster sword|sephiroth|masamune|tifa|aerith|yuna|lightning's|final fantasy", "finalfantasy.fandom.com"),
    (r"keyblade|kingdom key|sora's|riku's|way to the dawn", "kingdomhearts.fandom.com"),
    (r"optimus|bumblebee|megatron|starscream|arcee|elita|soundwave|grimlock|transformer", "transformers.fandom.com"),
    (r"gundam|zaku|sazabi|barbatos", "gundam.fandom.com"),
    (r"evangelion|eva unit|plugsuit|asuka|rei ayanami|misato", "evangelion.fandom.com"),
    (r"kratos|leviathan axe|blades of chaos", "godofwar.fandom.com"),
    (r"master chief|energy sword", "halo.fandom.com"),
    (r"samus|metroid|arm cannon", "metroid.fandom.com"),
    (r"pok[eé]|pikachu", "pokemon.fandom.com"),
    (r"elden ring|moonveil|malenia", "eldenring.fandom.com"),
    (r"sailor (moon|mars|mercury|jupiter|venus)|senshi", "sailormoon.fandom.com"),
    (r"one piece|nami|nico robin|boa hancock|yamato", "onepiece.fandom.com"),
    (r"naruto|hinata|sakura haruno|tsunade", "naruto.fandom.com"),
    (r"demon slayer|nezuko|shinobu|mitsuri", "kimetsu-no-yaiba.fandom.com"),
    (r"overwatch|d\.va|mercy", "overwatch.fandom.com"),
    (r"genshin|wolf's gravestone", "genshin-impact.fandom.com"),
    (r"mortal kombat|kitana|mileena", "mortalkombat.fandom.com"),
    (r"street fighter|chun-li|cammy", "streetfighter.fandom.com"),
    (r"devil may cry|dante's|vergil|rebellion sword|yamato katana", "devilmaycry.fandom.com"),
    (r"bayonetta", "bayonetta.fandom.com"),
    (r"nier|2b", "nier.fandom.com"),
    (r"portal gun", "half-life.fandom.com"),
]

NOISE = re.compile(r"\b(cosplay|costume|armor|armour|replica|prop|inspired|look|outfit|suit|wearable|a|the|with|holding)\b", re.I)


def _queries(name: str) -> list:
    base = re.sub(r"\s+", " ", NOISE.sub(" ", name)).strip(" -,'")
    words = base.split()
    out = [base]
    if "'s" in base:
        out.append(base.split("'s", 1)[1].strip())
    for k in (4, 3, 2):
        if len(words) > k:
            out.append(" ".join(words[-k:]))
    return [q for i, q in enumerate(out) if q and q not in out[:i]]


def _hosts(name: str) -> list:
    low = name.lower()
    hosts = [h for pat, h in WIKIS if re.search(pat, low)]
    return hosts + ["en.wikipedia.org"]


async def _search(client: httpx.AsyncClient, host: str, query: str) -> Optional[dict]:
    api = f"https://{host}/api.php" if host != "en.wikipedia.org" else "https://en.wikipedia.org/w/api.php"
    params = {"action": "query", "generator": "search", "gsrsearch": query, "gsrlimit": 3,
              "prop": "pageimages", "piprop": "original", "format": "json"}
    try:
        r = await client.get(api, params=params, headers=UA)
        pages = sorted((r.json().get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    except Exception:
        return None
    qwords = {w.lower() for w in re.findall(r"[A-Za-z0-9]+", query) if len(w) > 2}
    def overlap(p):
        return len(qwords & {w.lower() for w in re.findall(r"[A-Za-z0-9]+", p["title"])})
    pages = sorted([p for p in pages if overlap(p) > 0], key=lambda p: (-overlap(p), p.get("index", 99)))
    for p in pages:
        src = (p.get("original") or {}).get("source")
        if src and not src.lower().split("?")[0].endswith((".svg", ".gif")):
            page_url = f"https://{host}/wiki/{p['title'].replace(' ', '_')}"
            return {"title": p["title"], "image_url": src, "page_url": page_url, "host": host}
    return None


async def find_reference(name: str) -> Optional[dict]:
    """Return the best wiki reference image for an item name, with its downloaded bytes."""
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        for host in _hosts(name):
            for q in _queries(name):
                hit = await _search(client, host, q)
                if not hit:
                    continue
                try:
                    img = await client.get(hit["image_url"], headers=UA)
                except Exception:
                    continue
                if img.status_code == 200 and img.headers.get("content-type", "").startswith("image/") and len(img.content) <= MAX_BYTES:
                    return {**hit, "query": q, "bytes": img.content}
    return None


async def find_references(names: list) -> list:
    names = [n for n in dict.fromkeys(n.strip() for n in names if n and n.strip())][:3]
    results = await asyncio.gather(*(find_reference(n) for n in names))
    return [{**r, "name": n} for n, r in zip(names, results) if r]

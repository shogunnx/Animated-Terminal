"""
Lore Wiki RAG system.

Fetches and caches all pages from the official TheSaiyanVictoria Fandom wiki,
then provides retrieval over cached pages so the Q&A LLM can answer with
lore-grounded responses instead of fabricating details.

Wiki:  https://thesaiyanvictoria-universe.fandom.com/
API:   https://thesaiyanvictoria-universe.fandom.com/api.php
"""

import os
import re
import logging
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timezone

import httpx
from pymongo import MongoClient

WIKI_API = "https://thesaiyanvictoria-universe.fandom.com/api.php"
WIKI_BASE = "https://thesaiyanvictoria-universe.fandom.com/wiki/"

logger = logging.getLogger(__name__)

_mongo_client = MongoClient(os.environ["MONGO_URL"])
_db = _mongo_client[os.environ.get("DB_NAME", "tsv")]
_lore_col = _db["lore_wiki_pages"]
_lore_col.create_index("page_id", unique=True)
_lore_col.create_index("title")


# ---------------------- Fetch / Scrape ----------------------

async def _list_all_pages(client: httpx.AsyncClient) -> List[Dict]:
    pages = []
    apcontinue: Optional[str] = None
    while True:
        params = {
            "action": "query",
            "list": "allpages",
            "aplimit": "500",
            "format": "json",
        }
        if apcontinue:
            params["apcontinue"] = apcontinue
        r = await client.get(WIKI_API, params=params)
        data = r.json()
        pages.extend(data.get("query", {}).get("allpages", []))
        cont = data.get("continue", {})
        if "apcontinue" in cont:
            apcontinue = cont["apcontinue"]
        else:
            break
    return pages


_HTML_TAG_RE = re.compile(r"<[^>]+>")
_MULTI_WS_RE = re.compile(r"[ \t\u00A0]+")
_NEWLINES_RE = re.compile(r"\n{3,}")


def _strip_html(html: str) -> str:
    """Convert HTML to clean plain text suitable for LLM context."""
    if not html:
        return ""
    # Drop scripts/styles entirely
    html = re.sub(r"<script\b[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<style\b[^>]*>.*?</style>", " ", html, flags=re.S | re.I)
    # Convert block-level tags to newlines so paragraphs stay readable
    html = re.sub(r"</?(p|div|li|ul|ol|tr|table|h[1-6]|br)\b[^>]*>", "\n", html, flags=re.I)
    # Strip remaining tags
    text = _HTML_TAG_RE.sub(" ", html)
    # Decode common HTML entities
    text = (
        text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
    )
    # Collapse whitespace
    text = _MULTI_WS_RE.sub(" ", text)
    text = _NEWLINES_RE.sub("\n\n", text)
    return text.strip()


async def _fetch_page_contents(client: httpx.AsyncClient, page_ids: List[int]) -> Dict[int, Dict]:
    """Fetch rendered HTML via parse API and convert to clean text.

    The TextExtracts extension isn't available on this Fandom wiki, so we use
    action=parse and strip HTML ourselves.
    """
    out: Dict[int, Dict] = {}
    for pid in page_ids:
        try:
            r = await client.get(WIKI_API, params={
                "action": "parse",
                "pageid": str(pid),
                "prop": "text",
                "format": "json",
                "formatversion": "2",
                "disableeditsection": "1",
                "disabletoc": "1",
            })
            parse = r.json().get("parse", {})
            title = parse.get("title", "")
            html = parse.get("text", "")
            text = _strip_html(html)
            if text and title:
                out[pid] = {
                    "page_id": pid,
                    "title": title,
                    "url": WIKI_BASE + title.replace(" ", "_"),
                    "content": text,
                }
        except Exception as e:
            logger.warning(f"Failed to fetch page {pid}: {e}")
    return out


async def refresh_lore_cache() -> Dict:
    """Fetch all wiki pages and replace cache. Idempotent."""
    async with httpx.AsyncClient(timeout=45, follow_redirects=True) as client:
        page_list = await _list_all_pages(client)
        page_ids = [p["pageid"] for p in page_list]
        contents = await _fetch_page_contents(client, page_ids)

        records = []
        now_iso = datetime.now(timezone.utc).isoformat()
        for pid, doc in contents.items():
            records.append({
                **doc,
                "content": doc["content"][:9000],  # cap per-page to control prompt size
                "updated_at": now_iso,
            })

    if records:
        _lore_col.delete_many({})
        _lore_col.insert_many(records)

    logger.info(f"Lore cache refreshed: {len(records)} pages")
    return {"total_pages_listed": len(page_list), "pages_cached": len(records), "updated_at": now_iso}


def cached_page_count() -> int:
    return _lore_col.count_documents({})


def _ensure_cache_ready() -> None:
    """Synchronously refresh if cache is empty. Safe to call from request handlers."""
    if cached_page_count() == 0:
        try:
            asyncio.run(refresh_lore_cache())
        except RuntimeError:
            # Inside an existing event loop — schedule on the loop
            loop = asyncio.get_event_loop()
            loop.create_task(refresh_lore_cache())


# ---------------------- Retrieval ----------------------

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "what", "why", "how",
    "when", "where", "who", "did", "do", "does", "of", "in", "on", "to",
    "from", "for", "with", "and", "or", "my", "your", "it", "this", "that",
    "be", "by", "as", "at", "but", "if", "so", "you", "i", "we", "they",
    "tell", "me", "about", "can", "would", "could", "should", "more",
}


def _tokenize(text: str) -> List[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2 and t not in _STOPWORDS]


def search_lore(question: str, character_name: str = "", top_n: int = 4) -> List[Dict]:
    """Score cached pages by keyword overlap with the question + character name.

    Title matches dominate — if a token appears in the title, the page is almost
    certainly the right one. Content frequency only breaks ties.
    """
    _ensure_cache_ready()
    pages = list(_lore_col.find({}, {"_id": 0}))
    if not pages:
        return []

    q_tokens = _tokenize(question)
    char_tokens = _tokenize(character_name)
    all_tokens = list({*q_tokens, *char_tokens})
    if not all_tokens:
        return []

    scored = []
    for p in pages:
        content_lower = p["content"].lower()
        title_tokens = set(_tokenize(p["title"]))

        score = 0
        # Title token matches are the strongest signal (a question about "Binary"
        # should rank the "Binary" page above everyone who happens to mention it)
        title_hits = sum(1 for t in q_tokens if t in title_tokens)
        char_title_hits = sum(1 for t in char_tokens if t in title_tokens)
        score += title_hits * 100
        score += char_title_hits * 25  # character match is supportive, not primary
        # Content frequency only breaks ties between similarly-titled pages
        for tok in q_tokens:
            score += min(content_lower.count(tok), 10)

        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: -x[0])
    return [p for _, p in scored[:top_n]]


def build_lore_context(question: str, character_name: str = "", max_chars: int = 9000) -> str:
    """Assemble a system-prompt context block from the top relevant lore pages."""
    pages = search_lore(question, character_name, top_n=4)
    if not pages:
        return ""

    header = (
        "OFFICIAL LORE EXCERPTS (from TheSaiyanVictoria Fandom Wiki). "
        "Base your answer STRICTLY on the facts in these excerpts. "
        "If the question can't be answered from these excerpts, say "
        '"That detail isn\'t in the official lore yet — but here\'s what I know about it..." '
        "and only then speculate, clearly flagged as speculation. "
        "Do NOT invent character names, places, or events that don't appear here.\n"
    )

    parts = [header]
    used = len(header)
    for p in pages:
        block = f"\n--- {p['title']} ({p['url']}) ---\n{p['content']}\n"
        if used + len(block) > max_chars:
            block = block[: max_chars - used]
        parts.append(block)
        used += len(block)
        if used >= max_chars:
            break
    return "".join(parts)

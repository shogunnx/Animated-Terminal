"""Style Me: GPT looks at a visitor photo and suggests 3 outfits built only from Dressing Room items."""
import os
import json
from typing import Dict, List

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/dressing-room", tags=["style-me"])
STYLE_MODEL = os.environ.get("STYLE_ME_MODEL", "gpt-4o")
MAX_IMAGE_CHARS = 6_000_000


class StyleMeRequest(BaseModel):
    image_base64: str = Field(max_length=MAX_IMAGE_CHARS)
    catalog: Dict[str, List[str]]


SYSTEM = (
    "You are a friendly fashion stylist. Look at the person in the photo (their build, skin tone, hair, vibe and setting) "
    "and suggest exactly 3 distinct outfits that would flatter them. Use ONLY exact item strings from the provided catalog; "
    "pick at most one item per category and 3-6 categories per outfit. Speak to the person directly as 'you'. Do not comment on body weight or make negative remarks. "
    'Reply as JSON: {"suggestions":[{"title":"short name","why":"one upbeat sentence on why it suits them","items":{"category":"exact item"}}]}'
)


def _parse(text: str) -> dict:
    text = (text or "").strip()
    start, end = text.find("{"), text.rfind("}")
    return json.loads(text[start:end + 1])


async def _direct_openai(key: str, user_text: str, image: str) -> dict:
    is_openrouter = key.startswith("sk-or-")
    client = AsyncOpenAI(api_key=key, base_url="https://openrouter.ai/api/v1") if is_openrouter else AsyncOpenAI(api_key=key)
    completion = await client.chat.completions.create(
        model=f"openai/{STYLE_MODEL}" if is_openrouter and "/" not in STYLE_MODEL else STYLE_MODEL,
        response_format={"type": "json_object"},
        temperature=0.8,
        max_tokens=700,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": [{"type": "text", "text": user_text}, {"type": "image_url", "image_url": {"url": image, "detail": "low"}}]},
        ],
    )
    return _parse(completion.choices[0].message.content)


async def _emergent(user_text: str, image: str) -> dict:
    """Fallback to OpenAI GPT through the Emergent universal key."""
    import uuid
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"style-me-{uuid.uuid4()}", system_message=SYSTEM).with_model("openai", "gpt-5.4")
    msg = UserMessage(text=user_text + "\nReply with the JSON only.", file_contents=[ImageContent(image_base64=image.split(",", 1)[-1])])
    return _parse(await chat.send_message(msg))


@router.post("/style-me")
async def style_me(body: StyleMeRequest):
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    catalog = {k: [str(i) for i in v[:400]] for k, v in body.catalog.items() if v}
    if not catalog:
        raise HTTPException(status_code=400, detail="Catalog is empty")
    image = body.image_base64 if body.image_base64.startswith("data:") else f"data:image/jpeg;base64,{body.image_base64}"

    user_text = "Catalog (category -> items):\n" + json.dumps(catalog, ensure_ascii=False)
    data, err = None, None
    if key:
        try:
            data = await _direct_openai(key, user_text, image)
        except Exception as e:
            err = e
    if data is None and os.environ.get("EMERGENT_LLM_KEY"):
        try:
            data = await _emergent(user_text, image)
        except Exception as e:
            err = e
    if data is None:
        raise HTTPException(status_code=502, detail=f"Style Me couldn't analyse the photo: {err or 'no AI key configured'}")

    suggestions = []
    for s in data.get("suggestions", [])[:3]:
        items = {c: i for c, i in (s.get("items") or {}).items() if c in catalog and i in catalog[c]}
        if items:
            suggestions.append({"title": str(s.get("title", "Outfit idea"))[:60], "why": str(s.get("why", ""))[:200], "items": items})
    if not suggestions:
        raise HTTPException(status_code=502, detail="Style Me couldn't find matching outfits. Please try again.")
    return {"suggestions": suggestions}

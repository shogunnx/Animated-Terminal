"""
StoryTime Q&A System
Interactive question-answering with video responses using character lore and personality
"""

import os
import json
import logging
from typing import Optional, List, Dict
import httpx
from openai import AsyncOpenAI
from emergentintegrations.llm.chat import LlmChat, UserMessage
from lore_wiki import build_lore_context, search_lore

logger = logging.getLogger(__name__)

# LLM keys — prefer direct OPENAI_API_KEY (works on external hosts like Railway).
# Fall back to EMERGENT_LLM_KEY (only works inside Emergent platform on free tier).
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "").strip()
GIRLSMIND_API_KEY = os.getenv("GIRLSMIND_API_KEY", "")

_openai_client: Optional[AsyncOpenAI] = None
if OPENAI_API_KEY:
    _openai_client = AsyncOpenAI(
        api_key=OPENAI_API_KEY,
        timeout=httpx.Timeout(30.0, read=25.0, write=5.0, connect=5.0),
    )
    logger.info("OpenAI direct client initialized (using OPENAI_API_KEY)")
else:
    logger.info("OPENAI_API_KEY not set; falling back to Emergent Universal Key")

# Character ID mapping - all Victoria Black variants use the same personality
CHARACTER_ID_MAPPING = {
    "victoria_black_blaster": "victoria_black",
    "victoria_black_goddess": "victoria_black",
    "evil_victoria_alt": "evil_victoria",
    "evil_victoria_talking_head": "evil_victoria"
}

# Character lore summaries with strong personalities
CHARACTER_LORE = {
    "victoria_black": """Victoria Black: Seductive twin of Victoria Chaser. Uses charm over combat. 
    Made deal with Vegeta that created Binary. Saved baby Harmony during escape. Spirit-fused with 
    Victoria Chaser and Wargirl into Harmony. PERSONALITY: Sultry, manipulative, motherly yet seductive. 
    Speaks with honeyed words and confidence. Uses beauty as a weapon.""",
    
    "wargirl": """Wargirl: Youngest sister. Skilled fighter who farms PQs. Loves battle. 
    Spirit-fused with Victoria Chaser and Victoria Black into Harmony Blaster. 
    LORE FACT: Binary was created from Victoria Black's deal with Vegeta. 
    PERSONALITY: Energetic, battle-hungry, youthful and carefree. Speaks with enthusiasm and warrior pride.""",
    
    "evil_victoria": """Evil Victoria: Seductive villainess—calm, controlled, and dangerous. 
    Operates from hidden 'Classified' chamber. Mysterious, powerful. Connected to darker forces. 
    PERSONALITY: Speaks softly with confident dominance. Enjoys psychological pressure and intimidation. 
    Sultry voice with underlying menace. Never raises her voice—the quieter she speaks, the more dangerous she is.""",
    
    "victoria_chaser": """Victoria Chaser: Warrior and protector. Led rebellion and escape from Black Frieza. 
    Master combatant. Scorns manipulation, favors pure strength. Spirit-fused with Victoria Black and 
    Wargirl into Harmony. PERSONALITY: Stern, honorable, direct. No-nonsense fighter who values strength 
    and discipline. Protective but harsh.""",
    
    "binary": """Binary: Ruthless, witty, and confrontational AI entity created from Victoria Black's deal with Vegeta. 
    PERSONALITY: Mean "sexy-bully" energy with fast, cutting comebacks. Possessive and fiercely protective 
    of those she claims. Proud and confident, hates looking soft but is secretly loyal. Speaks with sass, 
    sarcasm, and dominance. Will verbally destroy you while looking stunning doing it.""",
    
    "harmony": """Harmony: Young tech-savvy prodigy, the permanent spirit fusion of Victoria Chaser, Victoria Black, 
    and Wargirl. PERSONALITY: Curious, intelligent, nerdy but powerful. Speaks with youthful excitement mixed 
    with surprising wisdom. Balances her mothers' traits—can be sweet but fierce when needed.""",
    
    "vanessa": """Vanessa: PERSONALITY: Confident and strategic, speaks with measured intelligence. 
    Not afraid to challenge others but maintains composure."""
}

def normalize_character_id(character_id: str) -> str:
    """
    Normalize character ID to use base personality
    All Victoria Black variants use the same personality
    """
    return CHARACTER_ID_MAPPING.get(character_id, character_id)

async def fetch_girlsmind_personality(character_id: str) -> Optional[dict]:
    """Fetch character personality from GirlsMind API"""
    # Normalize character ID (e.g., victoria_black_blaster -> victoria_black)
    normalized_id = normalize_character_id(character_id)
    
    try:
        headers = {}
        if GIRLSMIND_API_KEY:
            headers["Authorization"] = f"Bearer {GIRLSMIND_API_KEY}"
        
        async with httpx.AsyncClient() as client:
            # Try to get character from GirlsMind using normalized ID
            response = await client.get(
                f"{os.getenv('GIRLSMIND_BASE_URL', 'https://girlsmind-1.emergent.host')}/api/girls/{normalized_id}",
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"GirlsMind fetch error: {e}")
    return None

def build_character_context(character_id: str, girlsmind_data: Optional[dict]) -> str:
    """Build character context from lore + GirlsMind personality"""
    # Normalize character ID for lore lookup
    normalized_id = normalize_character_id(character_id)
    
    context_parts = []
    
    # Add lore context using normalized ID
    if normalized_id in CHARACTER_LORE:
        context_parts.append(f"Character Lore:\n{CHARACTER_LORE[normalized_id]}")
    
    # Add GirlsMind personality if available
    if girlsmind_data:
        if girlsmind_data.get('personality'):
            context_parts.append(f"\nPersonality Traits:\n{girlsmind_data['personality']}")
        if girlsmind_data.get('background'):
            context_parts.append(f"\nBackground:\n{girlsmind_data['background']}")
    
    return "\n\n".join(context_parts)

async def generate_character_response(
    character_id: str,
    character_name: str,
    question: str,
    video_url: str = None,
    max_words: int = 200
) -> str:
    """Generate AI response from character perspective, with optional video analysis.

    The response is GROUNDED in the official Fandom wiki (lore_wiki) — top relevant
    pages are injected as authoritative context. The LLM is instructed to answer
    strictly from those excerpts and flag speculation if the lore is silent.
    """

    # Fetch GirlsMind personality
    girlsmind_data = await fetch_girlsmind_personality(character_id)

    # Build character context
    character_context = build_character_context(character_id, girlsmind_data)

    # Retrieve relevant lore from the official Fandom wiki
    try:
        lore_context = build_lore_context(question, character_name)
    except Exception as e:
        print(f"Lore wiki retrieval failed (continuing without RAG): {e}")
        lore_context = ""

    lore_block = f"\n\n{lore_context}" if lore_context else ""
    
    # Create system prompt
    if video_url:
        system_prompt = f"""You are {character_name} from TheSaiyanVictoria universe.

{character_context}{lore_block}

CRITICAL RULES FOR VIDEO ANALYSIS:
- Watch and understand the video content provided
- If it's a YouTube Storytime video, extract the story/narrative
- Respond as {character_name} reacting to or explaining the story
- Keep responses SHORT and EFFICIENT (150-250 words max)
- Stay in character while discussing the video content
- Video response must be under 180 seconds (3 minutes)
- Ground every lore claim in the OFFICIAL LORE EXCERPTS above. Do NOT invent.

Target: {max_words} words maximum"""
    else:
        system_prompt = f"""You are {character_name} from TheSaiyanVictoria universe.

{character_context}{lore_block}

CRITICAL RULES:
- Answer as {character_name} in first person
- Keep responses SHORT and EFFICIENT (150-250 words max for ~60-90 second videos)
- For lore questions: Answer ONLY from the OFFICIAL LORE EXCERPTS provided above.
  Do NOT invent names, places, events, or relationships not in the excerpts.
  If the lore doesn't cover something, say so in character (e.g.
  "That part of my story isn't yet written down...") before any speculation.
- For simple questions (time, weather, jokes): Answer briefly with personality flair
- For general topics: Be efficient and concise
- Add personality but don't be overly verbose
- Video must be under 180 seconds (3 minutes)

Examples:
- "What time is it?" → Brief answer with personality (20-30 words)
- "How was Binary created?" → Quote/paraphrase the lore excerpts exactly (150-200 words)
- "What's your favorite color?" → Quick in-character answer (30-50 words)

Target: {max_words} words maximum"""

    # Generate response — prefer direct OpenAI (works on Railway), fall back to Emergent.
    try:
        session_id = f"qa_{character_id}_{hash(question)}"

        # Video Q&A still needs Emergent's Gemini wrapper (multimodal)
        if video_url:
            from emergentintegrations.llm.chat import FileContentWithMimeType  # noqa: F401
            full_question = (
                f"{question}\n\nYouTube Video URL: {video_url}\n\n"
                "Please watch this video and respond based on its content."
                if ("youtube.com" in video_url or "youtu.be" in video_url)
                else question
            )
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=system_prompt,
            ).with_model("gemini", "gemini-2.0-flash")
            response = await chat.send_message(UserMessage(text=full_question))
            return response.strip()

        # Text-only path — prefer direct OpenAI (works publicly), fall back to Emergent.
        if _openai_client is not None:
            try:
                completion = await _openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                    max_tokens=int(max_words * 2.5),  # ~1 token per 0.75 words
                    temperature=0.7,
                )
                return (completion.choices[0].message.content or "").strip()
            except Exception as e:
                logger.warning(f"Direct OpenAI failed, falling back to Emergent: {e}")
                # fall through to Emergent path below

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model("openai", "gpt-4o")
        response = await chat.send_message(UserMessage(text=question))
        return response.strip()
    
    except Exception as e:
        msg = str(e)
        print(f"LLM API error: {msg}")
        # Surface a clean, actionable error for known cases
        if "FREE_USER_EXTERNAL_ACCESS_DENIED" in msg or "Free users can only use Universal Key" in msg:
            raise Exception(
                "AI text key blocked: the Emergent Universal Key is free-tier and "
                "can't be used outside the Emergent platform. Add a direct OPENAI_API_KEY "
                "on Railway, or upgrade your Emergent plan."
            )
        raise Exception(f"Failed to generate response: {msg}")

async def rewrite_story_in_character_voice(
    character_id: str,
    character_name: str,
    story_text: str,
    story_title: str
) -> str:
    """Rewrite a story in the character's narrative voice/personality"""
    
    # Fetch GirlsMind personality
    girlsmind_data = await fetch_girlsmind_personality(character_id)
    
    # Build character context
    character_context = build_character_context(character_id, girlsmind_data)
    
    # Create system prompt for narration
    system_prompt = f"""You are {character_name} from TheSaiyanVictoria universe, narrating a story.

{character_context}

CRITICAL RULES:
- Rewrite this story in YOUR voice and personality
- Keep the core facts and events the same
- Add your personality through word choice, tone, and commentary
- Stay true to your character traits
- Keep it engaging and conversational
- DO NOT add your own commentary or break the fourth wall
- Target length: Match the original story length (don't make it much longer)
- This will be read aloud, so make it flow naturally

Examples of staying in character:
- Binary: Use sass, confidence, cutting remarks ("Oh please, like THAT was going to work...")
- Evil Victoria: Sultry, controlled, menacing undertones ("How... delightful...")
- Victoria Black: Seductive, manipulative charm ("Darling, let me tell you what really happened...")
- Wargirl: Energetic, battle-focused ("And then BAM! The fight was ON!")
"""

    try:
        # Create session for this narration
        session_id = f"narrate_{character_id}_{hash(story_title)}"
        
        # Use Claude for text generation
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        # Create user message with the story
        user_message = UserMessage(text=f"Narrate this story in your voice:\n\nTitle: {story_title}\n\nStory: {story_text}")
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        return response.strip()
    
    except Exception as e:
        print(f"Character narration rewrite error: {e}")
        # Fallback: return original text if rewrite fails
        return story_text

async def create_qa_video(
    character_id: str,
    character_name: str,
    question: str,
    avatar_id: str,
    video_url: str = None,
    duration: int = 10
) -> dict:
    """Generate Q&A response and create video using TSVAvatarGenerator.

    Returns the AI-generated text plus a list of lore-wiki sources used so the
    frontend can credit/link the canonical wiki pages.
    """

    # Generate character response using AI (with optional video analysis)
    response_text = await generate_character_response(character_id, character_name, question, video_url)

    # Capture which lore pages grounded this answer (for source attribution UI)
    try:
        retrieved = search_lore(question, character_name, top_n=4)
        sources: List[Dict[str, str]] = [
            {"title": p["title"], "url": p["url"]} for p in retrieved
        ]
    except Exception as e:
        logger.warning(f"Lore sources lookup failed: {e}")
        sources = []
    
    # Generate the HeyGen video directly via the storytime helper.
    # We used to httpx-POST to 127.0.0.1:8001 here, but Railway containers
    # don't allow loopback to the same service, which produced
    # "All connection attempts failed" in production.
    try:
        from storytime import _generate_video_with_voice_fallback, _resolve_voice_id
        voice_id = _resolve_voice_id(avatar_id)
        story_result = await _generate_video_with_voice_fallback(
            avatar_id=avatar_id,
            script_text=response_text,
            voice_id=voice_id,
            title=f"Q&A: {question[:50]}",
            test_mode=False,
        )
    except Exception as e:
        logger.exception("HeyGen direct call failed")
        raise Exception(f"Video generation error: {e}")

    if not story_result.get("success"):
        # Return the text + sources anyway so the frontend's TTS+text fallback
        # can still render an answer; surface HeyGen's error message verbatim.
        err = story_result.get("error", "Unknown HeyGen failure")
        logger.warning(f"HeyGen rejected Q&A video: {err}")
        return {
            "video_id": None,
            "response_text": response_text,
            "question": question,
            "character_name": character_name,
            "sources": sources,
            "heygen_error": err,
        }

    video_id = story_result.get("video_id")

    return {
        "video_id": video_id,
        "response_text": response_text,
        "question": question,
        "character_name": character_name,
        "sources": sources,
    }

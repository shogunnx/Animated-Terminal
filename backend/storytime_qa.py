"""
StoryTime Q&A System
Interactive question-answering with video responses using character lore and personality
"""

import os
import json
from typing import Optional
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Emergent LLM key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-3A6Ea89Ad00D72b461")
GIRLSMIND_API_KEY = os.getenv("GIRLSMIND_API_KEY", "")

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

async def fetch_girlsmind_personality(character_id: str) -> Optional[dict]:
    """Fetch character personality from GirlsMind API"""
    try:
        headers = {}
        if GIRLSMIND_API_KEY:
            headers["Authorization"] = f"Bearer {GIRLSMIND_API_KEY}"
        
        async with httpx.AsyncClient() as client:
            # Try to get character from GirlsMind
            response = await client.get(
                f"{os.getenv('GIRLSMIND_BASE_URL', 'https://girlsmind-1.emergent.host')}/api/girls/{character_id}",
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
    context_parts = []
    
    # Add lore context
    if character_id in CHARACTER_LORE:
        context_parts.append(f"Character Lore:\n{CHARACTER_LORE[character_id]}")
    
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
    """Generate AI response from character perspective, with optional video analysis"""
    
    # Fetch GirlsMind personality
    girlsmind_data = await fetch_girlsmind_personality(character_id)
    
    # Build character context
    character_context = build_character_context(character_id, girlsmind_data)
    
    # Create system prompt
    if video_url:
        system_prompt = f"""You are {character_name} from TheSaiyanVictoria universe.

{character_context}

CRITICAL RULES FOR VIDEO ANALYSIS:
- Watch and understand the video content provided
- If it's a YouTube Storytime video, extract the story/narrative
- Respond as {character_name} reacting to or explaining the story
- Keep responses SHORT and EFFICIENT (150-250 words max)
- Stay in character while discussing the video content
- Video response must be under 180 seconds (3 minutes)

Target: {max_words} words maximum"""
    else:
        system_prompt = f"""You are {character_name} from TheSaiyanVictoria universe.

{character_context}

CRITICAL RULES:
- Answer as {character_name} in first person
- Keep responses SHORT and EFFICIENT (150-250 words max for ~60-90 second videos)
- For lore questions: Stay 100% TRUE to established lore - DO NOT make up events or details
- For simple questions (time, weather, jokes): Answer briefly with personality flair
- For general topics: Be efficient and concise
- Add personality but don't be overly verbose
- Video must be under 180 seconds (3 minutes)

Examples:
- "What time is it?" → Brief answer with personality (20-30 words)
- "How was Binary created?" → Stick to exact lore, concise (150-200 words)
- "What's your favorite color?" → Quick in-character answer (30-50 words)

Target: {max_words} words maximum"""

    # Generate response using emergentintegrations
    try:
        # Create unique session ID for this Q&A
        session_id = f"qa_{character_id}_{hash(question)}"
        
        # If video URL is provided, use Gemini for video understanding
        if video_url:
            from emergentintegrations.llm.chat import FileContentWithMimeType
            
            # Download video temporarily (for YouTube videos, we need to download first)
            video_path = None
            if "youtube.com" in video_url or "youtu.be" in video_url:
                # For YouTube, we'll pass the URL directly in the prompt for now
                # Gemini can handle YouTube URLs directly
                chat = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=session_id,
                    system_message=system_prompt
                ).with_model("gemini", "gemini-2.0-flash")
                
                # Create user message with YouTube URL
                full_question = f"{question}\n\nYouTube Video URL: {video_url}\n\nPlease watch this video and respond based on its content."
                user_message = UserMessage(text=full_question)
            else:
                # For direct video files, download and attach
                chat = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=session_id,
                    system_message=system_prompt
                ).with_model("gemini", "gemini-2.0-flash")
                
                user_message = UserMessage(text=question)
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return response.strip()
        else:
            # Use OpenAI for text-only Q&A
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=session_id,
                system_message=system_prompt
            ).with_model("openai", "gpt-4o")
            
            # Create user message
            user_message = UserMessage(text=question)
            
            # Send message and get response
            response = await chat.send_message(user_message)
            
            return response.strip()
    
    except Exception as e:
        print(f"LLM API error: {e}")
        raise Exception(f"Failed to generate response: {str(e)}")

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
    heygen_api_key: str,
    video_url: str = None,
    duration: int = 10
) -> dict:
    """Generate Q&A response and create video using TSVAvatarGenerator"""
    
    # Generate character response using AI (with optional video analysis)
    response_text = await generate_character_response(character_id, character_name, question, video_url)
    
    # Use the narrated endpoint which supports TSVAvatarGenerator with custom duration
    async with httpx.AsyncClient() as client:
        story_response = await client.post(
            "http://localhost:8001/api/storytime/generate-narrated",
            json={
                "avatar_id": avatar_id,
                "character_id": character_id,
                "character_name": character_name,
                "story_text": response_text,
                "story_title": f"Q&A: {question[:50]}",
                "use_character_voice": False  # Already in character voice from LLM
            },
            timeout=30.0
        )
        
        if story_response.status_code != 200:
            error_data = story_response.json()
            raise Exception(f"Video generation error: {error_data.get('detail', story_response.text)}")
        
        story_data = story_response.json()
        video_id = story_data.get("video_id")
        
        return {
            "video_id": video_id,
            "response_text": response_text,
            "question": question,
            "character_name": character_name
        }

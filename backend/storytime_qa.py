"""
StoryTime Q&A System
Interactive question-answering with video responses using character lore and personality
"""

import os
import json
from typing import Optional
import httpx
from openai import OpenAI

# Initialize OpenAI with Emergent LLM key
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-3A6Ea89Ad00D72b461")
openai_client = OpenAI(api_key=EMERGENT_LLM_KEY)

# Character lore summaries (from our story data)
CHARACTER_LORE = {
    "victoria_black": """Victoria Black is the seductive and manipulative twin sister of Victoria Chaser. 
    She uses her enchanting voice and motherly figure to gain power through charm rather than combat. 
    During their captivity under Black Frieza, she seduced her way into becoming a Teacher. She saved 
    baby Harmony during their escape and became her adoptive mother. She later participated in a spirit 
    fusion with Victoria Chaser and Wargirl that was permanently bound to Harmony.""",
    
    "wargirl": """Wargirl is the youngest sister who bridges the gap between Victoria Chaser's warrior 
    spirit and Victoria Black's manipulation. She's a skilled fighter who farms PQs to level up her 
    family's abilities. She loves battle and proving herself among great warriors. She participated 
    in the permanent spirit fusion that created Harmony Blaster. She knows Binary was created from 
    a deal Victoria Black made with Vegeta.""",
    
    "evil_victoria": """Evil Victoria represents a darker, more dangerous version of the Victoria persona. 
    She operates from a hidden 'Classified' chamber and has connections to darker forces. She's mysterious, 
    powerful, and speaks with authority about the darker aspects of their timeline.""",
    
    "victoria_chaser": """Victoria Chaser is the resolute warrior and protector of the family. She led 
    the rebellion and escape from Black Frieza's captivity. She's a master combatant who scorns manipulation 
    in favor of pure strength. Though she initially disliked Harmony, her love for Victoria Black made her 
    tolerant of the child. She participated in the spirit fusion that created Harmony Blaster."""
}

async def fetch_girlsmind_personality(character_id: str) -> Optional[dict]:
    """Fetch character personality from GirlsMind API"""
    try:
        async with httpx.AsyncClient() as client:
            # Try to get character from GirlsMind
            response = await client.get(
                f"{os.getenv('GIRLSMIND_BASE_URL', 'https://girlsmind-1.emergent.host')}/api/girls/{character_id}",
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
    max_words: int = 500
) -> str:
    """Generate AI response from character perspective"""
    
    # Fetch GirlsMind personality
    girlsmind_data = await fetch_girlsmind_personality(character_id)
    
    # Build character context
    character_context = build_character_context(character_id, girlsmind_data)
    
    # Create system prompt
    system_prompt = f"""You are {character_name}, a character from TheSaiyanVictoria universe.

{character_context}

IMPORTANT INSTRUCTIONS:
- Answer as {character_name} in first person
- Stay true to your personality and lore
- Keep responses between 400-600 words (aim for video length of 1-2 minutes)
- Be conversational and engaging
- Reference your lore and experiences when relevant
- If asked about other characters, speak from your perspective about them
- For general questions (weather, jokes, etc), respond in-character

Response length target: {max_words} words"""

    # Generate response using OpenAI GPT-5
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # Latest GPT-4o is available via Emergent key
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            temperature=0.8,
            max_tokens=800
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise Exception(f"Failed to generate response: {str(e)}")

async def create_qa_video(
    character_id: str,
    character_name: str,
    question: str,
    avatar_id: str,
    heygen_api_key: str
) -> dict:
    """Generate Q&A response and create video"""
    
    # Generate character response
    response_text = await generate_character_response(character_id, character_name, question)
    
    # Create HeyGen video
    async with httpx.AsyncClient() as client:
        heygen_response = await client.post(
            "https://api.heygen.com/v2/video/generate",
            headers={
                "X-Api-Key": heygen_api_key,
                "Content-Type": "application/json"
            },
            json={
                "video_inputs": [{
                    "character": {
                        "type": "avatar",
                        "avatar_id": avatar_id,
                        "avatar_style": "normal"
                    },
                    "voice": {
                        "type": "text",
                        "input_text": response_text
                    }
                }],
                "dimension": {
                    "width": 1280,
                    "height": 720
                },
                "aspect_ratio": "16:9"
            },
            timeout=30.0
        )
        
        if heygen_response.status_code != 200:
            raise Exception(f"HeyGen API error: {heygen_response.text}")
        
        heygen_data = heygen_response.json()
        video_id = heygen_data.get("data", {}).get("video_id")
        
        return {
            "video_id": video_id,
            "response_text": response_text,
            "question": question,
            "character_name": character_name
        }

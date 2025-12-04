"""
Content Fetcher for StoryTime
Fetches popular AITA posts from Reddit and YouTube Storytime videos
"""

import httpx
import os
from typing import List, Dict

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

async def fetch_popular_aita_posts() -> List[Dict]:
    """Fetch top 5 AITA posts from Reddit"""
    try:
        url = "https://www.reddit.com/r/AmItheAsshole/top.json?limit=5&t=week"
        headers = {"User-Agent": "TSVStoryTime/1.0"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"Reddit API error: {response.status_code}")
                return []
            
            data = response.json()
            posts = []
            
            for idx, child in enumerate(data.get("data", {}).get("children", [])[:5]):
                post = child.get("data", {})
                
                # Get the post text (selftext) and create a preview
                full_text = post.get("selftext", "")
                preview = full_text[:150] + "..." if len(full_text) > 150 else full_text
                
                posts.append({
                    "id": f"reddit-{idx}",
                    "category": "reddit",
                    "title": post.get("title", "Untitled Post"),
                    "preview": preview,
                    "text": full_text,
                    "duration": "2-3 min",
                    "videoUrl": None
                })
            
            return posts
    except Exception as e:
        print(f"Error fetching AITA posts: {e}")
        return []

async def fetch_popular_youtube_storytimes() -> List[Dict]:
    """Fetch popular YouTube Storytime videos"""
    try:
        # Search for popular "storytime" videos
        search_url = "https://www.googleapis.com/youtube/v3/search"
        
        # If no API key, return fallback content
        if not YOUTUBE_API_KEY:
            print("YouTube API key not configured, using fallback content")
            return get_fallback_youtube_content()
        
        params = {
            "part": "snippet",
            "q": "storytime drama story",
            "type": "video",
            "maxResults": 5,
            "order": "viewCount",
            "videoDuration": "medium",
            "key": YOUTUBE_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(search_url, params=params)
            
            if response.status_code != 200:
                print(f"YouTube API error: {response.status_code}")
                return get_fallback_youtube_content()
            
            data = response.json()
            videos = []
            
            for idx, item in enumerate(data.get("items", [])[:5]):
                snippet = item.get("snippet", {})
                video_id = item.get("id", {}).get("videoId", "")
                
                videos.append({
                    "id": f"youtube-{idx}",
                    "category": "youtube",
                    "title": snippet.get("title", "Untitled Video"),
                    "preview": snippet.get("description", "")[:150] + "...",
                    "text": snippet.get("description", ""),
                    "duration": "3-5 min",
                    "videoUrl": f"https://www.youtube.com/watch?v={video_id}"
                })
            
            return videos
    except Exception as e:
        print(f"Error fetching YouTube videos: {e}")
        return get_fallback_youtube_content()

def get_fallback_youtube_content() -> List[Dict]:
    """Fallback YouTube content when API is not available"""
    return [
        {
            "id": "youtube-0",
            "category": "youtube",
            "title": "I Caught My Best Friend Stealing From Me",
            "preview": "We've been best friends since high school...",
            "text": "We've been best friends since high school. Last week, I noticed money missing from my wallet. I set up a hidden camera and caught her red-handed taking cash while I was in the bathroom. When I confronted her, she broke down crying and admitted she's been stealing from me for months to pay off her credit card debt. I'm devastated and don't know if I can ever trust her again.",
            "duration": "3 min",
            "videoUrl": None
        },
        {
            "id": "youtube-1",
            "category": "youtube",
            "title": "My Roommate Is Actually A Millionaire",
            "preview": "Living a double life...",
            "text": "I thought my roommate was just a regular college student struggling to pay rent. One day, a luxury car showed up to pick him up. Turns out, he's from an incredibly wealthy family but wanted to experience 'normal life' so he pretended to be broke. The weird part? He still asked me to cover his share of groceries last month. I feel so manipulated.",
            "duration": "3 min",
            "videoUrl": None
        },
        {
            "id": "youtube-2",
            "category": "youtube",
            "title": "I Pretended To Be Rich For A Week",
            "preview": "Social experiment gone wrong...",
            "text": "I rented designer clothes and a luxury car for a week to see how differently people would treat me. The results were shocking. The same people who ignored me at coffee shops suddenly wanted to be my friend. Salespeople at high-end stores treated me like royalty. But it all came crashing down when someone recognized the rental car. The embarrassment was unreal.",
            "duration": "3 min",
            "videoUrl": None
        },
        {
            "id": "youtube-3",
            "category": "youtube",
            "title": "My Family Kept A Secret From Me For 20 Years",
            "preview": "The truth finally came out...",
            "text": "On my 25th birthday, my parents sat me down and revealed that I was adopted. For 20 years, they never mentioned it. The shocking part? My biological mother has been my 'aunt' this whole time. She's been at every family gathering, every holiday, watching me grow up from the sidelines. I don't know how to process this.",
            "duration": "4 min",
            "videoUrl": None
        },
        {
            "id": "youtube-4",
            "category": "youtube",
            "title": "I Found My Partner's Secret Second Phone",
            "preview": "What I discovered changed everything...",
            "text": "While cleaning, I found a phone hidden in a shoebox in our closet. It wasn't locked, so I looked through it. What I found destroyed me: texts with someone else, plans I knew nothing about, a whole secret life. When I confronted them, they claimed it was for 'privacy.' We've been together for 5 years. How do I move forward?",
            "duration": "3 min",
            "videoUrl": None
        }
    ]

def get_fallback_aita_content() -> List[Dict]:
    """Fallback AITA content when Reddit API is not available"""
    return [
        {
            "id": "reddit-0",
            "category": "reddit",
            "title": "AITA for refusing to share my inheritance with my sister?",
            "preview": "My grandmother left me everything...",
            "text": "So here's the situation. My grandmother passed away six months ago and left everything to me - her house, savings, and jewelry collection. My sister is furious because she expected us to split everything 50/50. But here's the thing: I was the one who took care of Grandma for the last five years while my sister was too busy with her life. Am I the asshole for keeping what was legally given to me?",
            "duration": "2 min",
            "videoUrl": None
        },
        {
            "id": "reddit-1",
            "category": "reddit",
            "title": "AITA for telling my husband his gaming addiction is ruining our marriage?",
            "preview": "He spends 8 hours a day gaming...",
            "text": "My husband plays video games from the moment he gets home until 2 AM every single day. We have two kids who barely see him. I finally told him that if he doesn't change, I'm leaving. He called me controlling and said gaming is his only hobby. Our marriage is falling apart and I don't know what to do anymore.",
            "duration": "2 min",
            "videoUrl": None
        },
        {
            "id": "reddit-2",
            "category": "reddit",
            "title": "AITA for exposing my brother's affair at Thanksgiving dinner?",
            "preview": "Family drama at its finest...",
            "text": "I discovered my brother was cheating on his wife with her sister. I couldn't keep it to myself anymore, so during Thanksgiving dinner, I announced it to everyone. The entire family exploded into chaos. My brother hasn't spoken to me since, and my parents say I ruined the holiday. But his wife deserved to know the truth. Did I do the right thing?",
            "duration": "2 min",
            "videoUrl": None
        },
        {
            "id": "reddit-3",
            "category": "reddit",
            "title": "AITA for refusing to let my daughter invite her stepmother to her wedding?",
            "preview": "It's complicated family dynamics...",
            "text": "My ex-husband remarried 10 years ago. His new wife has always been pushy and tried to replace me in my daughter's life. Now my daughter is getting married, and she wants to invite her stepmother. I told her if that woman comes, I'm not attending. My daughter is upset, but I've been the one raising her, paying for everything. The stepmother just swooped in when the hard part was done. Am I wrong?",
            "duration": "2 min",
            "videoUrl": None
        },
        {
            "id": "reddit-4",
            "category": "reddit",
            "title": "AITA for calling out my friend for always 'forgetting' her wallet?",
            "preview": "This has been happening for months...",
            "text": "Every single time we go out to eat, my friend 'forgets' her wallet. At first, I thought it was genuine mistakes, so I'd cover her. But it's been 8 months now, and she always has an excuse. Last week, I told her in front of everyone that I'm not paying for her anymore. She got embarrassed and called me a terrible friend. But I've spent over $500 on her meals. AITA?",
            "duration": "2 min",
            "videoUrl": None
        }
    ]

async def fetch_all_dynamic_content() -> Dict:
    """Fetch all dynamic content for StoryTime"""
    # Fetch both in parallel
    aita_posts = await fetch_popular_aita_posts()
    youtube_videos = await fetch_popular_youtube_storytimes()
    
    # Use fallback if fetch failed
    if not aita_posts:
        aita_posts = get_fallback_aita_content()
    
    if not youtube_videos:
        youtube_videos = get_fallback_youtube_content()
    
    return {
        "aita": aita_posts,
        "youtube": youtube_videos
    }

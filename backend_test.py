#!/usr/bin/env python3
"""
DeviantArt Integration Testing Script
Tests the DeviantArt OAuth2 integration and gallery view functionality for TSV Terminal Dressing Room
"""

import asyncio
import httpx
import json
from typing import Dict, List, Any, Optional
import time
import os
import re
import urllib.parse

# Get backend URL from frontend environment
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.split('=', 1)[1].strip()
            break
else:
    BACKEND_URL = 'https://victoria-nexus.preview.emergentagent.com'

# Q&A Test Characters with their avatar IDs (from review request)
QA_TEST_CHARACTERS = {
    "wargirl": {
        "character_name": "Wargirl",
        "avatar_id": "1a9bfb4ec9bc43d59ab64a4e66fe467c"
    },
    "evil_victoria": {
        "character_name": "Evil Victoria", 
        "avatar_id": "130c202a4e7a47898dfc6f434c86dc24"
    },
    "victoria_black": {
        "character_name": "Victoria Black",
        "avatar_id": "84516b469b1f44dbb126c40aa24b2df0"
    }
}

# Test questions for Q&A system
QA_TEST_QUESTIONS = [
    "How was Binary created?",  # Lore-specific question from review
    "What happened during your escape from Black Frieza?",
    "Tell me about your relationship with the other characters.",
    "What are your greatest strengths and abilities?",
    ""  # Empty question for error testing
]

# Expected Evil Victoria Avatar ID from review request
EXPECTED_EVIL_VICTORIA_AVATAR_ID = "45ac5eccd176497998afb3e9e508fad1"

# Expected lore story count from review request
EXPECTED_LORE_COUNT = 94

# Expected chapter titles to verify
EXPECTED_CHAPTERS = [
    "Chapter 1: A Saiyan's Fate",
    "2. A New Fighter Joins the team! Harmony Blaster!",
    "Chapter 1: A Saiyan's Fate—Captivity, Rebellion, and a New Beginning (Part 1)"
]

# Character limit for HeyGen API
HEYGEN_CHARACTER_LIMIT = 5000

# StoryTime API endpoints to test
STORYTIME_ENDPOINTS = [
    "/api/storytime/generate",
    "/api/storytime/status",
    "/api/storytime/qa"  # New Q&A endpoint
]

# Test story data for API testing
TEST_STORY_DATA = {
    "avatar_id": EXPECTED_EVIL_VICTORIA_AVATAR_ID,
    "story_text": "This is a test story for Evil Victoria. The story should be engaging and demonstrate the video generation capabilities of the StoryTime feature.",
    "story_title": "Test Story - Evil Victoria"
}

class StoryTimeTester:
    def __init__(self):
        self.results = []
        self.qa_results = []
        self.test_summary = {
            "lore_count_verified": False,
            "chapter_content_verified": False,
            "video_generation_working": False,
            "character_limit_compliant": True,
            "evil_victoria_avatar_correct": False,
            "api_endpoints_working": False,
            "qa_endpoint_working": False,
            "ai_response_quality": False,
            "video_generation_integration": False,
            "multiple_characters_working": False,
            "error_handling_working": False
        }
        self.issues_found = []
        
    async def test_endpoint(self, method: str, url: str, params: Optional[Dict] = None, 
                          headers: Optional[Dict] = None, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Test a single API endpoint"""
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                if method.upper() == "GET":
                    response = await client.get(url, params=params, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(url, params=params, headers=headers, json=data)
                else:
                    response = await client.request(method, url, params=params, headers=headers, json=data)
                
                result = {
                    "method": method,
                    "url": url,
                    "params": params,
                    "status_code": response.status_code,
                    "success": response.status_code < 400,
                    "response_size": len(response.content),
                    "content_type": response.headers.get("content-type", ""),
                    "response_preview": "",
                    "full_response": None
                }
                
                # Try to get response preview and full response
                try:
                    if "application/json" in result["content_type"]:
                        json_data = response.json()
                        result["response_preview"] = json.dumps(json_data, indent=2)[:500]
                        result["full_response"] = json_data
                    else:
                        result["response_preview"] = response.text[:500]
                        result["full_response"] = response.text
                except:
                    result["response_preview"] = f"<Binary content, {len(response.content)} bytes>"
                
                return result
                
        except Exception as e:
            return {
                "method": method,
                "url": url, 
                "params": params,
                "status_code": 0,
                "success": False,
                "error": str(e),
                "response_preview": f"Error: {str(e)}",
                "full_response": None
            }
    
    async def test_lore_story_data(self):
        """Test lore story data by reading the frontend file"""
        print("📚 TESTING LORE STORY DATA...")
        print("=" * 60)
        
        try:
            # Read the story-lore.js file to verify story count and content
            with open('/app/frontend/src/data/story-lore.js', 'r') as f:
                lore_content = f.read()
            
            # Count lore stories by looking for category: 'lore' entries
            lore_story_count = lore_content.count("category: 'lore'")
            
            print(f"📊 Found {lore_story_count} lore stories in story-lore.js")
            
            if lore_story_count == EXPECTED_LORE_COUNT:
                print(f"✅ Lore story count matches expected: {EXPECTED_LORE_COUNT}")
                self.test_summary["lore_count_verified"] = True
            else:
                print(f"❌ Lore story count mismatch: Expected {EXPECTED_LORE_COUNT}, Found {lore_story_count}")
                self.issues_found.append(f"Lore story count mismatch: Expected {EXPECTED_LORE_COUNT}, Found {lore_story_count}")
            
            # Check for expected chapter titles
            chapters_found = 0
            for chapter in EXPECTED_CHAPTERS:
                if chapter in lore_content:
                    chapters_found += 1
                    print(f"✅ Found expected chapter: {chapter}")
                else:
                    print(f"❌ Missing expected chapter: {chapter}")
                    self.issues_found.append(f"Missing expected chapter: {chapter}")
            
            if chapters_found == len(EXPECTED_CHAPTERS):
                print(f"✅ All expected chapters found")
                self.test_summary["chapter_content_verified"] = True
            else:
                print(f"❌ Only {chapters_found}/{len(EXPECTED_CHAPTERS)} expected chapters found")
            
            # Check character limits
            print("\n🔍 CHECKING CHARACTER LIMITS...")
            over_limit_count = 0
            
            # Extract story text content and check lengths
            import re
            text_pattern = r'text:\s*`([^`]*)`'
            text_matches = re.findall(text_pattern, lore_content, re.DOTALL)
            
            for i, text in enumerate(text_matches):
                text_length = len(text)
                if text_length > HEYGEN_CHARACTER_LIMIT:
                    over_limit_count += 1
                    print(f"❌ Story {i+1} exceeds character limit: {text_length} chars (limit: {HEYGEN_CHARACTER_LIMIT})")
                    self.issues_found.append(f"Story {i+1} exceeds character limit: {text_length} chars")
            
            if over_limit_count == 0:
                print(f"✅ All stories are under {HEYGEN_CHARACTER_LIMIT} character limit")
            else:
                print(f"❌ {over_limit_count} stories exceed character limit")
                self.test_summary["character_limit_compliant"] = False
                
        except Exception as e:
            print(f"❌ Error reading lore story data: {str(e)}")
            self.issues_found.append(f"Error reading lore story data: {str(e)}")
    
    async def test_evil_victoria_avatar(self):
        """Test Evil Victoria avatar configuration"""
        print("\n👹 TESTING EVIL VICTORIA AVATAR CONFIGURATION...")
        print("=" * 60)
        
        try:
            # Read the StoryTime.jsx file to verify avatar ID
            with open('/app/frontend/src/pages/StoryTime.jsx', 'r') as f:
                storytime_content = f.read()
            
            # Check if the correct Evil Victoria avatar ID is present
            if EXPECTED_EVIL_VICTORIA_AVATAR_ID in storytime_content:
                print(f"✅ Evil Victoria avatar ID found: {EXPECTED_EVIL_VICTORIA_AVATAR_ID}")
                self.test_summary["evil_victoria_avatar_correct"] = True
            else:
                print(f"❌ Evil Victoria avatar ID not found: {EXPECTED_EVIL_VICTORIA_AVATAR_ID}")
                self.issues_found.append(f"Evil Victoria avatar ID not found: {EXPECTED_EVIL_VICTORIA_AVATAR_ID}")
                
                # Look for other avatar IDs that might be used instead
                import re
                avatar_pattern = r"'evil_victoria':\s*{\s*id:\s*'([^']+)'"
                matches = re.findall(avatar_pattern, storytime_content)
                if matches:
                    actual_id = matches[0]
                    print(f"❌ Found different avatar ID: {actual_id}")
                    self.issues_found.append(f"Wrong Evil Victoria avatar ID: {actual_id} (expected: {EXPECTED_EVIL_VICTORIA_AVATAR_ID})")
                
        except Exception as e:
            print(f"❌ Error checking Evil Victoria avatar: {str(e)}")
            self.issues_found.append(f"Error checking Evil Victoria avatar: {str(e)}")
    
    async def test_storytime_api_endpoints(self):
        """Test StoryTime API endpoints"""
        print("\n🎬 TESTING STORYTIME API ENDPOINTS...")
        print("=" * 60)
        
        # Test video generation endpoint
        generate_url = f"{BACKEND_URL}/api/storytime/generate"
        print(f"Testing POST {generate_url}")
        
        result = await self.test_endpoint("POST", generate_url, data=TEST_STORY_DATA)
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Video generation endpoint working - Status: {result['status_code']}")
            
            # Check if we got a video_id back
            if result["full_response"] and "video_id" in result["full_response"]:
                video_id = result["full_response"]["video_id"]
                print(f"✅ Received video_id: {video_id}")
                
                # Test status endpoint with the video_id
                status_url = f"{BACKEND_URL}/api/storytime/status/{video_id}"
                print(f"Testing GET {status_url}")
                
                status_result = await self.test_endpoint("GET", status_url)
                self.results.append(status_result)
                
                if status_result["success"]:
                    print(f"✅ Video status endpoint working - Status: {status_result['status_code']}")
                    self.test_summary["api_endpoints_working"] = True
                    
                    # Check status response format
                    if status_result["full_response"] and "data" in status_result["full_response"]:
                        status_data = status_result["full_response"]["data"]
                        print(f"✅ Status response format correct: {status_data}")
                    else:
                        print(f"❌ Invalid status response format")
                        self.issues_found.append("Invalid status response format")
                else:
                    print(f"❌ Video status endpoint failed - Status: {status_result['status_code']}")
                    self.issues_found.append(f"Video status endpoint failed: {status_result.get('error', 'Unknown error')}")
            else:
                print(f"❌ No video_id in generation response")
                self.issues_found.append("No video_id in generation response")
        else:
            print(f"❌ Video generation endpoint failed - Status: {result['status_code']}")
            error_msg = result.get('error', 'Unknown error')
            if result.get('full_response'):
                error_msg = result['full_response'].get('detail', error_msg)
            self.issues_found.append(f"Video generation endpoint failed: {error_msg}")
            
        # Test health endpoint
        health_url = f"{BACKEND_URL}/api/health"
        health_result = await self.test_endpoint("GET", health_url)
        self.results.append(health_result)
        
        if health_result["success"]:
            print(f"✅ Health endpoint working - Status: {health_result['status_code']}")
        else:
            print(f"❌ Health endpoint failed - Status: {health_result['status_code']}")
            self.issues_found.append(f"Health endpoint failed: {health_result.get('error', 'Unknown error')}")
    
    async def test_video_generation_flow(self):
        """Test complete video generation flow"""
        print("\n🎥 TESTING COMPLETE VIDEO GENERATION FLOW...")
        print("=" * 60)
        
        # Test with a shorter story for faster testing
        short_story_data = {
            "avatar_id": EXPECTED_EVIL_VICTORIA_AVATAR_ID,
            "story_text": "This is a short test story for Evil Victoria. Testing video generation capabilities.",
            "story_title": "Short Test Story"
        }
        
        try:
            # Step 1: Generate video
            generate_url = f"{BACKEND_URL}/api/storytime/generate"
            result = await self.test_endpoint("POST", generate_url, data=short_story_data)
            
            if not result["success"]:
                print(f"❌ Video generation failed: {result.get('error', 'Unknown error')}")
                self.issues_found.append(f"Video generation failed: {result.get('error', 'Unknown error')}")
                return
            
            if not result["full_response"] or "video_id" not in result["full_response"]:
                print(f"❌ No video_id in response")
                self.issues_found.append("No video_id in video generation response")
                return
                
            video_id = result["full_response"]["video_id"]
            print(f"✅ Video generation started, video_id: {video_id}")
            
            # Step 2: Check initial status
            status_url = f"{BACKEND_URL}/api/storytime/status/{video_id}"
            status_result = await self.test_endpoint("GET", status_url)
            
            if status_result["success"]:
                print(f"✅ Video status check working")
                if status_result["full_response"] and "data" in status_result["full_response"]:
                    status_data = status_result["full_response"]["data"]
                    video_status = status_data.get("status", "unknown")
                    print(f"✅ Video status: {video_status}")
                    self.test_summary["video_generation_working"] = True
                else:
                    print(f"❌ Invalid status response format")
                    self.issues_found.append("Invalid video status response format")
            else:
                print(f"❌ Video status check failed")
                self.issues_found.append("Video status check failed")
                
        except Exception as e:
            print(f"❌ Error in video generation flow: {str(e)}")
            self.issues_found.append(f"Error in video generation flow: {str(e)}")
    
    async def test_qa_endpoint_basic(self):
        """Test Q&A endpoint with basic functionality"""
        print("\n🤖 TESTING Q&A ENDPOINT BASIC FUNCTIONALITY...")
        print("=" * 60)
        
        # Test with Wargirl and Binary creation question (from review request)
        test_payload = {
            "character_id": "wargirl",
            "character_name": "Wargirl", 
            "avatar_id": "1a9bfb4ec9bc43d59ab64a4e66fe467c",
            "question": "How was Binary created?"
        }
        
        qa_url = f"{BACKEND_URL}/api/storytime/qa"
        print(f"Testing POST {qa_url}")
        print(f"Payload: {json.dumps(test_payload, indent=2)}")
        
        result = await self.test_endpoint("POST", qa_url, data=test_payload)
        self.qa_results.append(result)
        
        if result["success"]:
            print(f"✅ Q&A endpoint working - Status: {result['status_code']}")
            
            # Verify response structure
            if result["full_response"]:
                response = result["full_response"]
                required_fields = ["video_id", "response_text", "question", "character_name"]
                missing_fields = [field for field in required_fields if field not in response]
                
                if not missing_fields:
                    print(f"✅ Response contains all required fields: {required_fields}")
                    self.test_summary["qa_endpoint_working"] = True
                    
                    # Check response text length (400-600 words for 1-2 minute video)
                    response_text = response.get("response_text", "")
                    word_count = len(response_text.split())
                    print(f"📝 Response text length: {word_count} words ({len(response_text)} characters)")
                    
                    if 400 <= word_count <= 600:
                        print(f"✅ Response length appropriate for video (400-600 words)")
                        self.test_summary["ai_response_quality"] = True
                    else:
                        print(f"⚠️ Response length outside optimal range: {word_count} words")
                        if word_count < 200:
                            self.issues_found.append(f"Response too short: {word_count} words (expected 400-600)")
                        elif word_count > 800:
                            self.issues_found.append(f"Response too long: {word_count} words (expected 400-600)")
                    
                    # Check if response mentions Binary creation (lore accuracy)
                    if any(keyword in response_text.lower() for keyword in ["binary", "victoria black", "vegeta", "deal"]):
                        print(f"✅ Response references Binary creation lore")
                    else:
                        print(f"⚠️ Response may not reference Binary creation lore accurately")
                        self.issues_found.append("Response doesn't reference expected Binary creation lore")
                    
                    # Check video_id format
                    video_id = response.get("video_id")
                    if video_id and len(video_id) > 10:
                        print(f"✅ Video ID received: {video_id}")
                        return video_id
                    else:
                        print(f"❌ Invalid video_id: {video_id}")
                        self.issues_found.append(f"Invalid video_id format: {video_id}")
                else:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.issues_found.append(f"Q&A response missing fields: {missing_fields}")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Q&A endpoint returned no response data")
        else:
            print(f"❌ Q&A endpoint failed - Status: {result['status_code']}")
            error_msg = result.get('error', 'Unknown error')
            if result.get('full_response'):
                error_msg = result['full_response'].get('detail', error_msg)
            self.issues_found.append(f"Q&A endpoint failed: {error_msg}")
            
        return None

    async def test_multiple_characters(self):
        """Test Q&A with different characters"""
        print("\n👥 TESTING MULTIPLE CHARACTERS...")
        print("=" * 60)
        
        working_characters = 0
        
        for char_id, char_data in QA_TEST_CHARACTERS.items():
            print(f"\n🎭 Testing character: {char_data['character_name']} ({char_id})")
            
            test_payload = {
                "character_id": char_id,
                "character_name": char_data["character_name"],
                "avatar_id": char_data["avatar_id"], 
                "question": "Tell me about your role in the story."
            }
            
            qa_url = f"{BACKEND_URL}/api/storytime/qa"
            result = await self.test_endpoint("POST", qa_url, data=test_payload)
            self.qa_results.append(result)
            
            if result["success"] and result.get("full_response", {}).get("video_id"):
                print(f"✅ {char_data['character_name']}: Working")
                working_characters += 1
                
                # Check character-specific response
                response_text = result["full_response"].get("response_text", "").lower()
                if char_id in response_text or char_data["character_name"].lower() in response_text:
                    print(f"✅ Response stays in character")
                else:
                    print(f"⚠️ Response may not be character-specific")
            else:
                print(f"❌ {char_data['character_name']}: Failed")
                error_msg = result.get('error', f"HTTP {result['status_code']}")
                self.issues_found.append(f"Character {char_data['character_name']} Q&A failed: {error_msg}")
        
        if working_characters == len(QA_TEST_CHARACTERS):
            print(f"\n✅ All {len(QA_TEST_CHARACTERS)} characters working correctly")
            self.test_summary["multiple_characters_working"] = True
        else:
            print(f"\n❌ Only {working_characters}/{len(QA_TEST_CHARACTERS)} characters working")

    async def test_video_generation_integration(self, video_id: str = None):
        """Test HeyGen video generation integration"""
        print("\n🎬 TESTING VIDEO GENERATION INTEGRATION...")
        print("=" * 60)
        
        if not video_id:
            print("❌ No video_id available for testing - skipping integration test")
            return
            
        # Test status polling
        status_url = f"{BACKEND_URL}/api/storytime/status/{video_id}"
        print(f"Testing video status polling: {status_url}")
        
        max_polls = 3
        for poll_count in range(max_polls):
            print(f"📊 Status poll {poll_count + 1}/{max_polls}")
            
            result = await self.test_endpoint("GET", status_url)
            self.results.append(result)
            
            if result["success"]:
                print(f"✅ Status endpoint working - Status: {result['status_code']}")
                
                if result["full_response"] and "data" in result["full_response"]:
                    status_data = result["full_response"]["data"]
                    video_status = status_data.get("status", "unknown")
                    print(f"📹 Video status: {video_status}")
                    
                    if video_status == "completed":
                        video_url = status_data.get("video_url")
                        if video_url:
                            print(f"✅ Video completed with URL: {video_url[:50]}...")
                            self.test_summary["video_generation_integration"] = True
                            return
                        else:
                            print(f"❌ Video completed but no URL provided")
                    elif video_status == "failed":
                        print(f"❌ Video generation failed")
                        self.issues_found.append("HeyGen video generation failed")
                        return
                    elif video_status in ["processing", "pending"]:
                        print(f"⏳ Video still processing...")
                        if poll_count < max_polls - 1:
                            await asyncio.sleep(10)  # Wait before next poll
                    else:
                        print(f"⚠️ Unknown video status: {video_status}")
                else:
                    print(f"❌ Invalid status response format")
                    self.issues_found.append("Invalid video status response format")
                    return
            else:
                print(f"❌ Status endpoint failed - Status: {result['status_code']}")
                self.issues_found.append(f"Video status check failed: {result.get('error', 'Unknown error')}")
                return
        
        print(f"⏳ Video still processing after {max_polls} polls - integration test incomplete")

    async def test_error_handling(self):
        """Test Q&A error handling"""
        print("\n🚨 TESTING ERROR HANDLING...")
        print("=" * 60)
        
        error_tests = [
            {
                "name": "Empty question",
                "payload": {
                    "character_id": "wargirl",
                    "character_name": "Wargirl",
                    "avatar_id": "1a9bfb4ec9bc43d59ab64a4e66fe467c",
                    "question": ""
                },
                "expected_error": True
            },
            {
                "name": "Invalid character_id", 
                "payload": {
                    "character_id": "invalid_character",
                    "character_name": "Invalid Character",
                    "avatar_id": "1a9bfb4ec9bc43d59ab64a4e66fe467c",
                    "question": "Test question"
                },
                "expected_error": False  # Should still work, just use default lore
            },
            {
                "name": "Missing required fields",
                "payload": {
                    "character_id": "wargirl",
                    "question": "Test question"
                    # Missing character_name and avatar_id
                },
                "expected_error": True
            }
        ]
        
        qa_url = f"{BACKEND_URL}/api/storytime/qa"
        error_handling_working = True
        
        for test_case in error_tests:
            print(f"\n🧪 Testing: {test_case['name']}")
            
            result = await self.test_endpoint("POST", qa_url, data=test_case["payload"])
            self.qa_results.append(result)
            
            if test_case["expected_error"]:
                if not result["success"]:
                    print(f"✅ Correctly rejected invalid request")
                else:
                    print(f"❌ Should have rejected invalid request")
                    error_handling_working = False
                    self.issues_found.append(f"Error handling failed for: {test_case['name']}")
            else:
                if result["success"]:
                    print(f"✅ Handled edge case gracefully")
                else:
                    print(f"⚠️ Failed to handle edge case: {test_case['name']}")
        
        if error_handling_working:
            self.test_summary["error_handling_working"] = True

    async def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        print("\n🔗 TESTING BACKEND CONNECTIVITY...")
        print("=" * 60)
        
        # Test basic endpoints
        endpoints_to_test = [
            "/api/health",
            "/api/status"
        ]
        
        for endpoint in endpoints_to_test:
            url = f"{BACKEND_URL}{endpoint}"
            result = await self.test_endpoint("GET", url)
            self.results.append(result)
            
            if result["success"]:
                print(f"✅ {endpoint} - Status: {result['status_code']}")
                if result["response_preview"]:
                    print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {endpoint} - Status: {result['status_code']}")
                self.issues_found.append(f"Backend endpoint {endpoint} failed: {result.get('error', 'Unknown error')}")
    
    def generate_report(self):
        """Generate comprehensive StoryTime test report"""
        print("\n" + "=" * 80)
        print("📋 STORYTIME LORE FEATURE TEST REPORT")
        print("=" * 80)
        
        working_results = [r for r in self.results if r["success"]]
        failed_results = [r for r in self.results if not r["success"]]
        
        print(f"\n📊 API TEST SUMMARY:")
        print(f"   Total API Tests: {len(self.results)}")
        print(f"   ✅ Working: {len(working_results)}")
        print(f"   ❌ Failed: {len(failed_results)}")
        
        print(f"\n🎯 STORYTIME FEATURE VERIFICATION:")
        print(f"   ✅ Lore Count (94 stories): {'PASS' if self.test_summary['lore_count_verified'] else 'FAIL'}")
        print(f"   ✅ Chapter Content: {'PASS' if self.test_summary['chapter_content_verified'] else 'FAIL'}")
        print(f"   ✅ Video Generation API: {'PASS' if self.test_summary['video_generation_working'] else 'FAIL'}")
        print(f"   ✅ Character Limit (<5000): {'PASS' if self.test_summary['character_limit_compliant'] else 'FAIL'}")
        print(f"   ✅ Evil Victoria Avatar ID: {'PASS' if self.test_summary['evil_victoria_avatar_correct'] else 'FAIL'}")
        print(f"   ✅ API Endpoints: {'PASS' if self.test_summary['api_endpoints_working'] else 'FAIL'}")
        
        # Calculate overall success
        all_tests_passed = all(self.test_summary.values())
        print(f"\n🏆 OVERALL RESULT: {'✅ ALL TESTS PASSED' if all_tests_passed else '❌ SOME TESTS FAILED'}")
        
        if self.issues_found:
            print(f"\n❌ ISSUES FOUND ({len(self.issues_found)}):")
            for i, issue in enumerate(self.issues_found, 1):
                print(f"   {i}. {issue}")
        
        if working_results:
            print(f"\n✅ WORKING API ENDPOINTS ({len(working_results)}):")
            for result in working_results:
                print(f"   {result['method']} {result['url']} - Status: {result['status_code']}")
        
        if failed_results:
            print(f"\n❌ FAILED API ENDPOINTS ({len(failed_results)}):")
            for result in failed_results:
                error_info = result.get('error', f"HTTP {result['status_code']}")
                print(f"   {result['method']} {result['url']} - {error_info}")
        
        return {
            "total_tests": len(self.results),
            "working_count": len(working_results),
            "failed_count": len(failed_results),
            "test_summary": self.test_summary,
            "issues_found": self.issues_found,
            "all_tests_passed": all_tests_passed
        }

async def main():
    """Main StoryTime testing function"""
    print("🚀 STORYTIME LORE FEATURE COMPREHENSIVE TESTING")
    print(f"🎯 Backend URL: {BACKEND_URL}")
    print(f"📅 Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    tester = StoryTimeTester()
    
    # Run all test phases
    await tester.test_backend_connectivity()
    await tester.test_lore_story_data()
    await tester.test_evil_victoria_avatar()
    await tester.test_storytime_api_endpoints()
    await tester.test_video_generation_flow()
    
    # Generate final report
    report = tester.generate_report()
    
    print(f"\n🏁 Testing completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())
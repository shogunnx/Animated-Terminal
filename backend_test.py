#!/usr/bin/env python3
"""
StoryTime Lore Feature Comprehensive Testing Script
Tests the StoryTime feature with FULL chapter text scraped from Fandom wiki
"""

import asyncio
import httpx
import json
from typing import Dict, List, Any, Optional
import time
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://avatar-realm-5.preview.emergentagent.com')

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
    "/api/storytime/status"
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
        self.test_summary = {
            "lore_count_verified": False,
            "chapter_content_verified": False,
            "video_generation_working": False,
            "character_limit_compliant": True,
            "evil_victoria_avatar_correct": False,
            "api_endpoints_working": False
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
    
    async def test_character_endpoints(self):
        """Test character-specific endpoints"""
        print("\n👥 TESTING CHARACTER ENDPOINTS...")
        print("=" * 60)
        
        character_endpoints = ["/api/relationship", "/api/memories", "/relationship", "/memories"]
        
        for endpoint in character_endpoints:
            for char_id in CHARACTER_VARIATIONS:
                # Test with character ID in path
                url = f"{BASE_URL}{endpoint}/{char_id}"
                result = await self.test_endpoint("GET", url)
                self.results.append(result)
                
                if result["success"]:
                    print(f"✅ {endpoint}/{char_id} - Status: {result['status_code']}")
                    if result["response_preview"]:
                        print(f"   Preview: {result['response_preview'][:100]}...")
                else:
                    print(f"❌ {endpoint}/{char_id} - Status: {result['status_code']}")
    
    async def test_with_query_params(self):
        """Test endpoints with various query parameters"""
        print("\n🔧 TESTING WITH QUERY PARAMETERS...")
        print("=" * 60)
        
        # Test working endpoints with different query parameters
        for endpoint in self.working_endpoints[:3]:  # Test top 3 working endpoints
            for params in QUERY_PARAMS:
                url = f"{BASE_URL}{endpoint}"
                result = await self.test_endpoint("GET", url, params=params)
                self.results.append(result)
                
                if result["success"]:
                    print(f"✅ {endpoint} with {params} - Status: {result['status_code']}")
                else:
                    print(f"❌ {endpoint} with {params} - Status: {result['status_code']}")
    
    async def test_post_endpoints(self):
        """Test POST requests for storing data"""
        print("\n📝 TESTING POST ENDPOINTS...")
        print("=" * 60)
        
        post_endpoints = ["/api/store_exchange", "/store_exchange", "/api/memories", "/memories"]
        
        # Sample data for POST requests
        sample_data = {
            "userId": "guest",
            "characterId": "59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
            "message": "Test message",
            "timestamp": int(time.time())
        }
        
        for endpoint in post_endpoints:
            url = f"{BASE_URL}{endpoint}"
            result = await self.test_endpoint("POST", url, data=sample_data)
            self.results.append(result)
            
            if result["success"]:
                print(f"✅ POST {endpoint} - Status: {result['status_code']}")
                if result["response_preview"]:
                    print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ POST {endpoint} - Status: {result['status_code']}")
    
    async def test_root_endpoints(self):
        """Test root and common endpoints"""
        print("\n🏠 TESTING ROOT ENDPOINTS...")
        print("=" * 60)
        
        root_endpoints = ["/", "/health", "/status", "/api", "/api/health", "/api/status"]
        
        for endpoint in root_endpoints:
            url = f"{BASE_URL}{endpoint}"
            result = await self.test_endpoint("GET", url)
            self.results.append(result)
            
            if result["success"]:
                print(f"✅ {endpoint} - Status: {result['status_code']}")
                if result["response_preview"]:
                    print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {endpoint} - Status: {result['status_code']}")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📋 COMPREHENSIVE TEST REPORT")
        print("=" * 80)
        
        working_results = [r for r in self.results if r["success"]]
        failed_results = [r for r in self.results if not r["success"]]
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Tests: {len(self.results)}")
        print(f"   ✅ Working: {len(working_results)}")
        print(f"   ❌ Failed: {len(failed_results)}")
        
        if working_results:
            print(f"\n✅ WORKING ENDPOINTS ({len(working_results)}):")
            for result in working_results:
                params_str = f" (params: {result['params']})" if result.get('params') else ""
                print(f"   {result['method']} {result['url']}{params_str} - Status: {result['status_code']}")
                if result.get('response_preview') and len(result['response_preview']) > 10:
                    print(f"      Response: {result['response_preview'][:150]}...")
        
        if failed_results:
            print(f"\n❌ FAILED ENDPOINTS ({len(failed_results)}):")
            for result in failed_results:
                params_str = f" (params: {result['params']})" if result.get('params') else ""
                error_info = result.get('error', f"HTTP {result['status_code']}")
                print(f"   {result['method']} {result['url']}{params_str} - {error_info}")
        
        # Detailed analysis
        print(f"\n🔍 DETAILED ANALYSIS:")
        
        # Group by status code
        status_codes = {}
        for result in self.results:
            code = result['status_code']
            if code not in status_codes:
                status_codes[code] = []
            status_codes[code].append(result)
        
        for code, results in sorted(status_codes.items()):
            print(f"   Status {code}: {len(results)} endpoints")
        
        # Find patterns in working endpoints
        if working_results:
            print(f"\n🎯 WORKING ENDPOINT PATTERNS:")
            working_paths = [r['url'].replace(BASE_URL, '') for r in working_results]
            unique_paths = list(set(working_paths))
            for path in sorted(unique_paths):
                print(f"   {path}")
        
        return {
            "total_tests": len(self.results),
            "working_count": len(working_results),
            "failed_count": len(failed_results),
            "working_endpoints": working_results,
            "failed_endpoints": failed_results,
            "status_codes": status_codes
        }

async def main():
    """Main testing function"""
    print("🚀 GIRLSMIND API DISCOVERY & TESTING")
    print(f"🎯 Target: {BASE_URL}")
    print(f"📅 Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    tester = APITester()
    
    # Run all test phases
    await tester.test_root_endpoints()
    await tester.discover_endpoints()
    await tester.test_character_endpoints()
    await tester.test_with_query_params()
    await tester.test_post_endpoints()
    
    # Generate final report
    report = tester.generate_report()
    
    print(f"\n🏁 Testing completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())
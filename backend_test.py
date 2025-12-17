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

# DeviantArt Integration Test Configuration
DEVIANTART_ENDPOINTS = [
    "/api/deviantart/auth-status",
    "/api/deviantart/auth-url", 
    "/api/deviantart/view-url/Binary",
    "/api/deviantart/view-url/Victoria%20Black"
]

# Expected DeviantArt configuration from review request
EXPECTED_CLIENT_ID = "55907"
EXPECTED_USERNAME = "TheSaiyanVictoria"

# Test characters for DeviantArt gallery URLs
TEST_CHARACTERS = [
    {"name": "Binary", "expected_slug": "binary"},
    {"name": "Victoria Black", "expected_slug": "victoria-black"},
    {"name": "Wargirl", "expected_slug": "wargirl"},
    {"name": "Evil Victoria", "expected_slug": "evil-victoria"}
]

# Expected gallery URL pattern
EXPECTED_GALLERY_URL_PATTERN = f"https://www.deviantart.com/{EXPECTED_USERNAME}/gallery/0/"

class DeviantArtTester:
    def __init__(self):
        self.results = []
        self.test_summary = {
            "auth_status_working": False,
            "auth_url_working": False,
            "auth_url_has_correct_client_id": False,
            "auth_url_has_correct_redirect": False,
            "auth_url_has_correct_scope": False,
            "view_url_binary_working": False,
            "view_url_victoria_black_working": False,
            "gallery_urls_correct_format": False,
            "backend_connectivity": False,
            "frontend_ui_accessible": False,
            "dressing_room_buttons_present": False
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
    
    async def test_deviantart_auth_status(self):
        """Test DeviantArt authentication status endpoint"""
        print("🔐 TESTING DEVIANTART AUTH STATUS...")
        print("=" * 60)
        
        url = f"{BACKEND_URL}/api/deviantart/auth-status"
        print(f"Testing GET {url}")
        
        result = await self.test_endpoint("GET", url)
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Auth status endpoint working - Status: {result['status_code']}")
            
            # Check response format
            if result["full_response"]:
                response = result["full_response"]
                
                # Should have authenticated and username fields
                if "authenticated" in response and "username" in response:
                    print(f"✅ Response has required fields: authenticated, username")
                    
                    # Initially should be false and null
                    if response["authenticated"] == False and response["username"] is None:
                        print(f"✅ Initial auth state correct: authenticated=false, username=null")
                        self.test_summary["auth_status_working"] = True
                    else:
                        print(f"⚠️ Unexpected auth state: authenticated={response['authenticated']}, username={response['username']}")
                        # This might be OK if already authenticated
                        self.test_summary["auth_status_working"] = True
                else:
                    print(f"❌ Missing required fields in response")
                    self.issues_found.append("Auth status response missing required fields")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Auth status endpoint returned no data")
        else:
            print(f"❌ Auth status endpoint failed - Status: {result['status_code']}")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Auth status endpoint failed: {error_msg}")
    
    async def test_deviantart_auth_url(self):
        """Test DeviantArt OAuth2 authorization URL endpoint"""
        print("\n🔗 TESTING DEVIANTART AUTH URL...")
        print("=" * 60)
        
        url = f"{BACKEND_URL}/api/deviantart/auth-url"
        print(f"Testing GET {url}")
        
        result = await self.test_endpoint("GET", url)
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Auth URL endpoint working - Status: {result['status_code']}")
            
            if result["full_response"]:
                response = result["full_response"]
                
                # Check for required fields
                required_fields = ["auth_url", "client_id", "redirect_uri"]
                missing_fields = [field for field in required_fields if field not in response]
                
                if not missing_fields:
                    print(f"✅ Response has all required fields: {required_fields}")
                    self.test_summary["auth_url_working"] = True
                    
                    # Check client_id
                    if response["client_id"] == EXPECTED_CLIENT_ID:
                        print(f"✅ Client ID correct: {EXPECTED_CLIENT_ID}")
                        self.test_summary["auth_url_has_correct_client_id"] = True
                    else:
                        print(f"❌ Client ID mismatch: Expected {EXPECTED_CLIENT_ID}, Got {response['client_id']}")
                        self.issues_found.append(f"Client ID mismatch: Expected {EXPECTED_CLIENT_ID}, Got {response['client_id']}")
                    
                    # Check auth_url format and parameters
                    auth_url = response["auth_url"]
                    if "deviantart.com/oauth2/authorize" in auth_url:
                        print(f"✅ Auth URL has correct DeviantArt OAuth2 endpoint")
                        
                        # Parse URL parameters
                        parsed_url = urllib.parse.urlparse(auth_url)
                        params = urllib.parse.parse_qs(parsed_url.query)
                        
                        # Check required OAuth2 parameters
                        if "client_id" in params and params["client_id"][0] == EXPECTED_CLIENT_ID:
                            print(f"✅ Auth URL contains correct client_id parameter")
                        else:
                            print(f"❌ Auth URL missing or incorrect client_id parameter")
                            self.issues_found.append("Auth URL missing correct client_id parameter")
                        
                        if "redirect_uri" in params:
                            redirect_uri = params["redirect_uri"][0]
                            print(f"✅ Auth URL contains redirect_uri: {redirect_uri}")
                            self.test_summary["auth_url_has_correct_redirect"] = True
                        else:
                            print(f"❌ Auth URL missing redirect_uri parameter")
                            self.issues_found.append("Auth URL missing redirect_uri parameter")
                        
                        if "scope" in params:
                            scope = params["scope"][0]
                            print(f"✅ Auth URL contains scope: {scope}")
                            self.test_summary["auth_url_has_correct_scope"] = True
                        else:
                            print(f"❌ Auth URL missing scope parameter")
                            self.issues_found.append("Auth URL missing scope parameter")
                    else:
                        print(f"❌ Auth URL doesn't point to DeviantArt OAuth2 endpoint")
                        self.issues_found.append("Auth URL doesn't point to DeviantArt OAuth2 endpoint")
                else:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.issues_found.append(f"Auth URL response missing fields: {missing_fields}")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Auth URL endpoint returned no data")
        else:
            print(f"❌ Auth URL endpoint failed - Status: {result['status_code']}")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Auth URL endpoint failed: {error_msg}")
    
    async def test_deviantart_view_urls(self):
        """Test DeviantArt gallery view URL endpoints"""
        print("\n👁️ TESTING DEVIANTART VIEW URL ENDPOINTS...")
        print("=" * 60)
        
        # Test Binary character view URL
        binary_url = f"{BACKEND_URL}/api/deviantart/view-url/Binary"
        print(f"Testing GET {binary_url}")
        
        result = await self.test_endpoint("GET", binary_url)
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Binary view URL endpoint working - Status: {result['status_code']}")
            
            if result["full_response"]:
                response = result["full_response"]
                
                if "gallery_url" in response:
                    gallery_url = response["gallery_url"]
                    expected_binary_url = f"{EXPECTED_GALLERY_URL_PATTERN}binary"
                    
                    if gallery_url == expected_binary_url:
                        print(f"✅ Binary gallery URL correct: {gallery_url}")
                        self.test_summary["view_url_binary_working"] = True
                    else:
                        print(f"❌ Binary gallery URL incorrect: Expected {expected_binary_url}, Got {gallery_url}")
                        self.issues_found.append(f"Binary gallery URL incorrect: Expected {expected_binary_url}, Got {gallery_url}")
                else:
                    print(f"❌ Binary view URL response missing gallery_url field")
                    self.issues_found.append("Binary view URL response missing gallery_url field")
        else:
            print(f"❌ Binary view URL endpoint failed - Status: {result['status_code']}")
            self.issues_found.append(f"Binary view URL endpoint failed: {result.get('error', 'Unknown error')}")
        
        # Test Victoria Black character view URL
        victoria_url = f"{BACKEND_URL}/api/deviantart/view-url/Victoria%20Black"
        print(f"Testing GET {victoria_url}")
        
        result = await self.test_endpoint("GET", victoria_url)
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Victoria Black view URL endpoint working - Status: {result['status_code']}")
            
            if result["full_response"]:
                response = result["full_response"]
                
                if "gallery_url" in response:
                    gallery_url = response["gallery_url"]
                    expected_victoria_url = f"{EXPECTED_GALLERY_URL_PATTERN}victoria-black"
                    
                    if gallery_url == expected_victoria_url:
                        print(f"✅ Victoria Black gallery URL correct: {gallery_url}")
                        self.test_summary["view_url_victoria_black_working"] = True
                    else:
                        print(f"❌ Victoria Black gallery URL incorrect: Expected {expected_victoria_url}, Got {gallery_url}")
                        self.issues_found.append(f"Victoria Black gallery URL incorrect: Expected {expected_victoria_url}, Got {gallery_url}")
                else:
                    print(f"❌ Victoria Black view URL response missing gallery_url field")
                    self.issues_found.append("Victoria Black view URL response missing gallery_url field")
        else:
            print(f"❌ Victoria Black view URL endpoint failed - Status: {result['status_code']}")
            self.issues_found.append(f"Victoria Black view URL endpoint failed: {result.get('error', 'Unknown error')}")
        
        # Test all characters for URL format consistency
        print(f"\n🔍 TESTING ALL CHARACTER GALLERY URL FORMATS...")
        all_urls_correct = True
        
        for character in TEST_CHARACTERS:
            char_name = character["name"]
            expected_slug = character["expected_slug"]
            
            encoded_name = urllib.parse.quote(char_name)
            test_url = f"{BACKEND_URL}/api/deviantart/view-url/{encoded_name}"
            
            result = await self.test_endpoint("GET", test_url)
            self.results.append(result)
            
            if result["success"] and result["full_response"] and "gallery_url" in result["full_response"]:
                gallery_url = result["full_response"]["gallery_url"]
                expected_url = f"{EXPECTED_GALLERY_URL_PATTERN}{expected_slug}"
                
                if gallery_url == expected_url:
                    print(f"✅ {char_name}: {gallery_url}")
                else:
                    print(f"❌ {char_name}: Expected {expected_url}, Got {gallery_url}")
                    all_urls_correct = False
                    self.issues_found.append(f"{char_name} gallery URL format incorrect")
            else:
                print(f"❌ {char_name}: Failed to get gallery URL")
                all_urls_correct = False
                self.issues_found.append(f"{char_name} view URL endpoint failed")
        
        if all_urls_correct:
            print(f"✅ All character gallery URLs have correct format")
            self.test_summary["gallery_urls_correct_format"] = True
    
    async def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        print("\n🔗 TESTING BACKEND CONNECTIVITY...")
        print("=" * 60)
        
        # Test basic endpoints
        endpoints_to_test = [
            "/api/health",
            "/api/status"
        ]
        
        connectivity_working = True
        
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
                connectivity_working = False
                self.issues_found.append(f"Backend endpoint {endpoint} failed: {result.get('error', 'Unknown error')}")
        
        if connectivity_working:
            self.test_summary["backend_connectivity"] = True
    
    async def test_frontend_dressing_room_ui(self):
        """Test frontend dressing room UI for Binary character"""
        print("\n🎨 TESTING FRONTEND DRESSING ROOM UI...")
        print("=" * 60)
        
        # Test if we can access the dressing room page for Binary
        dressing_room_url = f"{BACKEND_URL}/dressing-room/binary"
        print(f"Testing frontend access: {dressing_room_url}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(dressing_room_url)
                
                if response.status_code == 200:
                    print(f"✅ Dressing room page accessible - Status: {response.status_code}")
                    self.test_summary["frontend_ui_accessible"] = True
                    
                    # Check if it's HTML content (not JSON error)
                    content_type = response.headers.get("content-type", "")
                    if "text/html" in content_type:
                        print(f"✅ Received HTML content (frontend page)")
                        
                        # Look for key elements in the HTML
                        html_content = response.text.lower()
                        
                        # Check for Binary character reference
                        if "binary" in html_content:
                            print(f"✅ Page contains Binary character reference")
                        else:
                            print(f"⚠️ Page may not contain Binary character reference")
                        
                        # Check for button-related text (this is a basic check)
                        button_indicators = ["save", "post", "view", "connect", "deviantart"]
                        found_buttons = [btn for btn in button_indicators if btn in html_content]
                        
                        if len(found_buttons) >= 3:
                            print(f"✅ Page likely contains expected buttons: {found_buttons}")
                            self.test_summary["dressing_room_buttons_present"] = True
                        else:
                            print(f"⚠️ Page may be missing some buttons. Found: {found_buttons}")
                            self.issues_found.append(f"Dressing room page may be missing buttons. Found: {found_buttons}")
                    else:
                        print(f"❌ Received non-HTML content: {content_type}")
                        self.issues_found.append(f"Dressing room page returned non-HTML content: {content_type}")
                else:
                    print(f"❌ Dressing room page not accessible - Status: {response.status_code}")
                    self.issues_found.append(f"Dressing room page returned status {response.status_code}")
                    
        except Exception as e:
            print(f"❌ Error accessing dressing room page: {str(e)}")
            self.issues_found.append(f"Error accessing dressing room page: {str(e)}")

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
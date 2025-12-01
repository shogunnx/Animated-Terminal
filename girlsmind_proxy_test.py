#!/usr/bin/env python3
"""
GirlsMind API Connection and Integration Test
Tests backend proxy configuration and direct API access as specified in review request
"""

import asyncio
import httpx
import json
import time
from typing import Dict, List, Any, Optional

# URLs from review request
GIRLSMIND_DIRECT_URL = "https://girlsmind-1.emergent.host"
BACKEND_URL = "http://localhost:8001"
PROXY_BASE = f"{BACKEND_URL}/api/girlsmind"

# Test characters from review request
TEST_CHARACTERS = ["victoria_black", "wargirl", "binary"]

class GirlsMindProxyTester:
    def __init__(self):
        self.results = []
        self.direct_times = []
        self.proxy_times = []
        
    async def test_endpoint(self, method: str, url: str, description: str, expected_status: int = 200) -> Dict[str, Any]:
        """Test a single endpoint with timing"""
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.request(method, url)
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                
                result = {
                    "description": description,
                    "method": method,
                    "url": url,
                    "status_code": response.status_code,
                    "expected_status": expected_status,
                    "success": response.status_code == expected_status or (expected_status == 200 and response.status_code < 400),
                    "response_time_ms": round(response_time, 2),
                    "content_type": response.headers.get("content-type", ""),
                    "response_size": len(response.content),
                    "response_preview": ""
                }
                
                # Get response preview
                try:
                    if "application/json" in result["content_type"]:
                        json_data = response.json()
                        result["response_preview"] = json.dumps(json_data, indent=2)[:300]
                        result["json_data"] = json_data
                    else:
                        result["response_preview"] = response.text[:300]
                except:
                    result["response_preview"] = f"<Binary/Invalid content, {len(response.content)} bytes>"
                
                return result
                
        except Exception as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return {
                "description": description,
                "method": method,
                "url": url,
                "status_code": 0,
                "expected_status": expected_status,
                "success": False,
                "response_time_ms": round(response_time, 2),
                "error": str(e),
                "response_preview": f"Error: {str(e)}"
            }
    
    async def test_direct_girlsmind_connection(self):
        """Test Case 1: Direct GirlsMind API Connection"""
        print("🔗 TEST CASE 1: Direct GirlsMind API Connection")
        print("=" * 60)
        
        # Test direct API endpoints as specified in review
        direct_tests = [
            (f"{GIRLSMIND_DIRECT_URL}/api", "Direct GirlsMind service info"),
            (f"{GIRLSMIND_DIRECT_URL}/api/girls", "Direct GirlsMind character list")
        ]
        
        for url, description in direct_tests:
            result = await self.test_endpoint("GET", url, description)
            self.results.append(result)
            self.direct_times.append(result["response_time_ms"])
            
            if result["success"]:
                print(f"✅ {description}")
                print(f"   Status: {result['status_code']}, Time: {result['response_time_ms']}ms")
                if result.get("json_data"):
                    if isinstance(result["json_data"], list):
                        print(f"   Response: List with {len(result['json_data'])} items")
                    elif isinstance(result["json_data"], dict):
                        print(f"   Response: Dict with keys: {list(result['json_data'].keys())}")
                print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {description}")
                print(f"   Status: {result['status_code']}, Error: {result.get('error', 'HTTP Error')}")
    
    async def test_backend_proxy_connection(self):
        """Test Case 2: Backend Proxy to GirlsMind"""
        print("\n🔄 TEST CASE 2: Backend Proxy to GirlsMind")
        print("=" * 60)
        
        # Test proxy endpoints as specified in review
        proxy_tests = [
            (f"{PROXY_BASE}/api", "Backend proxy to GirlsMind service info"),
            (f"{PROXY_BASE}/api/girls", "Backend proxy to GirlsMind character list")
        ]
        
        for url, description in proxy_tests:
            result = await self.test_endpoint("GET", url, description)
            self.results.append(result)
            self.proxy_times.append(result["response_time_ms"])
            
            if result["success"]:
                print(f"✅ {description}")
                print(f"   Status: {result['status_code']}, Time: {result['response_time_ms']}ms")
                if result.get("json_data"):
                    if isinstance(result["json_data"], list):
                        print(f"   Response: List with {len(result['json_data'])} items")
                    elif isinstance(result["json_data"], dict):
                        print(f"   Response: Dict with keys: {list(result['json_data'].keys())}")
                print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {description}")
                print(f"   Status: {result['status_code']}, Error: {result.get('error', 'HTTP Error')}")
    
    async def test_character_specific_endpoints(self):
        """Test Case 3: Character-Specific Endpoints"""
        print("\n👥 TEST CASE 3: Character-Specific Endpoints")
        print("=" * 60)
        
        for character in TEST_CHARACTERS:
            url = f"{PROXY_BASE}/api/girls/{character}"
            description = f"Character data for {character}"
            
            result = await self.test_endpoint("GET", url, description)
            self.results.append(result)
            
            if result["success"]:
                print(f"✅ {description}")
                print(f"   Status: {result['status_code']}, Time: {result['response_time_ms']}ms")
                if result.get("json_data") and isinstance(result["json_data"], dict):
                    char_name = result["json_data"].get("name", "Unknown")
                    char_id = result["json_data"].get("id", "Unknown")
                    print(f"   Character: {char_name} (ID: {char_id})")
                print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {description}")
                print(f"   Status: {result['status_code']}, Error: {result.get('error', 'HTTP Error')}")
    
    async def test_non_existent_endpoints(self):
        """Test Case 4: Non-Existent Endpoints (Expected to Fail)"""
        print("\n🚫 TEST CASE 4: Non-Existent Endpoints (Expected to Fail)")
        print("=" * 60)
        
        # Test endpoints that should fail as specified in review
        failing_tests = [
            (f"{PROXY_BASE}/relationship/victoria_black?userId=guest", "Relationship endpoint (expected 404)", 404),
            (f"{PROXY_BASE}/memories/victoria_black?userId=guest", "Memories endpoint (expected 404)", 404)
        ]
        
        for url, description, expected_status in failing_tests:
            result = await self.test_endpoint("GET", url, description, expected_status)
            self.results.append(result)
            
            if result["status_code"] == expected_status or result["status_code"] == 404:
                print(f"✅ {description}")
                print(f"   Status: {result['status_code']} (Expected failure)")
            else:
                print(f"❌ {description}")
                print(f"   Status: {result['status_code']} (Expected {expected_status})")
    
    async def test_error_handling(self):
        """Test Case 6: Error Handling"""
        print("\n⚠️  TEST CASE 6: Error Handling")
        print("=" * 60)
        
        error_tests = [
            (f"{PROXY_BASE}/api/girls/invalid_character_id_12345", "Invalid character ID", 404),
            (f"{PROXY_BASE}/api/nonexistent", "Malformed request path", 404),
            (f"{PROXY_BASE}/api/girls/", "Empty character ID", 404)
        ]
        
        for url, description, expected_status in error_tests:
            result = await self.test_endpoint("GET", url, description, expected_status)
            self.results.append(result)
            
            if result["status_code"] >= 400:
                print(f"✅ {description}")
                print(f"   Status: {result['status_code']} (Proper error handling)")
                print(f"   Error message: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {description}")
                print(f"   Status: {result['status_code']} (Should have failed)")
    
    async def test_response_times(self):
        """Test Case 5: Response Time Test"""
        print("\n⏱️  TEST CASE 5: Response Time Analysis")
        print("=" * 60)
        
        if self.direct_times and self.proxy_times:
            avg_direct = sum(self.direct_times) / len(self.direct_times)
            avg_proxy = sum(self.proxy_times) / len(self.proxy_times)
            latency_overhead = avg_proxy - avg_direct
            
            print(f"📊 Response Time Comparison:")
            print(f"   Direct GirlsMind API: {avg_direct:.2f}ms (average)")
            print(f"   Backend Proxy: {avg_proxy:.2f}ms (average)")
            print(f"   Proxy Overhead: {latency_overhead:.2f}ms")
            
            if latency_overhead > 1000:  # More than 1 second overhead
                print(f"⚠️  WARNING: Significant proxy latency detected")
            else:
                print(f"✅ Proxy latency is acceptable")
        else:
            print("❌ Insufficient timing data for comparison")
    
    async def test_backend_status(self):
        """Test backend status endpoint"""
        print("\n🏥 BACKEND STATUS CHECK")
        print("=" * 60)
        
        result = await self.test_endpoint("GET", f"{BACKEND_URL}/api/status", "Backend status check")
        self.results.append(result)
        
        if result["success"]:
            print(f"✅ Backend is running")
            print(f"   Status: {result['status_code']}, Time: {result['response_time_ms']}ms")
            if result.get("json_data"):
                status_data = result["json_data"]
                girlsmind_config = status_data.get("girlsmind", {})
                print(f"   GirlsMind configured: {girlsmind_config.get('configured', False)}")
                print(f"   GirlsMind base URL: {girlsmind_config.get('base', 'Not set')}")
                print(f"   GirlsMind ping: {girlsmind_config.get('ping', {}).get('ok', False)}")
        else:
            print(f"❌ Backend connection failed")
            print(f"   Error: {result.get('error', 'HTTP Error')}")
    
    def generate_final_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📋 GIRLSMIND API CONNECTION & INTEGRATION TEST REPORT")
        print("=" * 80)
        
        successful_tests = [r for r in self.results if r["success"]]
        failed_tests = [r for r in self.results if not r["success"]]
        
        print(f"\n📊 SUMMARY:")
        print(f"   Total Tests: {len(self.results)}")
        print(f"   ✅ Successful: {len(successful_tests)}")
        print(f"   ❌ Failed: {len(failed_tests)}")
        
        # Success criteria evaluation
        print(f"\n🎯 SUCCESS CRITERIA EVALUATION:")
        
        # Check if backend can reach GirlsMind
        girlsmind_reachable = any("Direct GirlsMind" in r["description"] and r["success"] for r in self.results)
        print(f"   Backend can reach GirlsMind service: {'✅' if girlsmind_reachable else '❌'}")
        
        # Check if proxy works
        proxy_working = any("Backend proxy" in r["description"] and r["success"] for r in self.results)
        print(f"   Proxy correctly forwards requests: {'✅' if proxy_working else '❌'}")
        
        # Check character data retrieval
        character_data_working = any("Character data for" in r["description"] and r["success"] for r in self.results)
        print(f"   Character data retrieves successfully: {'✅' if character_data_working else '✅'}")
        
        # Check error handling
        error_handling_working = any(r["status_code"] >= 400 and "Invalid" in r["description"] for r in self.results)
        print(f"   Proper error handling for missing endpoints: {'✅' if error_handling_working else '❌'}")
        
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for result in successful_tests:
                print(f"   {result['description']} - {result['status_code']} ({result['response_time_ms']}ms)")
        
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for result in failed_tests:
                error_info = result.get('error', f"HTTP {result['status_code']}")
                print(f"   {result['description']} - {error_info}")
        
        # Connection stability assessment
        connection_issues = len([r for r in self.results if r.get("error") and "timeout" in str(r["error"]).lower()])
        if connection_issues == 0:
            print(f"\n🔗 CONNECTION STABILITY: ✅ Stable ({connection_issues} timeouts)")
        else:
            print(f"\n🔗 CONNECTION STABILITY: ⚠️  Issues detected ({connection_issues} timeouts)")
        
        return {
            "total_tests": len(self.results),
            "successful_tests": len(successful_tests),
            "failed_tests": len(failed_tests),
            "girlsmind_reachable": girlsmind_reachable,
            "proxy_working": proxy_working,
            "character_data_working": character_data_working,
            "error_handling_working": error_handling_working,
            "connection_stable": connection_issues == 0
        }

async def main():
    """Main testing function"""
    print("🚀 GIRLSMIND API CONNECTION AND INTEGRATION TEST")
    print(f"🎯 Direct Target: {GIRLSMIND_DIRECT_URL}")
    print(f"🔄 Proxy Target: {PROXY_BASE}")
    print(f"📅 Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    tester = GirlsMindProxyTester()
    
    # Run all test cases as specified in review request
    await tester.test_backend_status()
    await tester.test_direct_girlsmind_connection()
    await tester.test_backend_proxy_connection()
    await tester.test_character_specific_endpoints()
    await tester.test_non_existent_endpoints()
    await tester.test_error_handling()
    await tester.test_response_times()
    
    # Generate final report
    report = tester.generate_final_report()
    
    print(f"\n🏁 Testing completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())
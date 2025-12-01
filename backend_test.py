#!/usr/bin/env python3
"""
GirlsMind API Discovery and Testing Script
Tests the Memory & Relationship Management System at https://girlsmind-1.emergent.host
"""

import asyncio
import httpx
import json
from typing import Dict, List, Any, Optional
import time

# Base URL for GirlsMind API
BASE_URL = "https://girlsmind-1.emergent.host"

# Known Character UUIDs from the review request
KNOWN_CHARACTERS = {
    "Victoria Black": "59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
    "Wargirl": "e1e0650c-3888-4af5-9858-479280d3fca1", 
    "Binary": "e4c92345-8b86-4837-8c3d-6a4632c65f62"
}

# Character name variations to test
CHARACTER_VARIATIONS = [
    "victoria_black",
    "Victoria Black", 
    "59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
    "wargirl",
    "Wargirl",
    "e1e0650c-3888-4af5-9858-479280d3fca1",
    "binary",
    "Binary",
    "e4c92345-8b86-4837-8c3d-6a4632c65f62"
]

# API endpoints to test based on review request
API_ENDPOINTS = [
    # With /api prefix
    "/api/relationship",
    "/api/memories", 
    "/api/store_exchange",
    "/api/girls",
    "/api/characters",
    "/api/users",
    "/api/stats",
    "/api/dashboard",
    # Without /api prefix
    "/relationship",
    "/memories",
    "/store_exchange", 
    "/girls",
    "/characters",
    "/users",
    "/stats",
    "/dashboard"
]

# Query parameters to test
QUERY_PARAMS = [
    {"userId": "guest"},
    {"user": "guest"},
    {"limit": "10"},
    {"characterId": "59ab0b0b-c78a-4f25-8983-6a5ed3482b35"},
    {}  # No params
]

class APITester:
    def __init__(self):
        self.results = []
        self.working_endpoints = []
        self.failed_endpoints = []
        
    async def test_endpoint(self, method: str, url: str, params: Optional[Dict] = None, 
                          headers: Optional[Dict] = None, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Test a single API endpoint"""
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
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
                    "response_preview": ""
                }
                
                # Try to get response preview
                try:
                    if "application/json" in result["content_type"]:
                        json_data = response.json()
                        result["response_preview"] = json.dumps(json_data, indent=2)[:500]
                    else:
                        result["response_preview"] = response.text[:500]
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
                "response_preview": f"Error: {str(e)}"
            }
    
    async def discover_endpoints(self):
        """Discover available API endpoints"""
        print("🔍 DISCOVERING API ENDPOINTS...")
        print("=" * 60)
        
        # Test basic endpoints
        for endpoint in API_ENDPOINTS:
            url = f"{BASE_URL}{endpoint}"
            result = await self.test_endpoint("GET", url)
            self.results.append(result)
            
            if result["success"]:
                self.working_endpoints.append(endpoint)
                print(f"✅ {endpoint} - Status: {result['status_code']}")
                if result["response_preview"]:
                    print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                self.failed_endpoints.append(endpoint)
                print(f"❌ {endpoint} - Status: {result['status_code']} - {result.get('error', 'Failed')}")
        
        print(f"\n📊 Discovery Summary: {len(self.working_endpoints)} working, {len(self.failed_endpoints)} failed")
    
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
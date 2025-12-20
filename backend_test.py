#!/usr/bin/env python3
"""
Pairs Mode Image Generation Testing Script
Tests the newly implemented 3-step Pairs Mode image generation in the Dressing Room feature
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
BACKEND_URL = 'https://outfit-generator-18.preview.emergentagent.com'  # Default
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BACKEND_URL = line.split('=', 1)[1].strip()
                break
except FileNotFoundError:
    pass

# Pairs Mode Test Configuration
PAIRS_MODE_ENDPOINT = "/api/dressing-room/generate"

# Available base images for testing (from review request)
AVAILABLE_BASE_IMAGES = ["binary", "vanessa", "victoria_black", "wargirl", "harmony", "evil_victoria", "veronica"]

# Test scenarios for Pairs Mode
PAIRS_TEST_SCENARIOS = [
    {
        "name": "Binary + Vanessa - Sitting in bed",
        "character_id": "binary",
        "character_name": "Binary",
        "character_description": "digital goddess",
        "outfit_description": "sitting in bed waving happily",
        "second_character_id": "vanessa",
        "second_character_name": "Vanessa",
        "is_pairs_mode": True
    },
    {
        "name": "Wargirl + Victoria Black - Dancing",
        "character_id": "wargirl",
        "character_name": "Wargirl",
        "character_description": "warrior princess",
        "outfit_description": "dancing together at a party",
        "second_character_id": "victoria_black",
        "second_character_name": "Victoria Black",
        "is_pairs_mode": True
    }
]

# Single character test for comparison
SINGLE_CHARACTER_TEST = {
    "character_id": "binary",
    "character_name": "Binary",
    "character_description": "digital goddess",
    "outfit_description": "casual outfit for a day out"
}

class PairsModeImageTester:
class PairsModeImageTester:
    def __init__(self):
        self.results = []
        self.test_summary = {
            "backend_connectivity": False,
            "pairs_binary_vanessa_working": False,
            "pairs_wargirl_victoria_working": False,
            "pairs_activity_prompts_working": False,
            "error_handling_missing_base": False,
            "single_character_still_works": False,
            "pairs_response_format_correct": False,
            "generation_method_correct": False,
            "image_size_adequate": False
        }
        self.issues_found = []
        self.generation_times = []
        
    async def test_endpoint(self, method: str, url: str, params: Optional[Dict] = None, 
                          headers: Optional[Dict] = None, data: Optional[Dict] = None, timeout: int = 120) -> Dict[str, Any]:
        """Test a single API endpoint with extended timeout for image generation"""
        start_time = time.time()
        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                if method.upper() == "GET":
                    response = await client.get(url, params=params, headers=headers)
                elif method.upper() == "POST":
                    response = await client.post(url, params=params, headers=headers, json=data)
                else:
                    response = await client.request(method, url, params=params, headers=headers, json=data)
                
                end_time = time.time()
                duration = end_time - start_time
                
                result = {
                    "method": method,
                    "url": url,
                    "params": params,
                    "data": data,
                    "status_code": response.status_code,
                    "success": response.status_code < 400,
                    "response_size": len(response.content),
                    "content_type": response.headers.get("content-type", ""),
                    "response_preview": "",
                    "full_response": None,
                    "duration": duration
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
            end_time = time.time()
            duration = end_time - start_time
            return {
                "method": method,
                "url": url, 
                "params": params,
                "data": data,
                "status_code": 0,
                "success": False,
                "error": str(e),
                "response_preview": f"Error: {str(e)}",
                "full_response": None,
                "duration": duration
            }
    
    async def test_backend_connectivity(self):
        """Test basic backend connectivity"""
        print("🔗 TESTING BACKEND CONNECTIVITY...")
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
                print(f"✅ {endpoint} - Status: {result['status_code']} ({result['duration']:.2f}s)")
                if result["response_preview"]:
                    print(f"   Preview: {result['response_preview'][:100]}...")
            else:
                print(f"❌ {endpoint} - Status: {result['status_code']} ({result['duration']:.2f}s)")
                connectivity_working = False
                self.issues_found.append(f"Backend endpoint {endpoint} failed: {result.get('error', 'Unknown error')}")
        
        if connectivity_working:
            self.test_summary["backend_connectivity"] = True
            print("✅ Backend connectivity confirmed")
        else:
            print("❌ Backend connectivity issues detected")
    
    async def test_pairs_mode_binary_vanessa(self):
        """Test Pairs Mode Generation with Binary + Vanessa"""
        print("\n👥 TESTING PAIRS MODE: BINARY + VANESSA...")
        print("=" * 60)
        
        scenario = PAIRS_TEST_SCENARIOS[0]  # Binary + Vanessa
        url = f"{BACKEND_URL}{PAIRS_MODE_ENDPOINT}"
        
        print(f"Testing POST {url}")
        print(f"Scenario: {scenario['name']}")
        print(f"Characters: {scenario['character_name']} + {scenario['second_character_name']}")
        print(f"Activity: {scenario['outfit_description']}")
        
        start_time = time.time()
        result = await self.test_endpoint("POST", url, data=scenario, timeout=120)
        end_time = time.time()
        generation_time = end_time - start_time
        
        self.results.append(result)
        self.generation_times.append(("Binary + Vanessa", generation_time))
        
        if result["success"]:
            print(f"✅ Pairs mode generation successful - Status: {result['status_code']} ({generation_time:.1f}s)")
            
            if result["full_response"]:
                response = result["full_response"]
                
                # Check required fields
                required_fields = ["success", "image_base64", "generation_method"]
                missing_fields = [field for field in required_fields if field not in response]
                
                if not missing_fields:
                    print(f"✅ Response has all required fields: {required_fields}")
                    
                    # Check success flag
                    if response.get("success") == True:
                        print(f"✅ Generation marked as successful")
                        
                        # Check generation method
                        if response.get("generation_method") == "individual_then_blend":
                            print(f"✅ Generation method correct: individual_then_blend")
                            self.test_summary["generation_method_correct"] = True
                        else:
                            print(f"❌ Generation method incorrect: {response.get('generation_method')}")
                            self.issues_found.append(f"Generation method should be 'individual_then_blend', got: {response.get('generation_method')}")
                        
                        # Check image_base64 length (should be substantial for a real image)
                        image_b64 = response.get("image_base64", "")
                        if len(image_b64) > 1000000:  # > 1MB base64 indicates real image
                            print(f"✅ Image base64 length adequate: {len(image_b64):,} characters")
                            self.test_summary["image_size_adequate"] = True
                        else:
                            print(f"⚠️ Image base64 length may be too small: {len(image_b64):,} characters")
                            self.issues_found.append(f"Image base64 length seems small: {len(image_b64):,} characters")
                        
                        # Check is_pairs flag
                        if response.get("is_pairs") == True:
                            print(f"✅ Response correctly marked as pairs mode")
                            self.test_summary["pairs_response_format_correct"] = True
                        else:
                            print(f"⚠️ Response not marked as pairs mode")
                            self.issues_found.append("Response missing is_pairs=true flag")
                        
                        self.test_summary["pairs_binary_vanessa_working"] = True
                        
                    else:
                        print(f"❌ Generation marked as failed: {response.get('success')}")
                        self.issues_found.append("Pairs generation returned success=false")
                else:
                    print(f"❌ Missing required fields: {missing_fields}")
                    self.issues_found.append(f"Pairs response missing fields: {missing_fields}")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Pairs generation returned no data")
        else:
            print(f"❌ Pairs mode generation failed - Status: {result['status_code']} ({generation_time:.1f}s)")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Binary + Vanessa pairs generation failed: {error_msg}")
    
    async def test_pairs_mode_wargirl_victoria(self):
        """Test Pairs Mode with different characters (Wargirl + Victoria Black)"""
        print("\n👥 TESTING PAIRS MODE: WARGIRL + VICTORIA BLACK...")
        print("=" * 60)
        
        scenario = PAIRS_TEST_SCENARIOS[1]  # Wargirl + Victoria Black
        url = f"{BACKEND_URL}{PAIRS_MODE_ENDPOINT}"
        
        print(f"Testing POST {url}")
        print(f"Scenario: {scenario['name']}")
        print(f"Characters: {scenario['character_name']} + {scenario['second_character_name']}")
        print(f"Activity: {scenario['outfit_description']}")
        
        start_time = time.time()
        result = await self.test_endpoint("POST", url, data=scenario, timeout=120)
        end_time = time.time()
        generation_time = end_time - start_time
        
        self.results.append(result)
        self.generation_times.append(("Wargirl + Victoria Black", generation_time))
        
        if result["success"]:
            print(f"✅ Pairs mode generation successful - Status: {result['status_code']} ({generation_time:.1f}s)")
            
            if result["full_response"]:
                response = result["full_response"]
                
                # Check key indicators
                if response.get("success") == True and response.get("generation_method") == "individual_then_blend":
                    print(f"✅ Wargirl + Victoria Black generation working correctly")
                    self.test_summary["pairs_wargirl_victoria_working"] = True
                else:
                    print(f"❌ Wargirl + Victoria Black generation has issues")
                    self.issues_found.append("Wargirl + Victoria Black pairs generation not working correctly")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Wargirl + Victoria Black pairs generation returned no data")
        else:
            print(f"❌ Pairs mode generation failed - Status: {result['status_code']} ({generation_time:.1f}s)")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Wargirl + Victoria Black pairs generation failed: {error_msg}")
    
    async def test_pairs_mode_activity_prompts(self):
        """Test Pairs Mode with activity prompts"""
        print("\n🎭 TESTING PAIRS MODE: ACTIVITY PROMPTS...")
        print("=" * 60)
        
        # Test with a specific activity prompt
        activity_test = {
            "character_id": "binary",
            "character_name": "Binary",
            "character_description": "digital goddess",
            "outfit_description": "dancing together at a party",
            "second_character_id": "vanessa",
            "second_character_name": "Vanessa",
            "is_pairs_mode": True
        }
        
        url = f"{BACKEND_URL}{PAIRS_MODE_ENDPOINT}"
        
        print(f"Testing activity prompt: '{activity_test['outfit_description']}'")
        
        start_time = time.time()
        result = await self.test_endpoint("POST", url, data=activity_test, timeout=120)
        end_time = time.time()
        generation_time = end_time - start_time
        
        self.results.append(result)
        self.generation_times.append(("Activity Prompts", generation_time))
        
        if result["success"]:
            print(f"✅ Activity prompt generation successful - Status: {result['status_code']} ({generation_time:.1f}s)")
            
            if result["full_response"]:
                response = result["full_response"]
                
                # Check that it's marked as pairs
                if response.get("is_pairs") == True:
                    print(f"✅ Activity prompt correctly generates pairs mode")
                    self.test_summary["pairs_activity_prompts_working"] = True
                else:
                    print(f"❌ Activity prompt not generating pairs mode correctly")
                    self.issues_found.append("Activity prompts not working in pairs mode")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Activity prompt pairs generation returned no data")
        else:
            print(f"❌ Activity prompt generation failed - Status: {result['status_code']} ({generation_time:.1f}s)")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Activity prompt pairs generation failed: {error_msg}")
    
    async def test_error_handling_missing_base(self):
        """Test error handling - missing base image"""
        print("\n🚨 TESTING ERROR HANDLING: MISSING BASE IMAGE...")
        print("=" * 60)
        
        # Test with a character that doesn't have a base image
        missing_base_test = {
            "character_id": "nonexistent",
            "character_name": "Nonexistent",
            "character_description": "test character",
            "outfit_description": "casual outfit",
            "second_character_id": "binary",
            "second_character_name": "Binary",
            "is_pairs_mode": True
        }
        
        url = f"{BACKEND_URL}{PAIRS_MODE_ENDPOINT}"
        
        print(f"Testing with nonexistent character: {missing_base_test['character_id']}")
        
        result = await self.test_endpoint("POST", url, data=missing_base_test, timeout=30)
        self.results.append(result)
        
        # Should return 400 error
        if result["status_code"] == 400:
            print(f"✅ Missing base image handled correctly - Status: {result['status_code']}")
            
            if result["full_response"] and "detail" in result["full_response"]:
                error_msg = result["full_response"]["detail"]
                if "base image" in error_msg.lower():
                    print(f"✅ Error message mentions base image: {error_msg}")
                    self.test_summary["error_handling_missing_base"] = True
                else:
                    print(f"⚠️ Error message unclear: {error_msg}")
                    self.issues_found.append(f"Error message for missing base image unclear: {error_msg}")
            else:
                print(f"⚠️ No error message in response")
                self.issues_found.append("Missing base image error has no clear message")
        else:
            print(f"❌ Missing base image not handled correctly - Status: {result['status_code']}")
            self.issues_found.append(f"Missing base image should return 400, got: {result['status_code']}")
    
    async def test_single_character_mode(self):
        """Test single character mode still works"""
        print("\n👤 TESTING SINGLE CHARACTER MODE...")
        print("=" * 60)
        
        single_test = SINGLE_CHARACTER_TEST.copy()
        # Don't include is_pairs_mode flag to test single character mode
        
        url = f"{BACKEND_URL}{PAIRS_MODE_ENDPOINT}"
        
        print(f"Testing single character: {single_test['character_name']}")
        print(f"Outfit: {single_test['outfit_description']}")
        
        start_time = time.time()
        result = await self.test_endpoint("POST", url, data=single_test, timeout=120)
        end_time = time.time()
        generation_time = end_time - start_time
        
        self.results.append(result)
        self.generation_times.append(("Single Character", generation_time))
        
        if result["success"]:
            print(f"✅ Single character generation successful - Status: {result['status_code']} ({generation_time:.1f}s)")
            
            if result["full_response"]:
                response = result["full_response"]
                
                # Should NOT be marked as pairs
                if response.get("is_pairs") != True and response.get("success") == True:
                    print(f"✅ Single character mode working correctly")
                    self.test_summary["single_character_still_works"] = True
                else:
                    print(f"❌ Single character mode has issues")
                    self.issues_found.append("Single character mode not working correctly")
            else:
                print(f"❌ No response data received")
                self.issues_found.append("Single character generation returned no data")
        else:
            print(f"❌ Single character generation failed - Status: {result['status_code']} ({generation_time:.1f}s)")
            error_msg = result.get('error', 'Unknown error')
            self.issues_found.append(f"Single character generation failed: {error_msg}")
    
    def generate_report(self):
        """Generate comprehensive Pairs Mode test report"""
        print("\n" + "=" * 80)
        print("📋 PAIRS MODE IMAGE GENERATION TEST REPORT")
        print("=" * 80)
        
        working_results = [r for r in self.results if r["success"]]
        failed_results = [r for r in self.results if not r["success"]]
        
        print(f"\n📊 API TEST SUMMARY:")
        print(f"   Total API Tests: {len(self.results)}")
        print(f"   ✅ Working: {len(working_results)}")
        print(f"   ❌ Failed: {len(failed_results)}")
        
        print(f"\n🎯 PAIRS MODE FUNCTIONALITY VERIFICATION:")
        print(f"   ✅ Backend Connectivity: {'PASS' if self.test_summary['backend_connectivity'] else 'FAIL'}")
        print(f"   ✅ Binary + Vanessa Generation: {'PASS' if self.test_summary['pairs_binary_vanessa_working'] else 'FAIL'}")
        print(f"   ✅ Wargirl + Victoria Black Generation: {'PASS' if self.test_summary['pairs_wargirl_victoria_working'] else 'FAIL'}")
        print(f"   ✅ Activity Prompts Working: {'PASS' if self.test_summary['pairs_activity_prompts_working'] else 'FAIL'}")
        print(f"   ✅ Error Handling (Missing Base): {'PASS' if self.test_summary['error_handling_missing_base'] else 'FAIL'}")
        print(f"   ✅ Single Character Mode: {'PASS' if self.test_summary['single_character_still_works'] else 'FAIL'}")
        print(f"   ✅ Response Format Correct: {'PASS' if self.test_summary['pairs_response_format_correct'] else 'FAIL'}")
        print(f"   ✅ Generation Method Correct: {'PASS' if self.test_summary['generation_method_correct'] else 'FAIL'}")
        print(f"   ✅ Image Size Adequate: {'PASS' if self.test_summary['image_size_adequate'] else 'FAIL'}")
        
        # Generation timing analysis
        if self.generation_times:
            print(f"\n⏱️ GENERATION TIMING ANALYSIS:")
            for test_name, duration in self.generation_times:
                status = "✅ GOOD" if 30 <= duration <= 90 else "⚠️ SLOW" if duration > 90 else "⚠️ FAST"
                print(f"   {test_name}: {duration:.1f}s {status}")
            
            avg_time = sum(t[1] for t in self.generation_times) / len(self.generation_times)
            print(f"   Average Generation Time: {avg_time:.1f}s")
        
        # Calculate overall success
        critical_tests = [
            'backend_connectivity', 'pairs_binary_vanessa_working', 'pairs_wargirl_victoria_working',
            'pairs_activity_prompts_working', 'error_handling_missing_base', 'single_character_still_works',
            'generation_method_correct'
        ]
        critical_passed = all(self.test_summary.get(test, False) for test in critical_tests)
        
        print(f"\n🏆 OVERALL RESULT: {'✅ ALL CRITICAL TESTS PASSED' if critical_passed else '❌ CRITICAL TESTS FAILED'}")
        
        if self.issues_found:
            print(f"\n❌ ISSUES FOUND ({len(self.issues_found)}):")
            for i, issue in enumerate(self.issues_found, 1):
                print(f"   {i}. {issue}")
        
        if working_results:
            print(f"\n✅ WORKING API ENDPOINTS ({len(working_results)}):")
            for result in working_results:
                duration_str = f" ({result['duration']:.1f}s)" if 'duration' in result else ""
                print(f"   {result['method']} {result['url']} - Status: {result['status_code']}{duration_str}")
        
        if failed_results:
            print(f"\n❌ FAILED API ENDPOINTS ({len(failed_results)}):")
            for result in failed_results:
                error_info = result.get('error', f"HTTP {result['status_code']}")
                duration_str = f" ({result['duration']:.1f}s)" if 'duration' in result else ""
                print(f"   {result['method']} {result['url']} - {error_info}{duration_str}")
        
        return {
            "total_tests": len(self.results),
            "working_count": len(working_results),
            "failed_count": len(failed_results),
            "test_summary": self.test_summary,
            "issues_found": self.issues_found,
            "critical_tests_passed": critical_passed,
            "generation_times": self.generation_times
        }
async def main():
    """Main Pairs Mode testing function"""
    print("🚀 PAIRS MODE IMAGE GENERATION COMPREHENSIVE TESTING")
    print(f"🎯 Backend URL: {BACKEND_URL}")
    print(f"📅 Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    tester = PairsModeImageTester()
    
    # Run all test phases
    await tester.test_backend_connectivity()
    await tester.test_pairs_mode_binary_vanessa()
    await tester.test_pairs_mode_wargirl_victoria()
    await tester.test_pairs_mode_activity_prompts()
    await tester.test_error_handling_missing_base()
    await tester.test_single_character_mode()
    
    # Generate final report
    report = tester.generate_report()
    
    print(f"\n🏁 Testing completed at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    return report

if __name__ == "__main__":
    asyncio.run(main())
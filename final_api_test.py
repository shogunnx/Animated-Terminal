#!/usr/bin/env python3
"""
Final comprehensive API testing for GirlsMind
Testing all discovered patterns and looking for more JSON endpoints
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "https://girlsmind-1.emergent.host"

async def comprehensive_api_test():
    """Comprehensive test of all API possibilities"""
    
    print("🚀 COMPREHENSIVE GIRLSMIND API TEST")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        
        # Test all potential JSON API endpoints
        print("\n🔍 TESTING FOR JSON API ENDPOINTS:")
        print("-" * 50)
        
        json_endpoints = [
            "/api",
            "/api/",
            "/api/girls",
            "/api/girls/",
            "/api/characters",
            "/api/characters/",
            "/api/users",
            "/api/users/",
            "/api/memories", 
            "/api/memories/",
            "/api/relationship",
            "/api/relationship/",
            "/api/store_exchange",
            "/api/store_exchange/",
            "/api/stats",
            "/api/stats/",
            "/api/dashboard",
            "/api/dashboard/"
        ]
        
        headers = {"Accept": "application/json"}
        working_json_endpoints = []
        
        for endpoint in json_endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                content_type = response.headers.get('content-type', '')
                
                if response.status_code == 200 and 'application/json' in content_type:
                    try:
                        data = response.json()
                        working_json_endpoints.append(endpoint)
                        print(f"✅ {endpoint}: JSON API found!")
                        print(f"   Data preview: {json.dumps(data, indent=2)[:300]}...")
                        print()
                    except:
                        print(f"⚠️  {endpoint}: Status 200, claims JSON but invalid")
                elif response.status_code == 200:
                    print(f"📄 {endpoint}: Status 200, Content-Type: {content_type}")
                else:
                    print(f"❌ {endpoint}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")
        
        # Test character-specific JSON endpoints
        print(f"\n👥 TESTING CHARACTER-SPECIFIC JSON ENDPOINTS:")
        print("-" * 50)
        
        characters = ["victoria_black", "wargirl", "binary", "59ab0b0b-c78a-4f25-8983-6a5ed3482b35"]
        
        character_json_patterns = [
            "/api/girls/{char}",
            "/api/girls/{char}/",
            "/api/characters/{char}",
            "/api/characters/{char}/",
            "/api/memories/{char}",
            "/api/memories/{char}/",
            "/api/relationship/{char}",
            "/api/relationship/{char}/",
            "/api/users/{char}",
            "/api/users/{char}/"
        ]
        
        for pattern in character_json_patterns:
            for char in characters[:2]:  # Test with first 2 characters
                endpoint = pattern.format(char=char)
                try:
                    response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                    content_type = response.headers.get('content-type', '')
                    
                    if response.status_code == 200 and 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"✅ {endpoint}: JSON API found!")
                            print(f"   Data preview: {json.dumps(data, indent=2)[:200]}...")
                        except:
                            print(f"⚠️  {endpoint}: Status 200, claims JSON but invalid")
                    elif response.status_code == 200:
                        print(f"📄 {endpoint}: Status 200, Content-Type: {content_type}")
                    else:
                        print(f"❌ {endpoint}: Status {response.status_code}")
                        
                except Exception as e:
                    print(f"❌ {endpoint}: Error - {e}")
        
        # Test POST endpoints for data storage
        print(f"\n📝 TESTING POST ENDPOINTS FOR DATA STORAGE:")
        print("-" * 50)
        
        post_endpoints = [
            "/api/memories",
            "/api/memories/",
            "/api/relationship", 
            "/api/relationship/",
            "/api/store_exchange",
            "/api/store_exchange/",
            "/api/users",
            "/api/users/"
        ]
        
        # Sample data for POST requests
        sample_data = {
            "userId": "guest",
            "characterId": "victoria_black",
            "message": "Test API discovery message",
            "timestamp": "2024-12-01T09:00:00Z",
            "type": "conversation"
        }
        
        post_headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        for endpoint in post_endpoints:
            try:
                response = await client.post(f"{BASE_URL}{endpoint}", 
                                           headers=post_headers, 
                                           json=sample_data)
                
                content_type = response.headers.get('content-type', '')
                
                if response.status_code < 400:
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"✅ POST {endpoint}: Success! JSON response")
                            print(f"   Response: {json.dumps(data, indent=2)}")
                        except:
                            print(f"✅ POST {endpoint}: Success but invalid JSON")
                    else:
                        print(f"✅ POST {endpoint}: Success, Content-Type: {content_type}")
                        print(f"   Response: {response.text[:200]}...")
                else:
                    print(f"❌ POST {endpoint}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ POST {endpoint}: Error - {e}")
        
        # Test with different HTTP methods
        print(f"\n🔧 TESTING DIFFERENT HTTP METHODS:")
        print("-" * 50)
        
        methods_to_test = ["PUT", "PATCH", "DELETE"]
        test_endpoint = "/api/memories/victoria_black"
        
        for method in methods_to_test:
            try:
                response = await client.request(method, f"{BASE_URL}{test_endpoint}", 
                                              headers=post_headers, 
                                              json=sample_data)
                
                print(f"{method} {test_endpoint}: Status {response.status_code}")
                if response.status_code < 400:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"   JSON Response: {json.dumps(data, indent=2)[:200]}...")
                        except:
                            print(f"   Invalid JSON response")
                    else:
                        print(f"   Content-Type: {content_type}")
                        
            except Exception as e:
                print(f"{method} {test_endpoint}: Error - {e}")
        
        # Summary of findings
        print(f"\n📊 FINAL SUMMARY:")
        print("=" * 80)
        print(f"✅ Working JSON API Endpoints Found: {len(working_json_endpoints)}")
        for endpoint in working_json_endpoints:
            print(f"   - {endpoint}")
        
        # Test the main working endpoint with different parameters
        if working_json_endpoints:
            main_endpoint = working_json_endpoints[0]
            print(f"\n🎯 DETAILED TESTING OF MAIN ENDPOINT: {main_endpoint}")
            print("-" * 50)
            
            # Test with various query parameters
            test_params = [
                {},
                {"userId": "guest"},
                {"user": "guest"}, 
                {"limit": "5"},
                {"limit": "10"},
                {"characterId": "victoria_black"},
                {"characterId": "59ab0b0b-c78a-4f25-8983-6a5ed3482b35"},
                {"format": "json"},
                {"include": "all"}
            ]
            
            for params in test_params:
                try:
                    response = await client.get(f"{BASE_URL}{main_endpoint}", 
                                              params=params, 
                                              headers=headers)
                    
                    if response.status_code == 200:
                        data = response.json()
                        param_str = str(params) if params else "no params"
                        print(f"✅ {main_endpoint} with {param_str}")
                        print(f"   Response size: {len(json.dumps(data))} chars")
                        if isinstance(data, list):
                            print(f"   Array length: {len(data)}")
                        elif isinstance(data, dict):
                            print(f"   Object keys: {list(data.keys())}")
                        
                except Exception as e:
                    print(f"❌ {main_endpoint} with {params}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(comprehensive_api_test())
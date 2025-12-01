#!/usr/bin/env python3
"""
Deep testing of the /api/girls endpoint
Testing all characters and looking for additional functionality
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "https://girlsmind-1.emergent.host"

async def deep_girls_api_test():
    """Deep test of the girls API endpoint"""
    
    print("🎭 DEEP TESTING OF /api/girls ENDPOINT")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        
        headers = {"Accept": "application/json"}
        
        # Get all girls data
        print("\n📋 GETTING ALL GIRLS DATA:")
        print("-" * 50)
        
        try:
            response = await client.get(f"{BASE_URL}/api/girls", headers=headers)
            if response.status_code == 200:
                girls_data = response.json()
                print(f"✅ Found {len(girls_data)} characters")
                print(f"Full response: {json.dumps(girls_data, indent=2)}")
                
                # Extract character IDs for further testing
                character_ids = [girl['id'] for girl in girls_data]
                print(f"\n📝 Character IDs found: {character_ids}")
                
        except Exception as e:
            print(f"❌ Error getting girls data: {e}")
            return
        
        # Test individual character endpoints
        print(f"\n👤 TESTING INDIVIDUAL CHARACTER ENDPOINTS:")
        print("-" * 50)
        
        for char_id in character_ids:
            try:
                response = await client.get(f"{BASE_URL}/api/girls/{char_id}", headers=headers)
                if response.status_code == 200:
                    char_data = response.json()
                    print(f"✅ {char_id}: {char_data['display_name']}")
                    print(f"   Description: {char_data['description'][:100]}...")
                    print(f"   Memory capacity: {char_data['memory_capacity_tokens']}")
                    print(f"   Used tokens: {char_data['used_tokens_estimate']}")
                    print(f"   Active systems: {char_data['active_systems']}")
                    print()
                else:
                    print(f"❌ {char_id}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {char_id}: Error - {e}")
        
        # Test with query parameters on girls endpoint
        print(f"\n🔧 TESTING /api/girls WITH QUERY PARAMETERS:")
        print("-" * 50)
        
        test_params = [
            {"limit": "3"},
            {"limit": "1"},
            {"userId": "guest"},
            {"user": "guest"},
            {"characterId": "victoria_black"},
            {"characterId": "wargirl"},
            {"format": "json"},
            {"include": "memories"},
            {"include": "relationships"},
            {"include": "stats"},
            {"active": "true"},
            {"status": "online"}
        ]
        
        for params in test_params:
            try:
                response = await client.get(f"{BASE_URL}/api/girls", 
                                          params=params, 
                                          headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    param_str = str(params)
                    print(f"✅ /api/girls with {param_str}")
                    
                    if isinstance(data, list):
                        print(f"   Returned {len(data)} characters")
                        if len(data) > 0:
                            print(f"   First character: {data[0].get('display_name', 'Unknown')}")
                    else:
                        print(f"   Response type: {type(data)}")
                        print(f"   Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                else:
                    print(f"❌ /api/girls with {params}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ /api/girls with {params}: Error - {e}")
        
        # Test POST to girls endpoint (for creating/updating)
        print(f"\n📝 TESTING POST TO /api/girls:")
        print("-" * 50)
        
        post_data_samples = [
            {
                "userId": "guest",
                "characterId": "victoria_black",
                "action": "interact"
            },
            {
                "userId": "guest", 
                "message": "Hello Victoria",
                "characterId": "victoria_black"
            },
            {
                "user": "guest",
                "character": "victoria_black",
                "type": "conversation"
            }
        ]
        
        post_headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        for i, post_data in enumerate(post_data_samples):
            try:
                response = await client.post(f"{BASE_URL}/api/girls", 
                                           headers=post_headers, 
                                           json=post_data)
                
                print(f"POST Sample {i+1}: Status {response.status_code}")
                if response.status_code < 400:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"   JSON Response: {json.dumps(data, indent=2)}")
                        except:
                            print(f"   Invalid JSON response")
                    else:
                        print(f"   Response: {response.text[:200]}...")
                        
            except Exception as e:
                print(f"POST Sample {i+1}: Error - {e}")
        
        # Test POST to individual character endpoints
        print(f"\n📝 TESTING POST TO INDIVIDUAL CHARACTER ENDPOINTS:")
        print("-" * 50)
        
        test_chars = ["victoria_black", "wargirl"]
        
        for char_id in test_chars:
            post_data = {
                "userId": "guest",
                "message": f"Hello {char_id}",
                "timestamp": "2024-12-01T09:00:00Z"
            }
            
            try:
                response = await client.post(f"{BASE_URL}/api/girls/{char_id}", 
                                           headers=post_headers, 
                                           json=post_data)
                
                print(f"POST /api/girls/{char_id}: Status {response.status_code}")
                if response.status_code < 400:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"   JSON Response: {json.dumps(data, indent=2)}")
                        except:
                            print(f"   Invalid JSON response")
                    else:
                        print(f"   Response: {response.text[:200]}...")
                        
            except Exception as e:
                print(f"POST /api/girls/{char_id}: Error - {e}")
        
        # Test other HTTP methods on girls endpoints
        print(f"\n🔧 TESTING OTHER HTTP METHODS:")
        print("-" * 50)
        
        methods = ["PUT", "PATCH", "DELETE"]
        test_endpoint = "/api/girls/victoria_black"
        
        for method in methods:
            try:
                response = await client.request(method, f"{BASE_URL}{test_endpoint}", 
                                              headers=post_headers, 
                                              json={"userId": "guest"})
                
                print(f"{method} {test_endpoint}: Status {response.status_code}")
                if response.status_code < 400:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"   JSON Response: {json.dumps(data, indent=2)[:200]}...")
                        except:
                            print(f"   Invalid JSON response")
                        
            except Exception as e:
                print(f"{method} {test_endpoint}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(deep_girls_api_test())
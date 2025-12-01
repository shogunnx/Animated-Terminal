#!/usr/bin/env python3
"""
Detailed API Investigation for GirlsMind
Following redirects and testing alternative patterns
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "https://girlsmind-1.emergent.host"

async def detailed_investigation():
    """Detailed investigation of API endpoints"""
    
    print("🔍 DETAILED API INVESTIGATION")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        
        # Test /api/girls with redirect following
        print("\n👥 Testing /api/girls with redirect following:")
        try:
            response = await client.get(f"{BASE_URL}/api/girls")
            print(f"Final URL: {response.url}")
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            if response.status_code == 200:
                if 'application/json' in response.headers.get('content-type', ''):
                    data = response.json()
                    print(f"JSON Response: {json.dumps(data, indent=2)}")
                else:
                    print(f"Response preview: {response.text[:300]}...")
        except Exception as e:
            print(f"Error: {e}")
        
        # Test alternative API patterns
        print(f"\n🎯 Testing alternative API patterns:")
        
        alternative_endpoints = [
            # Try different API versions
            "/v1/girls",
            "/v1/characters", 
            "/v1/relationship",
            "/v1/memories",
            # Try without version
            "/girls",
            "/characters",
            "/relationship", 
            "/memories",
            # Try with different prefixes
            "/data/girls",
            "/data/characters",
            "/service/girls",
            "/service/characters"
        ]
        
        headers = {"Accept": "application/json"}
        
        for endpoint in alternative_endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                content_type = response.headers.get('content-type', '')
                
                if response.status_code == 200:
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"✅ {endpoint}: JSON data found!")
                            print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
                        except:
                            print(f"✅ {endpoint}: Status 200 but not valid JSON")
                    else:
                        print(f"✅ {endpoint}: Status 200, Content-Type: {content_type}")
                else:
                    print(f"❌ {endpoint}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")
        
        # Test with query parameters on working endpoints
        print(f"\n🔧 Testing query parameters on working endpoints:")
        
        working_endpoints = ["/api", "/girls"]  # We know these work
        
        query_params = [
            {"format": "json"},
            {"output": "json"},
            {"type": "json"},
            {"api": "true"},
            {"userId": "guest"},
            {"user": "guest"},
            {"limit": "10"}
        ]
        
        for endpoint in working_endpoints:
            for params in query_params:
                try:
                    response = await client.get(f"{BASE_URL}{endpoint}", 
                                             params=params, 
                                             headers=headers)
                    
                    if response.status_code == 200:
                        content_type = response.headers.get('content-type', '')
                        if 'application/json' in content_type:
                            try:
                                data = response.json()
                                print(f"✅ {endpoint} with {params}: JSON found!")
                                print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
                            except:
                                print(f"✅ {endpoint} with {params}: 200 but invalid JSON")
                        
                except Exception as e:
                    print(f"❌ {endpoint} with {params}: Error - {e}")
        
        # Test character-specific patterns
        print(f"\n🎭 Testing character-specific patterns:")
        
        character_patterns = [
            "/girls/victoria_black",
            "/girls/59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
            "/characters/victoria_black", 
            "/characters/59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
            "/user/victoria_black/memories",
            "/user/victoria_black/relationship",
            "/character/victoria_black/memories",
            "/character/victoria_black/relationship"
        ]
        
        for pattern in character_patterns:
            try:
                response = await client.get(f"{BASE_URL}{pattern}", headers=headers)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        try:
                            data = response.json()
                            print(f"✅ {pattern}: JSON data found!")
                            print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
                        except:
                            print(f"✅ {pattern}: Status 200 but not valid JSON")
                    else:
                        print(f"✅ {pattern}: Status 200, Content-Type: {content_type}")
                else:
                    print(f"❌ {pattern}: Status {response.status_code}")
                    
            except Exception as e:
                print(f"❌ {pattern}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(detailed_investigation())
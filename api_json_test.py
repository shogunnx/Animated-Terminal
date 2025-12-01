#!/usr/bin/env python3
"""
Focused JSON API Testing for GirlsMind
Tests specifically for JSON API endpoints that return data
"""

import asyncio
import httpx
import json
from typing import Dict, Any

BASE_URL = "https://girlsmind-1.emergent.host"

async def test_json_endpoints():
    """Test endpoints that should return JSON data"""
    
    print("🔍 TESTING JSON API ENDPOINTS")
    print("=" * 60)
    
    # Test the main API endpoint that returned JSON
    async with httpx.AsyncClient(timeout=10.0) as client:
        
        # Test /api endpoint (we know this returns JSON)
        print("\n📋 Testing /api endpoint:")
        try:
            response = await client.get(f"{BASE_URL}/api")
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            if response.status_code == 200:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"Error: {e}")
        
        # Test /api/girls endpoint (we know this returns JSON)
        print("\n👥 Testing /api/girls endpoint:")
        try:
            response = await client.get(f"{BASE_URL}/api/girls")
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            if response.status_code == 200:
                data = response.json()
                print(f"Number of girls: {len(data)}")
                print(f"Response: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"Error: {e}")
        
        # Test other potential API endpoints with Accept header
        api_endpoints = [
            "/api/relationship",
            "/api/memories", 
            "/api/store_exchange",
            "/api/characters",
            "/api/stats",
            "/api/dashboard"
        ]
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        print(f"\n🎯 Testing API endpoints with JSON headers:")
        for endpoint in api_endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                print(f"{endpoint}: Status {response.status_code}")
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        data = response.json()
                        print(f"  JSON Response: {json.dumps(data, indent=2)[:200]}...")
                    else:
                        print(f"  Content-Type: {content_type}")
            except Exception as e:
                print(f"{endpoint}: Error - {e}")
        
        # Test character-specific endpoints with JSON headers
        print(f"\n🎭 Testing character endpoints with JSON headers:")
        character_endpoints = [
            "/api/relationship/victoria_black",
            "/api/memories/victoria_black",
            "/api/relationship/59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
            "/api/memories/59ab0b0b-c78a-4f25-8983-6a5ed3482b35"
        ]
        
        for endpoint in character_endpoints:
            try:
                response = await client.get(f"{BASE_URL}{endpoint}", headers=headers)
                print(f"{endpoint}: Status {response.status_code}")
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        data = response.json()
                        print(f"  JSON Response: {json.dumps(data, indent=2)[:200]}...")
                    else:
                        print(f"  Content-Type: {content_type}")
            except Exception as e:
                print(f"{endpoint}: Error - {e}")
        
        # Test POST endpoints for storing data
        print(f"\n📝 Testing POST endpoints:")
        post_data = {
            "userId": "guest",
            "characterId": "59ab0b0b-c78a-4f25-8983-6a5ed3482b35",
            "message": "Test message for API discovery",
            "timestamp": "2024-12-01T09:00:00Z"
        }
        
        post_endpoints = [
            "/api/store_exchange",
            "/api/memories"
        ]
        
        for endpoint in post_endpoints:
            try:
                response = await client.post(f"{BASE_URL}{endpoint}", 
                                           headers=headers, 
                                           json=post_data)
                print(f"POST {endpoint}: Status {response.status_code}")
                if response.status_code < 400:
                    content_type = response.headers.get('content-type', '')
                    if 'application/json' in content_type:
                        data = response.json()
                        print(f"  JSON Response: {json.dumps(data, indent=2)}")
                    else:
                        print(f"  Response: {response.text[:200]}...")
            except Exception as e:
                print(f"POST {endpoint}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(test_json_endpoints())
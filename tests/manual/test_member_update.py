#!/usr/bin/env python3
"""Test which HTTP method works for member update API.

Usage:
  python tests/manual/test_member_update.py
"""
import requests

# 測試 API 端點
BASE_URL = "https://koala.osdp25w.xyz"
MEMBER_ID = 1

# 從瀏覽器取得有效的 token
TOKEN = input("請輸入你的 JWT token (從瀏覽器 localStorage 取得): ").strip()

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 測試資料
test_data = {
    "full_name": "Pony Member Real1",
    "email": "pony@real1.com",
    "phone": "+886912345679"
}

print(f"\n測試會員更新 API: /api/account/members/{MEMBER_ID}/")
print("=" * 60)

# 測試 PATCH 方法
print("\n1. 測試 PATCH 方法:")
try:
    response = requests.patch(
        f"{BASE_URL}/api/account/members/{MEMBER_ID}/",
        headers=headers,
        json=test_data,
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 405:
        print("   結果: ❌ Method Not Allowed")
    elif response.status_code == 200:
        print("   結果: ✅ 成功")
    else:
        print(f"   結果: ⚠️ {response.reason}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   錯誤: {e}")

# 測試 PUT 方法
print("\n2. 測試 PUT 方法:")
try:
    response = requests.put(
        f"{BASE_URL}/api/account/members/{MEMBER_ID}/",
        headers=headers,
        json=test_data,
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 405:
        print("   結果: ❌ Method Not Allowed")
    elif response.status_code == 200:
        print("   結果: ✅ 成功")
    else:
        print(f"   結果: ⚠️ {response.reason}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   錯誤: {e}")

# 測試 POST 方法
print("\n3. 測試 POST 方法:")
try:
    response = requests.post(
        f"{BASE_URL}/api/account/members/{MEMBER_ID}/",
        headers=headers,
        json=test_data,
        timeout=10
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 405:
        print("   結果: ❌ Method Not Allowed")
    elif response.status_code == 200:
        print("   結果: ✅ 成功")
    else:
        print(f"   結果: ⚠️ {response.reason}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   錯誤: {e}")

print("\n" + "=" * 60)
print("測試完成！")
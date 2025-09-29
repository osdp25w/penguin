#!/usr/bin/env python3
"""Test which HTTP method works for member update API.

Usage:
  python tests/manual/test_member_update_auto.py
"""
import requests
import json
import os
from cryptography.fernet import Fernet

BASE_URL = "https://koala.osdp25w.xyz"

# 登入資訊
EMAIL = "pony@real1.com"
PASSWORD = "2m8N625cvmf0"

# 從環境變數取得加密金鑰，或使用預設值
# 使用正確的 LOGIN_KEY (從 .env 檔案)
LOGIN_KEY = os.environ.get("KOALA_LOGIN_KEY", "HnMaD-8xfYG1CqyWk71DUrMICdB2kNfHsLS57TPoCZc=")

def login(email: str, password: str, login_key: str) -> tuple:
    """登入並取得 token 和 user ID"""
    print(f"\n登入中: {email}")
    print("=" * 60)

    # 加密密碼
    try:
        # 確保 key 是正確的格式
        if isinstance(login_key, str):
            key_bytes = login_key.encode()
        else:
            key_bytes = login_key
        fernet = Fernet(key_bytes)
        encrypted_password = fernet.encrypt(password.encode()).decode()
        print(f"密碼已加密: {encrypted_password[:50]}...")
    except Exception as e:
        print(f"密碼加密失敗: {e}")
        print(f"使用的 KEY: {login_key}")
        raise

    # 登入請求
    resp = requests.post(
        f"{BASE_URL}/api/account/auth/login/",
        json={"email": email, "password": encrypted_password},
        timeout=10,
    )

    print(f"登入狀態碼: {resp.status_code}")

    data = resp.json()
    print(f"登入回應: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}")

    if resp.status_code != 200 or data.get("code") != 2000:
        print(f"登入失敗: {data}")
        # 如果是 validation error，可能需要不同的加密方式
        if data.get("code") == 4000:
            print("\n提示: validation error 可能表示密碼加密方式不正確")
            print("嘗試使用明文密碼...")
            # 嘗試直接發送明文密碼
            resp2 = requests.post(
                f"{BASE_URL}/api/account/auth/login/",
                json={"email": email, "password": password},
                timeout=10,
            )
            data2 = resp2.json()
            print(f"明文密碼回應: {json.dumps(data2, ensure_ascii=False, indent=2)[:200]}")
        raise Exception(f"Login failed: {data}")

    # 取得 token 和 user ID
    access_token = data["data"]["tokens"]["access_token"]
    user_id = data["data"]["profile"]["id"]

    print(f"\n✅ 登入成功")
    print(f"   User ID: {user_id}")
    print(f"   Token: {access_token[:50]}...")

    return access_token, user_id

def test_update_methods(token: str, user_id: int):
    """測試不同的 HTTP 方法"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 測試資料
    test_data = {
        "full_name": "Pony Member Real1",
        "email": "pony@real1.com",
        "phone": "+886912345679",
        "username": "pony_member_real1"
    }

    print(f"\n測試會員更新 API: /api/account/members/{user_id}/")
    print("=" * 60)

    # 測試 PATCH 方法
    print("\n1. 測試 PATCH 方法:")
    try:
        response = requests.patch(
            f"{BASE_URL}/api/account/members/{user_id}/",
            headers=headers,
            json=test_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 405:
            print("   結果: ❌ Method Not Allowed")
        elif response.status_code in [200, 201, 204]:
            print("   結果: ✅ 成功")
            print(f"   Response: {response.text[:200]}")
        else:
            print(f"   結果: ⚠️ {response.reason}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   錯誤: {e}")

    # 測試 PUT 方法
    print("\n2. 測試 PUT 方法:")
    try:
        response = requests.put(
            f"{BASE_URL}/api/account/members/{user_id}/",
            headers=headers,
            json=test_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 405:
            print("   結果: ❌ Method Not Allowed")
        elif response.status_code in [200, 201, 204]:
            print("   結果: ✅ 成功")
            print(f"   Response: {response.text[:200]}")
        else:
            print(f"   結果: ⚠️ {response.reason}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   錯誤: {e}")

    # 測試 POST 方法
    print("\n3. 測試 POST 方法:")
    try:
        response = requests.post(
            f"{BASE_URL}/api/account/members/{user_id}/",
            headers=headers,
            json=test_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 405:
            print("   結果: ❌ Method Not Allowed")
        elif response.status_code in [200, 201, 204]:
            print("   結果: ✅ 成功")
            print(f"   Response: {response.text[:200]}")
        else:
            print(f"   結果: ⚠️ {response.reason}")
            print(f"   Response: {response.text[:500]}")
    except Exception as e:
        print(f"   錯誤: {e}")

    # 測試 OPTIONS 方法來查看允許的方法
    print("\n4. 測試 OPTIONS 方法 (查看允許的 HTTP 方法):")
    try:
        response = requests.options(
            f"{BASE_URL}/api/account/members/{user_id}/",
            headers=headers,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        allow_header = response.headers.get('Allow', 'Not provided')
        print(f"   Allow header: {allow_header}")
        if allow_header != 'Not provided':
            print(f"   ✅ 支援的方法: {allow_header}")
    except Exception as e:
        print(f"   錯誤: {e}")

def main():
    try:
        # 登入取得 token 和 user ID
        token, user_id = login(EMAIL, PASSWORD, LOGIN_KEY)

        # 測試不同的 HTTP 方法
        test_update_methods(token, user_id)

        print("\n" + "=" * 60)
        print("測試完成！")

    except Exception as e:
        print(f"\n❌ 測試失敗: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
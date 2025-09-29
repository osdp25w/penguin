#!/usr/bin/env python3
"""Test password encryption to see why it works but national ID doesn't"""

from cryptography.fernet import Fernet
import requests
import json

# 測試金鑰
LOGIN_KEY = "HnMaD-8xfYG1CqyWk71DUrMICdB2kNfHsLS57TPoCZc="
SENSITIVE_KEY = "YFzfi8WyL0cDA_jKNooSFqzUv80FSiWM21lzG487GbM="

# 測試資料
test_password = "testPassword123"
test_email = "test@example.com"

print("=" * 60)
print("測試密碼加密")
print("=" * 60)

print(f"\n1. 測試登入金鑰: {LOGIN_KEY}")
print(f"2. 測試敏感資料金鑰: {SENSITIVE_KEY}")
print(f"3. 測試密碼: {test_password}")

# 測試登入場景 - 使用 LOGIN_KEY
print("\n測試 1：使用 LOGIN_KEY 加密密碼（登入場景）")
try:
    fernet_login = Fernet(LOGIN_KEY.encode())
    encrypted_with_login = fernet_login.encrypt(test_password.encode())
    print(f"加密成功: {encrypted_with_login.decode()}")

    # 解密驗證
    decrypted = fernet_login.decrypt(encrypted_with_login)
    print(f"解密成功: {decrypted.decode()}")
    print(f"驗證: {'✅ 成功' if decrypted.decode() == test_password else '❌ 失敗'}")
except Exception as e:
    print(f"錯誤: {e}")

# 測試註冊/更新場景 - 使用 SENSITIVE_KEY
print("\n測試 2：使用 SENSITIVE_KEY 加密密碼（註冊/更新場景）")
try:
    fernet_sensitive = Fernet(SENSITIVE_KEY.encode())
    encrypted_with_sensitive = fernet_sensitive.encrypt(test_password.encode())
    print(f"加密成功: {encrypted_with_sensitive.decode()}")

    # 解密驗證
    decrypted = fernet_sensitive.decrypt(encrypted_with_sensitive)
    print(f"解密成功: {decrypted.decode()}")
    print(f"驗證: {'✅ 成功' if decrypted.decode() == test_password else '❌ 失敗'}")
except Exception as e:
    print(f"錯誤: {e}")

# 測試實際的 API 登入請求
print("\n" + "=" * 60)
print("測試實際登入 API")
print("=" * 60)

# 真實帳號密碼
real_email = "pony@real1.com"
real_password = "2m8N625cvmf0"

# 1. 不加密直接發送（看後端是否接受）
print("\n1. 發送明文密碼:")
try:
    response = requests.post(
        "https://koala.osdp25w.xyz/api/account/auth/login/",
        json={"email": real_email, "password": real_password},
        headers={"Content-Type": "application/json"}
    )
    print(f"狀態碼: {response.status_code}")
    if response.status_code == 200:
        print("✅ 明文密碼登入成功")
        data = response.json()
        print(f"用戶: {data.get('profile', {}).get('name')}")
    else:
        print(f"❌ 登入失敗: {response.text}")
except Exception as e:
    print(f"請求錯誤: {e}")

# 2. 使用 LOGIN_KEY 加密後發送
print("\n2. 發送 LOGIN_KEY 加密的密碼:")
try:
    fernet_login = Fernet(LOGIN_KEY.encode())
    encrypted_password = fernet_login.encrypt(real_password.encode()).decode()

    response = requests.post(
        "https://koala.osdp25w.xyz/api/account/auth/login/",
        json={"email": real_email, "password": encrypted_password},
        headers={"Content-Type": "application/json"}
    )
    print(f"加密密碼: {encrypted_password[:50]}...")
    print(f"狀態碼: {response.status_code}")
    if response.status_code == 200:
        print("✅ 加密密碼登入成功")
        data = response.json()
        print(f"用戶: {data.get('profile', {}).get('name')}")
    else:
        print(f"❌ 登入失敗: {response.text}")
except Exception as e:
    print(f"請求錯誤: {e}")

print("\n" + "=" * 60)
print("分析：")
print("1. 如果明文密碼可以登入，說明後端可能沒有解密密碼")
print("2. 如果只有明文密碼可以登入，說明後端不期望加密的密碼")
print("3. 如果只有加密密碼可以登入，說明後端有正確解密")
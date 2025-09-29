#!/usr/bin/env python3
"""Test base64url to base64 conversion"""

import base64

# 從前端收到的加密資料
encrypted_from_frontend = "gAAAAABo2WwkLMzqqO-c6SHxIDu5lCjPzsoUjmqdj4AjdYb1uIYYcLHm3iXepu14lKdNtYGo_l3K2wV_0_g6IGVBTrkegzyzGg"

print("原始資料（base64url）:")
print(encrypted_from_frontend)
print()

# 轉換 base64url 到標準 base64
# 替換 - 為 + 和 _ 為 /
standard_base64 = encrypted_from_frontend.replace('-', '+').replace('_', '/')

# 補充 padding
padding = 4 - (len(standard_base64) % 4)
if padding != 4:
    standard_base64 += '=' * padding

print("轉換後（標準 base64）:")
print(standard_base64)
print()

# 測試解密
from cryptography.fernet import Fernet

SENSITIVE_KEY = "YFzfi8WyL0cDA_jKNooSFqzUv80FSiWM21lzG487GbM="

try:
    # 使用標準 base64
    fernet = Fernet(SENSITIVE_KEY.encode())

    # 先解碼 base64，再加密
    encrypted_bytes = base64.urlsafe_b64decode(encrypted_from_frontend)

    # Fernet 期望 base64url 編碼的字串
    decrypted = fernet.decrypt(encrypted_from_frontend.encode())
    print(f"解密成功: {decrypted.decode()}")
except Exception as e:
    print(f"解密失敗: {e}")

    # 嘗試直接使用
    try:
        # Fernet 本身就使用 base64url
        fernet = Fernet(SENSITIVE_KEY)
        decrypted = fernet.decrypt(encrypted_from_frontend)
        print(f"直接解密成功: {decrypted}")
    except Exception as e2:
        print(f"直接解密也失敗: {e2}")
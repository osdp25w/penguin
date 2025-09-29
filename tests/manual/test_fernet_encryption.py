#!/usr/bin/env python3
"""Test Fernet encryption/decryption to verify key compatibility"""

from cryptography.fernet import Fernet
import base64

# 測試金鑰（從 .env 檔案）
SENSITIVE_KEY = "YFzfi8WyL0cDA_jKNooSFqzUv80FSiWM21lzG487GbM="

# 測試資料
test_id = "A123456789"

print("=" * 60)
print("測試 Fernet 加密")
print("=" * 60)

print(f"\n1. 測試金鑰: {SENSITIVE_KEY}")
print(f"2. 測試身分證: {test_id}")

try:
    # 創建 Fernet 實例
    fernet = Fernet(SENSITIVE_KEY.encode())

    # 加密
    encrypted = fernet.encrypt(test_id.encode())
    encrypted_str = encrypted.decode()

    print(f"\n3. 加密結果:")
    print(f"   {encrypted_str}")
    print(f"   長度: {len(encrypted_str)}")
    print(f"   開頭: {encrypted_str[:10]}")

    # 解密驗證
    decrypted = fernet.decrypt(encrypted)
    decrypted_str = decrypted.decode()

    print(f"\n4. 解密結果: {decrypted_str}")
    print(f"5. 驗證: {'✅ 成功' if decrypted_str == test_id else '❌ 失敗'}")

    # 測試已知的加密資料
    print("\n" + "=" * 60)
    print("測試解密已知的加密資料")
    print("=" * 60)

    # 從錯誤訊息中的加密資料
    encrypted_from_api = "gAAAAABo2WwkLMzqqO-c6SHxIDu5lCjPzsoUjmqdj4AjdYb1uIYYcLHm3iXepu14lKdNtYGo_l3K2wV_0_g6IGVBTrkegzyzGg"

    try:
        decrypted_api = fernet.decrypt(encrypted_from_api.encode())
        print(f"解密成功: {decrypted_api.decode()}")
    except Exception as e:
        print(f"解密失敗: {e}")
        print("可能原因：")
        print("1. 前端使用的金鑰與後端不同")
        print("2. 加密格式不正確")
        print("3. 資料被加密了多次")

    # 生成一個測試用的正確格式
    print("\n" + "=" * 60)
    print("生成正確格式的加密資料（供後端測試）")
    print("=" * 60)

    correct_encrypted = fernet.encrypt(b"A123456789")
    print(f"正確的加密格式:")
    print(f"{correct_encrypted.decode()}")

except Exception as e:
    print(f"\n錯誤: {e}")
    print("\n可能的問題：")
    print("1. 金鑰格式不正確")
    print("2. 金鑰不是有效的 Fernet key")

print("\n" + "=" * 60)
print("建議：")
print("1. 確認 VITE_KOALA_SENSITIVE_KEY 與後端 GENERIC_SECRET_SIGNING_KEY 相同")
print("2. 確認前端 CryptoJS Fernet 實作與 Python cryptography 相容")
print("3. 檢查是否有多次加密的問題")
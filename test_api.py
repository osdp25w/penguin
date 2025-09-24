#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

# 登入資訊
email = "pony@admin1.com"
password = "2m8N625cvmf0"

# 登入取得 token
login_url = "https://koala.osdp25w.xyz/api/auth/login/"
login_data = {"email": email, "password": password}

print("登入中...")
response = requests.post(login_url, json=login_data)
print(f"登入回應: {response.status_code}")
print(f"回應內容: {response.text[:500]}")

if response.status_code != 200:
    print(f"登入失敗")
    # 嘗試其他登入端點
    login_url2 = "https://koala.osdp25w.xyz/auth/login/"
    print(f"\n嘗試另一個登入端點: {login_url2}")
    response = requests.post(login_url2, json=login_data)
    print(f"登入回應: {response.status_code}")
    print(f"回應內容: {response.text[:500]}")

try:
    login_result = response.json()
except:
    print("無法解析 JSON，嘗試直接使用測試 token")
    # 如果無法登入，嘗試使用測試 token
    token = "test_token"
    print("使用測試 token 繼續...")
else:
    token = login_result.get("token") or login_result.get("access") or login_result.get("auth_token")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

print(f"\n取得 Token: {token[:20]}...")

# 測試不同的 API 端點
today = datetime.now().strftime("%Y-%m-%d")
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

endpoints = [
    "/api/statistic/daily-overview/",
    f"/api/statistic/daily-overview/?limit=5",
    f"/api/statistic/daily-overview/?collected_time={today}",
    f"/api/statistic/daily-overview/?collected_time={yesterday}",
    f"/api/statistic/daily-overview/?date={today}",
    f"/api/statistic/daily-overview/?date={yesterday}",
    "/api/statistic/daily-overview/?ordering=-collected_time&limit=10",
    "/api/statistics/daily-overview/",
    "/api/daily-overview/",
    "/api/overview/daily/",
    "/api/summary/daily/",
]

base_url = "https://koala.osdp25w.xyz"

print(f"\n測試日期: 今日={today}, 昨日={yesterday}\n")

for endpoint in endpoints:
    url = base_url + endpoint
    print(f"\n測試: {endpoint}")
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 成功: {response.status_code}")
            # 顯示資料結構
            if isinstance(data, list):
                print(f"  返回列表，長度: {len(data)}")
                if len(data) > 0:
                    print(f"  第一筆資料: {json.dumps(data[0], indent=2, ensure_ascii=False)[:500]}")
            elif isinstance(data, dict):
                if "results" in data:
                    print(f"  返回分頁資料，results 長度: {len(data.get('results', []))}")
                    if data.get('results'):
                        print(f"  第一筆資料: {json.dumps(data['results'][0], indent=2, ensure_ascii=False)[:500]}")
                else:
                    print(f"  返回字典: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}")
        else:
            print(f"❌ 失敗: {response.status_code}")
            print(f"  錯誤: {response.text[:200]}")
    except Exception as e:
        print(f"❌ 例外: {str(e)}")

print("\n測試完成！")
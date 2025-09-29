#!/usr/bin/env python3
"""手動測試：使用正確的 Fernet 金鑰加密身分證後變更會員資料。

執行方式：
  ./../.venv-tests/bin/python tests/manual/update_member_national_id.py

環境變數（可覆寫預設值）：
  KOALA_BASE_URL             預設 https://koala.osdp25w.xyz
  KOALA_LOGIN_EMAIL          預設 pony@real1.com
  KOALA_LOGIN_PASSWORD       預設 2m8N625cvmf0
  KOALA_LOGIN_KEY            預設 HnMaD-8xfYG1CqyWk71DUrMICdB2kNfHsLS57TPoCZc=
  KOALA_SENSITIVE_KEY        預設 YFzfi8WyL0cDA_jKNooSFqzUv80FSiWM21lzG487GbM=

程式流程：
  1. 使用 LOGIN_KEY 加密密碼並登入，取得 access token。
  2. 使用 SENSITIVE_KEY 對指定身分證號進行 Fernet 加密。
  3. 呼叫 PATCH /api/account/members/<id>/ 更新 national_id。
  4. 輸出加密結果與 API 回應，確認是否成功。
"""

import os
import sys
from datetime import datetime

import requests
from cryptography.fernet import Fernet


BASE_URL = os.getenv('KOALA_BASE_URL', 'https://koala.osdp25w.xyz').rstrip('/')
EMAIL = os.getenv('KOALA_LOGIN_EMAIL', 'pony@real1.com')
PASSWORD = os.getenv('KOALA_LOGIN_PASSWORD', '2m8N625cvmf0')
LOGIN_KEY = os.getenv(
    'KOALA_LOGIN_KEY', 'HnMaD-8xfYG1CqyWk71DUrMICdB2kNfHsLS57TPoCZc='
)
SENSITIVE_KEY = os.getenv(
    'KOALA_SENSITIVE_KEY', 'YFzfi8WyL0cDA_jKNooSFqzUv80FSiWM21lzG487GbM='
)

PLAIN_NATIONAL_ID = os.getenv('KOALA_NEW_NATIONAL_ID') or f"A{datetime.now():%m%d%H%M}"
TARGET_MEMBER_ID = (
    int(os.getenv('KOALA_TARGET_MEMBER_ID'))
    if os.getenv('KOALA_TARGET_MEMBER_ID')
    else None
)


def encrypt_with_key(value: str, key: str) -> str:
    try:
        token = Fernet(key.encode()).encrypt(value.encode()).decode()
    except Exception as exc:  # pragma: no cover (僅供手動測試用)
        print(f'[error] 加密失敗: {exc}')
        sys.exit(1)
    return token


def login() -> tuple[str, int]:
    encrypted_password = encrypt_with_key(PASSWORD, LOGIN_KEY)
    resp = requests.post(
        f'{BASE_URL}/api/account/auth/login/',
        json={'email': EMAIL, 'password': encrypted_password},
        timeout=15,
    )
    if resp.status_code != 200:
        print('[error] 登入失敗:', resp.status_code, resp.text)
        sys.exit(1)

    payload = resp.json()
    if payload.get('code') != 2000:
        print('[error] 登入 API 回傳非成功狀態:', payload)
        sys.exit(1)

    data = payload['data']
    token = data['tokens']['access_token']
    user_id = data['profile']['id']
    print('[info] 登入成功, user id =', user_id)
    return token, user_id


def update_member_national_id(token: str, target_id: int, plain_id: str) -> None:
    encrypted_id = encrypt_with_key(plain_id, SENSITIVE_KEY)
    print('[info] 原始身分證:', plain_id)
    print('[info] 加密結果 :', encrypted_id)

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    resp = requests.patch(
        f'{BASE_URL}/api/account/members/{target_id}/',
        json={'national_id': encrypted_id},
        headers=headers,
        timeout=15,
    )

    print('[info] PATCH 狀態碼:', resp.status_code)
    print('[info] PATCH 回應  :', resp.text[:400])

    if resp.status_code != 200:
        print('[error] 更新失敗')
        sys.exit(1)

    payload = resp.json()
    if payload.get('code') != 2000:
        print('[error] API 回傳錯誤碼:', payload)
        sys.exit(1)

    print('[ok] 更新成功, 後端回傳的 national_id:', payload['data'].get('national_id'))


def main() -> None:
    print('=' * 60)
    print('Koala Member National ID Update Test')
    print('=' * 60)
    print('[info] BASE_URL         =', BASE_URL)
    print('[info] LOGIN_EMAIL      =', EMAIL)
    print('[info] LOGIN_KEY        =', LOGIN_KEY)
    print('[info] SENSITIVE_KEY    =', SENSITIVE_KEY)
    print('[info] NEW PLAIN ID     =', PLAIN_NATIONAL_ID)
    print('-' * 60)

    token, user_id = login()
    target_id = TARGET_MEMBER_ID or user_id
    if TARGET_MEMBER_ID:
        print(f'[info] 目標會員 ID   = {target_id}')
    update_member_national_id(token, target_id, PLAIN_NATIONAL_ID)


if __name__ == '__main__':
    main()

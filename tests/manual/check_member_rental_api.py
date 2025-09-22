#!/usr/bin/env python3
"""Quick check for Koala member rental APIs.

Usage:
  KOALA_LOGIN_KEY=... python tests/manual/check_member_rental_api.py \
      --email pony@real1.com --password 2m8N625cvmf0
"""
from __future__ import annotations

import argparse
import json
import os
from typing import Optional

import requests
from cryptography.fernet import Fernet

BASE_URL = "https://koala.osdp25w.xyz"


def login(email: str, password: str, login_key: str) -> str:
    fernet = Fernet(login_key)
    encrypted = fernet.encrypt(password.encode()).decode()
    resp = requests.post(
        f"{BASE_URL}/api/account/auth/login/",
        json={"email": email, "password": encrypted},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["data"]["tokens"]["access_token"]


def pretty(obj: object) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


def main(email: str, password: str, login_key: str) -> None:
    token = login(email, password, login_key) if email and password else login_key
    headers = {"Authorization": f"Bearer {token}"}

    list_resp = requests.get(f"{BASE_URL}/api/rental/member/rentals/", headers=headers, timeout=10)
    print("[list] status:", list_resp.status_code)
    try:
        print(pretty(list_resp.json())[:1000])
    except Exception:
        print(list_resp.text[:500])

    create_resp = requests.post(
        f"{BASE_URL}/api/rental/member/rentals/",
        headers=headers,
        json={"bike_id": "UP003"},
        timeout=10,
    )
    print("[create] status:", create_resp.status_code)
    try:
        print(pretty(create_resp.json()))
    except Exception:
        print(create_resp.text[:500])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default="pony@real1.com")
    parser.add_argument("--password", default="2m8N625cvmf0")
    parser.add_argument("--login-key", default=os.environ.get("KOALA_LOGIN_KEY"))
    args = parser.parse_args()

    if not args.login_key:
        raise SystemExit("KOALA_LOGIN_KEY missing")

    main(args.email, args.password, args.login_key)

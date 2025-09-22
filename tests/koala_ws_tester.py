#!/usr/bin/env python3
"""
Koala WebSocket tester

Features
- Optional HTTP login (encrypts password using Fernet with LOGIN_SECRET_SIGNING_KEY)
- Connects to wss://.../ws/bike/error-logs/?token=...
- Responds to ping with pong; prints any messages received

Usage examples
1) Login + WS (need secret key to encrypt password):
   python scripts/koala_ws_tester.py \
     --base-api-url https://koala.osdp25w.xyz \
     --base-ws-url  https://koala.osdp25w.xyz \
     --email pony@admin1.com \
     --password 2m8N625cvmf0 \
     --login-secret-key <BASE64_FERNET_KEY>

2) If you already have an access token, skip login:
   python scripts/koala_ws_tester.py \
     --base-ws-url https://koala.osdp25w.xyz \
     --access-token <JWT>

Dependencies
  pip install requests websocket-client cryptography
"""
from __future__ import annotations

import argparse
import json
import ssl
import sys
import time
import urllib.parse as urlparse
from dataclasses import dataclass
from typing import Optional


def require(module_name: str):
    try:
        return __import__(module_name)
    except ImportError as e:
        print(f"[error] Missing dependency: {module_name}. Install via: pip install {module_name}")
        raise


requests = require("requests")
websocket_client = require("websocket")  # from websocket-client
try:
    certifi = __import__("certifi")
except Exception:
    certifi = None


def to_ws_url(base: str) -> str:
    """Convert http(s) base to ws(s) if necessary; keep ws/wss unchanged."""
    if base.startswith("ws://") or base.startswith("wss://"):
        return base.rstrip("/")
    if base.startswith("https://"):
        return "wss://" + base[len("https://") :].rstrip("/")
    if base.startswith("http://"):
        return "ws://" + base[len("http://") :].rstrip("/")
    # default to wss
    return "wss://" + base.rstrip("/")


def build_ws_endpoint(base_ws_url: str, access_token: str) -> str:
    base = to_ws_url(base_ws_url)
    return f"{base}/ws/bike/error-logs/?token={access_token}"


def encrypt_password(password: str, secret_key: str) -> str:
    """Encrypt password using Fernet with provided base64 key (LOGIN_SECRET_SIGNING_KEY)."""
    try:
        from cryptography.fernet import Fernet
    except Exception:
        print("[error] cryptography is required for encryption. pip install cryptography")
        raise
    f = Fernet(secret_key)
    return f.encrypt(password.encode()).decode()


@dataclass
class LoginResult:
    access_token: str
    refresh_token: Optional[str] = None


def http_login(base_api_url: str, email: str, encrypted_password: str, *, verify_tls: bool = True) -> LoginResult:
    url = base_api_url.rstrip("/") + "/api/account/auth/login/"
    headers = {"Content-Type": "application/json"}
    payload = {"email": email, "password": encrypted_password}
    print(f"[info] POST {url}")
    resp = requests.post(
        url, headers=headers, data=json.dumps(payload), timeout=15, verify=verify_tls
    )
    if resp.status_code >= 400:
        raise RuntimeError(f"Login failed: HTTP {resp.status_code} {resp.text}")
    try:
        data = resp.json()
    except Exception:
        raise RuntimeError(f"Login failed: non-JSON response: {resp.text[:200]}")

    # Expect structure: { data: { tokens: { access_token, refresh_token, ... } } }
    tokens = (
        (data or {}).get("data", {}).get("tokens")
        or (data or {}).get("tokens")  # fallback
        or {}
    )
    at = tokens.get("access_token")
    rt = tokens.get("refresh_token")
    if not at:
        raise RuntimeError(f"Login failed: cannot find access_token in response: {data}")
    print("[ok] Login success; access token acquired")
    return LoginResult(access_token=at, refresh_token=rt)


def ws_connect_and_listen(ws_url: str, duration: int = 20, *, verify_tls: bool = True) -> None:
    """Connect to WebSocket and listen for messages, replying pong to ping."""
    print(f"[info] Connecting WS: {ws_url}")
    ws = None
    try:
        # Verify TLS by default; prefer certifi CA store if available
        sslopt = None
        if ws_url.startswith("wss://"):
            if verify_tls:
                if certifi is not None:
                    sslopt = {
                        "cert_reqs": ssl.CERT_REQUIRED,
                        "ca_certs": certifi.where(),
                    }
                else:
                    sslopt = {"cert_reqs": ssl.CERT_REQUIRED}
            else:
                sslopt = {"cert_reqs": ssl.CERT_NONE}

        ws = websocket_client.create_connection(ws_url, timeout=10, sslopt=sslopt)
        print("[ok] WS connected")
    except Exception as e:
        raise RuntimeError(f"WS connect failed: {e}")

    start = time.time()
    ws.settimeout(5)
    try:
        while time.time() - start < duration:
            try:
                raw = ws.recv()
            except websocket_client.WebSocketTimeoutException:
                continue
            except Exception as e:
                raise RuntimeError(f"WS recv error: {e}")

            try:
                msg = json.loads(raw)
            except Exception:
                print(f"[recv] {raw}")
                continue

            mtype = msg.get("type")
            if mtype == "ping":
                # reply pong
                ws.send(json.dumps({"type": "pong"}))
                print("[ping] -> pong sent")
                continue

            print(f"[msg] {json.dumps(msg, ensure_ascii=False)}")

    finally:
        try:
            ws.close()
        except Exception:
            pass
        print("[info] WS closed")


def main():
    ap = argparse.ArgumentParser(description="Koala WebSocket tester")
    ap.add_argument("--base-api-url", type=str, help="Base API URL, e.g., https://koala.osdp25w.xyz")
    ap.add_argument("--base-ws-url", type=str, required=True, help="Base WS URL (http/https/ws/wss)")
    ap.add_argument("--email", type=str, help="Login email")
    ap.add_argument("--password", type=str, help="Login password (plain, will be encrypted)")
    ap.add_argument(
        "--login-secret-key",
        type=str,
        help="LOGIN_SECRET_SIGNING_KEY (base64) for Fernet encryption",
    )
    ap.add_argument("--access-token", type=str, help="Use this token directly (skip login)")
    ap.add_argument("--duration", type=int, default=20, help="Listen seconds (default: 20)")
    ap.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS verification for both HTTP and WS",
    )

    args = ap.parse_args()

    access_token = args.access_token

    if not access_token:
        # Must have base-api-url, email, password, login-secret-key
        missing = [
            name
            for name, val in (
                ("--base-api-url", args.base_api_url),
                ("--email", args.email),
                ("--password", args.password),
                ("--login-secret-key", args.login_secret_key),
            )
            if not val
        ]
        if missing:
            ap.error(
                "Missing required args for login: "
                + ", ".join(missing)
                + ". Or provide --access-token to skip login."
            )

        enc_pwd = encrypt_password(args.password, args.login_secret_key)
        result = http_login(
            args.base_api_url, args.email, enc_pwd, verify_tls=(not args.insecure)
        )
        access_token = result.access_token

    ws_url = build_ws_endpoint(args.base_ws_url, access_token)
    ws_connect_and_listen(ws_url, duration=args.duration, verify_tls=(not args.insecure))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        print(f"[fatal] {e}")
        sys.exit(1)


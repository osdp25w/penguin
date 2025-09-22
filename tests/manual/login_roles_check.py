#!/usr/bin/env python3
"""Batch-check Koala account roles by hitting the real auth API.

Usage
-----
python tests/manual/login_roles_check.py \
  --base-url https://koala.osdp25w.xyz \
  --login-key <BASE64_URLSAFE_FERNET_KEY>

Arguments
~~~~~~~~~
--base-url     : Base URL of Koala backend (default: https://koala.osdp25w.xyz)
--login-key    : URL-safe base64 Fernet key used to encrypt passwords
--plain        : Send plaintext password instead of Fernet (for debugging only)
--timeout      : Request timeout seconds (default: 10)

The script prints the raw response role fields and the mapped role determined by
`map_koala_role()` so you can compare with the front-end behaviour.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass
from typing import Dict, Iterable, Optional

try:
    import requests  # type: ignore
except ImportError:  # pragma: no cover - handled at runtime
    print("[error] Missing dependency: requests. Install via `pip install requests`.", file=sys.stderr)
    sys.exit(1)

try:
    from cryptography.fernet import Fernet  # type: ignore
except ImportError:  # pragma: no cover - handled at runtime
    Fernet = None  # type: ignore


ACCOUNTS: Dict[str, str] = {
    "pony@tourist3.com": "Tourist / visitor",
    "pony@real1.com": "Member",
    "pony@staff1.com": "Staff",
    "pony@admin1.com": "Admin",
}
DEFAULT_PASSWORD = "2m8N625cvmf0"


@dataclass
class LoginResult:
    email: str
    status: int
    mapped_role: str
    raw_profile: Dict[str, object]
    message: str = ""


def tidy_base64_key(key: str) -> str:
    """Ensure the Fernet key has proper padding."""
    key = key.strip()
    missing = len(key) % 4
    if missing:
        key += "=" * (4 - missing)
    return key


def encrypt_password(password: str, key: str) -> str:
    if Fernet is None:
        raise RuntimeError("cryptography not installed; install via `pip install cryptography`")
    key_fixed = tidy_base64_key(key)
    try:
        fernet = Fernet(key_fixed.encode())
    except Exception as exc:
        raise RuntimeError(f"Invalid Fernet key: {exc}") from exc
    token = fernet.encrypt(password.encode())
    return token.decode()


def map_koala_role(profile: Dict[str, object]) -> str:
    """Replicates the front-end role mapping for verification."""
    if not profile:
        return "visitor"

    type_field = str(profile.get("type", "")).lower()
    profile_type = str(profile.get("profile_type", "")).lower()
    username = str(profile.get("username", ""))

    if type_field == "admin" or "admin" in username:
        return "admin"
    if type_field == "staff" or profile_type == "staff":
        return "staff"
    if "member" in profile_type or type_field in {"real", "member"}:
        return "member"
    return "visitor"


def login_once(
    base_url: str,
    email: str,
    password: str,
    *,
    login_key: Optional[str],
    use_plain: bool,
    timeout: int,
) -> LoginResult:
    url = base_url.rstrip("/") + "/api/account/auth/login/"
    payload: Dict[str, object] = {"email": email, "password": password}

    if not use_plain and login_key:
        encrypted = encrypt_password(password, login_key)
        payload["password"] = encrypted

    resp = requests.post(url, json=payload, timeout=timeout)
    message = ""
    profile: Dict[str, object] = {}
    mapped = "visitor"

    try:
        data = resp.json()
    except Exception:
        data = None

    if resp.ok and isinstance(data, dict):
        tokens = data.get("data", {}).get("tokens") if isinstance(data.get("data"), dict) else None
        profile = (data.get("data", {}).get("profile") if isinstance(data.get("data"), dict)
                   else data.get("profile") if isinstance(data, dict) else {}) or {}
        mapped = map_koala_role(profile)
        message = f"tokens={'yes' if tokens else 'no'}"
    else:
        message = f"error: {resp.text[:120]}"

    return LoginResult(
        email=email,
        status=resp.status_code,
        mapped_role=mapped,
        raw_profile=profile,
        message=message,
    )


def run_checks(
    base_url: str,
    accounts: Iterable[str],
    password: str,
    *,
    login_key: Optional[str],
    use_plain: bool,
    timeout: int,
) -> None:
    print(f"[info] Target base URL: {base_url}")
    if use_plain:
        print("[warn] Sending plaintext passwords (encryption disabled)")
    elif not login_key:
        print("[warn] No login key provided; Koala API may reject plaintext passwords")

    for email in accounts:
        print(f"\n=== Login test: {email} ===")
        try:
            result = login_once(
                base_url,
                email,
                password,
                login_key=login_key,
                use_plain=use_plain,
                timeout=timeout,
            )
        except Exception as exc:
            print(f"[error] {exc}")
            continue

        expected = ACCOUNTS.get(email, '<unknown>')
        print(f"expected    : {expected}")
        print(f"status       : {result.status}")
        print(f"mapped role  : {result.mapped_role}")
        if result.raw_profile:
            pprint_profile = json.dumps(result.raw_profile, ensure_ascii=False, indent=2)
            print("profile json :")
            print(pprint_profile)
        else:
            print("profile json : <empty>")
        if result.message:
            print(f"note         : {result.message}")


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://koala.osdp25w.xyz", help="Koala backend base URL")
    parser.add_argument("--login-key", help="URL-safe base64 Fernet key for password encryption (defaults to KOALA_LOGIN_KEY env)")
    parser.add_argument("--plain", action="store_true", help="Send plaintext password (debug only)")
    parser.add_argument("--timeout", type=int, default=10, help="HTTP timeout in seconds")
    args = parser.parse_args(list(argv) if argv is not None else None)
    if not args.login_key:
        args.login_key = os.environ.get("KOALA_LOGIN_KEY")
    return args


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    run_checks(
        args.base_url,
        list(ACCOUNTS.keys()),
        DEFAULT_PASSWORD,
        login_key=args.login_key,
        use_plain=args.plain,
        timeout=args.timeout,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

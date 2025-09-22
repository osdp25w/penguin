#!/usr/bin/env python3
"""Ad-hoc verification for Koala APIs not yet wired into the Penguin frontend.

This script performs authenticated requests against the Koala backend using the
provided admin/member credentials and reports the HTTP status plus a short note
for each endpoint we probe.

It intentionally avoids destructive mutations (e.g. real deletions) by
targeting obviously invalid identifiers or performing read-only calls.
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

import requests
from cryptography.fernet import Fernet


BASE_URL = "https://koala.osdp25w.xyz"
LOGIN_FERNET_KEY = "***REMOVED***"


@dataclass
class Cred:
  email: str
  password: str


ADMIN = Cred(email="pony@admin1.com", password="2m8N625cvmf0")
MEMBER = Cred(email="pony@real1.com", password="2m8N625cvmf0")


def encrypt_password(password: str) -> str:
  """Encrypt the plaintext password using Fernet (same key as production)."""
  f = Fernet(LOGIN_FERNET_KEY)
  return f.encrypt(password.encode()).decode()


def login(cred: Cred) -> str:
  payload = {"email": cred.email, "password": encrypt_password(cred.password)}
  resp = requests.post(
    f"{BASE_URL}/api/account/auth/login/",
    headers={"Content-Type": "application/json"},
    data=json.dumps(payload),
    timeout=20,
  )
  data = resp.json()
  token = (
    data.get("data", {})
    .get("tokens", {})
    .get("access_token")
  )
  if not token:
    raise RuntimeError(f"Login failed for {cred.email}: status={resp.status_code}, body={data}")
  return token


def auth_request(
  method: str,
  path: str,
  token: Optional[str] = None,
  *,
  params: Optional[Dict[str, Any]] = None,
  json_body: Optional[Dict[str, Any]] = None,
) -> requests.Response:
  headers = {"Accept": "application/json"}
  if json_body is not None:
    headers["Content-Type"] = "application/json"
  if token:
    headers["Authorization"] = f"Bearer {token}"
  url = f"{BASE_URL}{path}"
  return requests.request(
    method,
    url,
    headers=headers,
    params=params,
    data=json.dumps(json_body) if json_body is not None else None,
    timeout=20,
  )


@dataclass
class TestCase:
  name: str
  method: str
  path: str
  who: str  # either "admin" or "member" or "none"
  params: Optional[Dict[str, Any]] = None
  json_body: Optional[Dict[str, Any]] = None
  expect_ok: Callable[[requests.Response], bool] = lambda resp: resp.ok
  note: str = ""


def run_tests() -> List[Dict[str, Any]]:
  admin_token = login(ADMIN)
  member_token = login(MEMBER)

  tests: List[TestCase] = [
    TestCase(
      name="check_availability_unique_email",
      method="GET",
      path="/api/account/register/check-availability/",
      who="none",
      params={"email": "devtest_unique_%s@example.com" % ("ping")},
      expect_ok=lambda resp: resp.status_code == 200,
      note="Expected availability query to return 200",
    ),
    TestCase(
      name="delete_member_invalid_id",
      method="DELETE",
      path="/api/account/members/9999999/",
      who="admin",
      expect_ok=lambda resp: resp.status_code in {200, 403, 404}
      and resp.headers.get("Content-Type", "").startswith("application/json"),
      note="Attempt delete with non-existent member ID (should fail safely)",
    ),
    TestCase(
      name="delete_staff_invalid_id",
      method="DELETE",
      path="/api/account/staff/9999999/",
      who="admin",
      expect_ok=lambda resp: resp.status_code in {200, 403, 404}
      and resp.headers.get("Content-Type", "").startswith("application/json"),
      note="Attempt delete with non-existent staff ID (should fail safely)",
    ),
    TestCase(
      name="bike_info_detail",
      method="GET",
      path="/api/bike/bikes/UP001/",
      who="admin",
      expect_ok=lambda resp: resp.status_code == 200,
      note="Fetch detailed bike info for sample bike ID UP001",
    ),
    TestCase(
      name="member_rental_history",
      method="GET",
      path="/api/rental/member/rentals/",
      who="member",
      expect_ok=lambda resp: resp.status_code == 200,
      note="List member rental history",
    ),
    TestCase(
      name="member_rental_detail_id7",
      method="GET",
      path="/api/rental/member/rentals/7/",
      who="member",
      expect_ok=lambda resp: resp.status_code in {200, 404},
      note="Fetch specific rental record; 200 if record belongs to member, else 404",
    ),
    TestCase(
      name="error_log_detail_220",
      method="GET",
      path="/api/bike/error-log-status/220/",
      who="admin",
      expect_ok=lambda resp: resp.status_code in {200, 404},
      note="Probe single error log endpoint (was previously unavailable)",
    ),
  ]

  results: List[Dict[str, Any]] = []
  for case in tests:
    token = None
    if case.who == "admin":
      token = admin_token
    elif case.who == "member":
      token = member_token
    try:
      resp = auth_request(
        case.method,
        case.path,
        token,
        params=case.params,
        json_body=case.json_body,
      )
      ok = case.expect_ok(resp)
      snippet = None
      try:
        data = resp.json()
        snippet = json.dumps(data, ensure_ascii=False)[:300]
      except Exception:
        snippet = resp.text[:300]
      results.append(
        {
          "name": case.name,
          "method": case.method,
          "path": case.path,
          "http_status": resp.status_code,
          "passed": bool(ok),
          "note": case.note,
          "response_sample": snippet,
        }
      )
    except Exception as exc:
      results.append(
        {
          "name": case.name,
          "method": case.method,
          "path": case.path,
          "http_status": None,
          "passed": False,
          "note": f"{case.note} (exception: {exc})",
          "response_sample": "",
        }
      )

  return results


def main() -> int:
  try:
    results = run_tests()
  except Exception as exc:
    print(json.dumps({"error": str(exc)}), file=sys.stderr)
    return 1

  summary = {
    "base_url": BASE_URL,
    "total": len(results),
    "passed": sum(1 for r in results if r["passed"]),
    "failed": sum(1 for r in results if not r["passed"]),
    "results": results,
  }
  print(json.dumps(summary, indent=2, ensure_ascii=False))
  return 0


if __name__ == "__main__":
  sys.exit(main())

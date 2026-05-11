"""Password hashing, JWT helpers, and cookie management."""
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Response

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
REFRESH_PATH = "/auth/refresh"

_ph = PasswordHasher()


def _secret() -> str:
    s = os.environ.get("JWT_SECRET")
    if not s:
        raise RuntimeError("JWT_SECRET environment variable is not set")
    return s


def _access_ttl() -> timedelta:
    return timedelta(minutes=int(os.environ.get("ACCESS_TOKEN_TTL_MIN", "15")))


def _refresh_ttl() -> timedelta:
    return timedelta(days=int(os.environ.get("REFRESH_TOKEN_TTL_DAYS", "7")))


def _cookie_secure() -> bool:
    return os.environ.get("COOKIE_SECURE", "false").lower() == "true"


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        _ph.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def _make_token(sub: str, kind: Literal["access", "refresh"], ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "type": kind,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def create_access_token(u_id: int) -> str:
    return _make_token(str(u_id), "access", _access_ttl())


def create_refresh_token(u_id: int) -> str:
    return _make_token(str(u_id), "refresh", _refresh_ttl())


def decode_token(token: str, expected_type: str) -> dict:
    payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Wrong token type")
    return payload


def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def set_auth_cookies(resp: Response, access: str, refresh: str, csrf: str) -> None:
    secure = _cookie_secure()
    access_age = int(_access_ttl().total_seconds())
    refresh_age = int(_refresh_ttl().total_seconds())
    resp.set_cookie(
        ACCESS_COOKIE, access, httponly=True, secure=secure,
        samesite="lax", max_age=access_age,
    )
    resp.set_cookie(
        REFRESH_COOKIE, refresh, httponly=True, secure=secure,
        samesite="lax", max_age=refresh_age, path=REFRESH_PATH,
    )
    # CSRF cookie is intentionally readable by JS so the SPA can echo it
    # back in the X-CSRF-Token header (double-submit cookie pattern).
    resp.set_cookie(
        CSRF_COOKIE, csrf, httponly=False, secure=secure,
        samesite="lax", max_age=refresh_age,
    )


def clear_auth_cookies(resp: Response) -> None:
    resp.delete_cookie(ACCESS_COOKIE)
    resp.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH)
    resp.delete_cookie(CSRF_COOKIE)

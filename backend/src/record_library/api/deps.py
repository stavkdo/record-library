"""Reusable FastAPI dependencies."""
import secrets

import jwt
from fastapi import Depends, HTTPException, Request, status

from ..users import User, get_user_by_id
from .security import ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER, decode_token

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def csrf_protect(request: Request) -> None:
    """Validate the double-submit CSRF token on unsafe HTTP methods."""
    if request.method not in UNSAFE_METHODS:
        return
    cookie = request.cookies.get(CSRF_COOKIE)
    header = request.headers.get(CSRF_HEADER)
    if not cookie or not header or not secrets.compare_digest(cookie, header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF token missing or invalid")


def get_current_user(request: Request) -> User:
    """Decode the access token cookie and return the current user."""
    token = request.cookies.get(ACCESS_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(token, "access")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = get_user_by_id(int(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    return user


def require_user(
    user: User = Depends(get_current_user),
    _csrf: None = Depends(csrf_protect),
) -> User:
    """Standard dependency for authenticated, state-changing endpoints."""
    return user

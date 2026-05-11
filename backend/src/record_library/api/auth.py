"""Auth endpoints: register, login, refresh, logout, me."""
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from psycopg.errors import UniqueViolation
from pydantic import BaseModel, Field

from ..users import User, create_user, get_user_by_id, get_user_by_username
from .deps import csrf_protect, get_current_user
from .security import (
    REFRESH_COOKIE,
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    new_csrf_token,
    set_auth_cookies,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=256)


class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    u_id: int
    username: str

    @classmethod
    def from_user(cls, u: User) -> "UserOut":
        return cls(u_id=u.u_id, username=u.username)


def _issue_tokens(resp: Response, u_id: int) -> None:
    access = create_access_token(u_id)
    refresh = create_refresh_token(u_id)
    csrf = new_csrf_token()
    set_auth_cookies(resp, access, refresh, csrf)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterIn, response: Response) -> UserOut:
    try:
        user = create_user(payload.username, hash_password(payload.password))
    except UniqueViolation:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
    _issue_tokens(response, user.u_id)
    return UserOut.from_user(user)


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, response: Response) -> UserOut:
    found = get_user_by_username(payload.username)
    if not found or not verify_password(found[1], payload.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    user, _ = found
    _issue_tokens(response, user.u_id)
    return UserOut.from_user(user)


@router.post("/refresh", response_model=UserOut)
def refresh(
    request: Request,
    response: Response,
    _csrf: None = Depends(csrf_protect),
) -> UserOut:
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing refresh token")
    try:
        payload = decode_token(token, "refresh")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    u_id = int(payload["sub"])
    user = get_user_by_id(u_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    _issue_tokens(response, u_id)
    return UserOut.from_user(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, _csrf: None = Depends(csrf_protect)) -> None:
    clear_auth_cookies(response)
    return None


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.from_user(user)

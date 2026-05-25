"""Library endpoints: list, create, detail."""
from dataclasses import asdict
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg.errors import UniqueViolation
from pydantic import BaseModel, Field

from ..libraries import (
    Library,
    add_member,
    create_library,
    delete_library,
    get_library,
    get_membership_level,
    is_owner,
    list_libraries_for_user,
    list_members,
    remove_member,
    update_library_name,
)
from ..records import list_records_for_library
from ..users import User, get_user_by_username
from .deps import get_current_user, require_user
from .records import RecordOut

router = APIRouter(prefix="/libraries", tags=["libraries"])


class LibraryCreateIn(BaseModel):
    l_name: str = Field(min_length=1, max_length=128)


class LibraryUpdateIn(BaseModel):
    l_name: str = Field(min_length=1, max_length=128)


class AddMemberIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)


class MemberOut(BaseModel):
    u_id: int
    username: str
    level: Literal["owner", "member"]


class LibrarySummaryOut(BaseModel):
    l_id: int
    l_name: str
    creation_date: datetime
    level: Literal["owner", "member"]

    @classmethod
    def from_row(cls, lib: Library, level: str) -> "LibrarySummaryOut":
        return cls(
            l_id=lib.l_id,
            l_name=lib.l_name,
            creation_date=lib.creation_date,
            level=level,  # type: ignore[arg-type]
        )


class LibraryDetailOut(BaseModel):
    l_id: int
    l_name: str
    creation_date: datetime
    level: Literal["owner", "member"]
    members: list[MemberOut] = Field(default_factory=list)
    records: list[RecordOut] = Field(default_factory=list)

    @classmethod
    def from_library(
        cls,
        lib: Library,
        level: str,
        members: list[MemberOut],
        records: list[RecordOut],
    ) -> "LibraryDetailOut":
        return cls(
            l_id=lib.l_id,
            l_name=lib.l_name,
            creation_date=lib.creation_date,
            level=level,  # type: ignore[arg-type]
            members=members,
            records=records,
        )


@router.get("", response_model=list[LibrarySummaryOut])
def list_my_libraries(user: User = Depends(get_current_user)) -> list[LibrarySummaryOut]:
    rows = list_libraries_for_user(user.u_id)
    return [LibrarySummaryOut.from_row(lib, level) for lib, level in rows]


@router.post("", response_model=LibrarySummaryOut, status_code=status.HTTP_201_CREATED)
def create(payload: LibraryCreateIn, user: User = Depends(require_user)) -> LibrarySummaryOut:
    lib = create_library(payload.l_name, user.u_id)
    return LibrarySummaryOut.from_row(lib, "owner")


@router.get("/{l_id}", response_model=LibraryDetailOut)
def get_detail(l_id: int, user: User = Depends(get_current_user)) -> LibraryDetailOut:
    lib = get_library(l_id)
    if lib is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Library not found")
    level = get_membership_level(user.u_id, l_id)
    if level is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this library")
    members = [
        MemberOut(u_id=u_id, username=username, level=lvl)  # type: ignore[arg-type]
        for u_id, username, lvl in list_members(l_id)
    ]
    records = [RecordOut(**asdict(r)) for r in list_records_for_library(l_id)]
    return LibraryDetailOut.from_library(lib, level, members, records)


def _require_ownership(u_id: int, l_id: int) -> None:
    """Raise 404 if the library doesn't exist, 403 if the caller isn't its owner."""
    if not is_owner(u_id, l_id):
        if get_library(l_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Library not found")
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can do this")


@router.patch("/{l_id}", response_model=LibrarySummaryOut)
def update(
    l_id: int,
    payload: LibraryUpdateIn,
    user: User = Depends(require_user),
) -> LibrarySummaryOut:
    _require_ownership(user.u_id, l_id)
    lib = update_library_name(l_id, payload.l_name)
    if lib is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Library not found")
    return LibrarySummaryOut.from_row(lib, "owner")


@router.delete("/{l_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(l_id: int, user: User = Depends(require_user)) -> None:
    _require_ownership(user.u_id, l_id)
    delete_library(l_id)
    return None


@router.delete("/{l_id}/members/{u_id}", status_code=status.HTTP_204_NO_CONTENT)
def kick_member(
    l_id: int,
    u_id: int,
    user: User = Depends(require_user),
) -> None:
    _require_ownership(user.u_id, l_id)
    if not remove_member(l_id, u_id):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Member not found or cannot remove an owner",
        )
    return None


@router.post(
    "/{l_id}/members",
    response_model=MemberOut,
    status_code=status.HTTP_201_CREATED,
)
def invite_member(
    l_id: int,
    payload: AddMemberIn,
    user: User = Depends(require_user),
) -> MemberOut:
    _require_ownership(user.u_id, l_id)
    found = get_user_by_username(payload.username)
    if found is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    target, _ = found
    try:
        add_member(l_id, target.u_id, "member")
    except UniqueViolation:
        raise HTTPException(status.HTTP_409_CONFLICT, "User is already a member")
    return MemberOut(u_id=target.u_id, username=target.username, level="member")

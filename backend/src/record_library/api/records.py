"""Records endpoints: Discogs search and adding records to a library."""
from dataclasses import asdict
from typing import Annotated, Literal

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..discogs import fetch_release, release_to_record_data, search_releases
from ..libraries import is_member, is_owner
from ..records import (
    add_manual_record_to_library,
    add_record_to_library,
    change_record_owner,
    list_records_for_library,
    remove_record_from_library,
)
from ..users import User
from .deps import get_current_user, require_user

discogs_router = APIRouter(prefix="/discogs", tags=["discogs"])
records_router = APIRouter(prefix="/libraries", tags=["records"])


class DiscogsSearchResult(BaseModel):
    discogs_id: int
    title: str
    artist: str | None = None
    year: int | None = None
    thumb_url: str | None = None
    genres: list[str] = Field(default_factory=list)


# Genre items are individually bounded to match record_genre_table.genre VARCHAR(64).
GenreStr = Annotated[str, Field(min_length=1, max_length=64)]


class AddDiscogsIn(BaseModel):
    kind: Literal["discogs"]
    discogs_id: int = Field(ge=1)


class AddManualIn(BaseModel):
    kind: Literal["manual"]
    r_name: str = Field(min_length=1, max_length=255)
    artist: str = Field(min_length=1, max_length=255)
    year: int | None = Field(default=None, ge=1800, le=2100)
    genres: list[GenreStr] = Field(default_factory=list, max_length=10)


AddRecordPayload = Annotated[
    AddDiscogsIn | AddManualIn,
    Body(discriminator="kind"),
]


class RecordOut(BaseModel):
    r_id: int
    discogs_id: int | None
    master_id: int | None
    r_name: str
    artist: str
    year: int | None
    thumb_url: str | None
    genres: list[str] = Field(default_factory=list)
    owner: str | None = None


class ChangeOwnerIn(BaseModel):
    u_id: int = Field(ge=1)


def _search_result_from_raw(raw: dict) -> DiscogsSearchResult:
    title = raw.get("title", "")
    artist: str | None = None
    record_title = title
    if " - " in title:
        artist, _, record_title = title.partition(" - ")
    return DiscogsSearchResult(
        discogs_id=int(raw["id"]),
        title=record_title.strip(),
        artist=(artist.strip() if artist else None),
        year=int(raw["year"]) if str(raw.get("year") or "").isdigit() else None,
        thumb_url=raw.get("thumb") or raw.get("cover_image"),
        genres=list(raw.get("genre") or []),
    )


@discogs_router.get("/search", response_model=list[DiscogsSearchResult])
async def discogs_search(
    q: str = Query(min_length=1, max_length=200),
    _: User = Depends(get_current_user),
) -> list[DiscogsSearchResult]:
    """Proxy a search query to Discogs and return a trimmed-down result list."""
    try:
        raw_results = await search_releases(q)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Discogs error: {exc.response.status_code}")
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not reach Discogs")
    return [_search_result_from_raw(r) for r in raw_results if r.get("id")]


@records_router.post(
    "/{l_id}/records",
    response_model=RecordOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_record(
    l_id: int,
    payload: AddRecordPayload,
    user: User = Depends(require_user),
) -> RecordOut:
    if not is_member(user.u_id, l_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this library")
    if isinstance(payload, AddDiscogsIn):
        try:
            release = await fetch_release(payload.discogs_id)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Discogs release not found")
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                f"Discogs error: {exc.response.status_code}",
            )
        except httpx.HTTPError:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not reach Discogs")
        record = add_record_to_library(l_id, user.u_id, release_to_record_data(release))
    else:
        record = add_manual_record_to_library(l_id, user.u_id, payload.model_dump())
    record.owner = user.username
    return RecordOut(**asdict(record))


@records_router.delete(
    "/{l_id}/records/{r_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_record(
    l_id: int,
    r_id: int,
    user: User = Depends(require_user),
) -> None:
    if not is_owner(user.u_id, l_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can do this")
    if not remove_record_from_library(l_id, r_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Record not in this library")
    return None


@records_router.patch(
    "/{l_id}/records/{r_id}",
    response_model=RecordOut,
)
def update_record_owner(
    l_id: int,
    r_id: int,
    payload: ChangeOwnerIn,
    user: User = Depends(require_user),
) -> RecordOut:
    if not is_owner(user.u_id, l_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can do this")
    if not is_member(payload.u_id, l_id):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "New owner must be a member of this library",
        )
    record = change_record_owner(l_id, r_id, payload.u_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Record not in this library")
    return RecordOut(**asdict(record))

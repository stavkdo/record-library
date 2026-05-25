"""Thin async client for the Discogs HTTP API."""
import os

import httpx

DISCOGS_BASE_URL = "https://api.discogs.com"
USER_AGENT = "RecordLibrary/0.1"
TIMEOUT = httpx.Timeout(10.0)


def _headers() -> dict[str, str]:
    token = os.environ.get("DISCOGS_TOKEN")
    if not token:
        raise RuntimeError("DISCOGS_TOKEN environment variable is not set")
    return {
        "Authorization": f"Discogs token={token}",
        "User-Agent": USER_AGENT,
    }


async def search_releases(query: str, per_page: int = 10) -> list[dict]:
    """Search Discogs for releases matching `query`. Returns the raw result list."""
    params = {"q": query, "type": "release", "per_page": per_page}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{DISCOGS_BASE_URL}/database/search",
            params=params,
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json().get("results", [])


async def fetch_release(discogs_id: int) -> dict:
    """Fetch full release metadata for a given Discogs release id."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.get(
            f"{DISCOGS_BASE_URL}/releases/{discogs_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


def release_to_record_data(release: dict) -> dict:
    """Map a Discogs release payload to the dict shape expected by add_record_to_library."""
    artists = release.get("artists") or []
    artist_name = ", ".join(a.get("name", "").strip() for a in artists if a.get("name"))
    return {
        "discogs_id": int(release["id"]),
        "master_id": release.get("master_id") or None,
        "r_name": release.get("title", "").strip() or "Untitled",
        "artist": artist_name or "Unknown",
        "year": release.get("year") or None,
        "thumb_url": release.get("thumb") or release.get("images", [{}])[0].get("uri150"),
        "genres": list(release.get("genres") or []),
    }

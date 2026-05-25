"""Database helpers for records and inventory."""
from dataclasses import dataclass, field

from .db import connect


@dataclass
class Record:
    r_id: int
    discogs_id: int | None
    master_id: int | None
    r_name: str
    artist: str
    year: int | None
    thumb_url: str | None
    genres: list[str] = field(default_factory=list)
    owner: str | None = None


def add_record_to_library(l_id: int, u_id: int, record_data: dict) -> Record:
    """
    Atomically upsert a record into record_table (keyed by discogs_id),
    refresh its genres, and link it to the library's inventory.

    record_data must include: discogs_id, r_name, artist.
    Optional: master_id, year, thumb_url, genres (list[str]).
    """
    upsert_record = """
        INSERT INTO record_table (discogs_id, master_id, r_name, artist, year, thumb_url)
        VALUES (%(discogs_id)s, %(master_id)s, %(r_name)s, %(artist)s, %(year)s, %(thumb_url)s)
        ON CONFLICT (discogs_id) DO UPDATE SET
            master_id  = EXCLUDED.master_id,
            r_name     = EXCLUDED.r_name,
            artist     = EXCLUDED.artist,
            year       = EXCLUDED.year,
            thumb_url  = EXCLUDED.thumb_url,
            fetched_at = NOW()
        RETURNING r_id, discogs_id, master_id, r_name, artist, year, thumb_url;
    """
    insert_genre = """
        INSERT INTO record_genre_table (r_id, genre)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_inventory = """
        INSERT INTO library_inventory_table (l_id, r_id, u_id)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING;
    """
    payload = {
        "discogs_id": record_data["discogs_id"],
        "master_id":  record_data.get("master_id"),
        "r_name":     record_data["r_name"],
        "artist":     record_data["artist"],
        "year":       record_data.get("year"),
        "thumb_url":  record_data.get("thumb_url"),
    }
    genres = list(record_data.get("genres") or [])
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(upsert_record, payload)
            row = cur.fetchone()
            assert row is not None
            r_id, discogs_id, master_id, r_name, artist, year, thumb_url = row
            # Refresh genres: clear then re-insert (cheap, keeps things in sync with Discogs).
            cur.execute("DELETE FROM record_genre_table WHERE r_id = %s;", (r_id,))
            for g in genres:
                cur.execute(insert_genre, (r_id, g))
            cur.execute(insert_inventory, (l_id, r_id, u_id))
    return Record(r_id, discogs_id, master_id, r_name, artist, year, thumb_url, genres)


def add_manual_record_to_library(l_id: int, u_id: int, record_data: dict) -> Record:
    """
    Insert a manually-entered record (no Discogs id) and link it to the library.

    record_data must include: r_name, artist.
    Optional: year, genres (list[str]).
    """
    insert_record = """
        INSERT INTO record_table (discogs_id, master_id, r_name, artist, year, thumb_url)
        VALUES (NULL, NULL, %(r_name)s, %(artist)s, %(year)s, NULL)
        RETURNING r_id, discogs_id, master_id, r_name, artist, year, thumb_url;
    """
    insert_genre = """
        INSERT INTO record_genre_table (r_id, genre)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING;
    """
    insert_inventory = """
        INSERT INTO library_inventory_table (l_id, r_id, u_id)
        VALUES (%s, %s, %s);
    """
    payload = {
        "r_name": record_data["r_name"],
        "artist": record_data["artist"],
        "year":   record_data.get("year"),
    }
    genres = list(record_data.get("genres") or [])
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_record, payload)
            row = cur.fetchone()
            assert row is not None
            r_id, discogs_id, master_id, r_name, artist, year, thumb_url = row
            for g in genres:
                cur.execute(insert_genre, (r_id, g))
            cur.execute(insert_inventory, (l_id, r_id, u_id))
    return Record(r_id, discogs_id, master_id, r_name, artist, year, thumb_url, genres)


def list_records_for_library(l_id: int) -> list[Record]:
    """Return all records in a library, including their genres and the owner's username."""
    sql = """
        SELECT r.r_id, r.discogs_id, r.master_id, r.r_name, r.artist, r.year, r.thumb_url,
               COALESCE(
                   (SELECT array_agg(rg.genre ORDER BY rg.genre)
                    FROM record_genre_table AS rg WHERE rg.r_id = r.r_id),
                   ARRAY[]::varchar[]
               ) AS genres,
               u.username AS owner
        FROM library_inventory_table AS li
        JOIN record_table AS r ON r.r_id = li.r_id
        JOIN user_table   AS u ON u.u_id = li.u_id
        WHERE li.l_id = %s
        ORDER BY r.artist, r.r_name;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id,))
            rows = cur.fetchall()
    return [
        Record(r_id, d_id, m_id, name, artist, year, thumb, list(genres or []), owner)
        for r_id, d_id, m_id, name, artist, year, thumb, genres, owner in rows
    ]


def remove_record_from_library(l_id: int, r_id: int) -> bool:
    """Delete the inventory link between a library and a record. Returns True if removed."""
    sql = "DELETE FROM library_inventory_table WHERE l_id = %s AND r_id = %s;"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id, r_id))
            return cur.rowcount > 0


def change_record_owner(l_id: int, r_id: int, new_u_id: int) -> Record | None:
    """Reassign the inventory row to a new owner. Returns the refreshed Record, or None if not found."""
    update_sql = """
        UPDATE library_inventory_table
        SET u_id = %s
        WHERE l_id = %s AND r_id = %s;
    """
    select_sql = """
        SELECT r.r_id, r.discogs_id, r.master_id, r.r_name, r.artist, r.year, r.thumb_url,
               COALESCE(
                   (SELECT array_agg(rg.genre ORDER BY rg.genre)
                    FROM record_genre_table AS rg WHERE rg.r_id = r.r_id),
                   ARRAY[]::varchar[]
               ) AS genres,
               u.username AS owner
        FROM library_inventory_table AS li
        JOIN record_table AS r ON r.r_id = li.r_id
        JOIN user_table   AS u ON u.u_id = li.u_id
        WHERE li.l_id = %s AND li.r_id = %s;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(update_sql, (new_u_id, l_id, r_id))
            if cur.rowcount == 0:
                return None
            cur.execute(select_sql, (l_id, r_id))
            row = cur.fetchone()
    if row is None:
        return None
    r_id, d_id, m_id, name, artist, year, thumb, genres, owner = row
    return Record(r_id, d_id, m_id, name, artist, year, thumb, list(genres or []), owner)

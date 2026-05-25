"""Database helpers for libraries."""
from dataclasses import dataclass
from datetime import datetime

from .db import connect


@dataclass
class Library:
    l_id: int
    l_name: str
    creation_date: datetime


def list_libraries_for_user(u_id: int) -> list[tuple[Library, str]]:
    """Return (library, membership_level) for each library the user belongs to."""
    sql = """
        SELECT l.l_id, l.l_name, l.creation_date, ul.level
        FROM library_table AS l
        JOIN user_library_membership_table AS ul ON ul.l_id = l.l_id
        WHERE ul.u_id = %s
        ORDER BY l.creation_date DESC;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (u_id,))
            rows = cur.fetchall()
    return [(Library(l_id, l_name, creation_date), level)
            for l_id, l_name, creation_date, level in rows]


def get_library(l_id: int) -> Library | None:
    sql = "SELECT l_id, l_name, creation_date FROM library_table WHERE l_id = %s;"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id,))
            row = cur.fetchone()
    if row is None:
        return None
    return Library(*row)


def create_library(l_name: str, owner_u_id: int) -> Library:
    insert_lib = """
        INSERT INTO library_table (l_name)
        VALUES (%s)
        RETURNING l_id, l_name, creation_date;
    """
    insert_membership = """
        INSERT INTO user_library_membership_table (l_id, u_id, level)
        VALUES (%s, %s, %s);
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(insert_lib, (l_name,))
            row = cur.fetchone()
            assert row is not None  # INSERT ... RETURNING always yields a row
            cur.execute(insert_membership, (row[0], owner_u_id, "owner"))
    return Library(*row)


def is_member(u_id: int, l_id: int) -> bool:
    sql = """
        SELECT EXISTS (
            SELECT 1 FROM user_library_membership_table
            WHERE u_id = %s AND l_id = %s
        );
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (u_id, l_id))
            row = cur.fetchone()
    return bool(row and row[0])


def is_owner(u_id: int, l_id: int) -> bool:
    sql = """
        SELECT EXISTS (
            SELECT 1 FROM user_library_membership_table
            WHERE u_id = %s AND l_id = %s AND level = 'owner'
        );
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (u_id, l_id))
            row = cur.fetchone()
    return bool(row and row[0])


def get_membership_level(u_id: int, l_id: int) -> str | None:
    """Return 'owner' / 'member' for the user's role in the library, or None."""
    sql = """
        SELECT level FROM user_library_membership_table
        WHERE u_id = %s AND l_id = %s;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (u_id, l_id))
            row = cur.fetchone()
    return row[0] if row else None


def update_library_name(l_id: int, l_name: str) -> Library | None:
    sql = """
        UPDATE library_table
        SET l_name = %s
        WHERE l_id = %s
        RETURNING l_id, l_name, creation_date;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_name, l_id))
            row = cur.fetchone()
    if row is None:
        return None
    return Library(*row)


def delete_library(l_id: int) -> bool:
    """Delete the library. Cascades to memberships and inventory rows."""
    sql = "DELETE FROM library_table WHERE l_id = %s;"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id,))
            return cur.rowcount > 0


def list_members(l_id: int) -> list[tuple[int, str, str]]:
    """Return (u_id, username, level) for each member of the library."""
    sql = """
        SELECT u.u_id, u.username, ul.level
        FROM user_library_membership_table AS ul
        JOIN user_table AS u ON u.u_id = ul.u_id
        WHERE ul.l_id = %s
        ORDER BY ul.level DESC, u.username;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id,))
            rows = cur.fetchall()
    return [(u_id, username, level) for u_id, username, level in rows]


def add_member(l_id: int, u_id: int, level: str = "member") -> None:
    sql = """
        INSERT INTO user_library_membership_table (l_id, u_id, level)
        VALUES (%s, %s, %s);
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id, u_id, level))


def remove_member(l_id: int, u_id: int) -> bool:
    """Remove a non-owner member from a library. Returns True if a row was deleted."""
    sql = """
        DELETE FROM user_library_membership_table
        WHERE l_id = %s AND u_id = %s AND level != 'owner';
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (l_id, u_id))
            return cur.rowcount > 0

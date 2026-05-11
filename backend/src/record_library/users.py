"""Database helpers for users."""
from dataclasses import dataclass
from datetime import datetime

from .db import connect


@dataclass
class User:
    u_id: int
    username: str
    register_date: datetime


def create_user(username: str, password_hash: str) -> User:
    sql = """
        INSERT INTO user_table (username, password)
        VALUES (%s, %s)
        RETURNING u_id, username, register_date;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (username, password_hash))
            row = cur.fetchone()
    return User(*row)


def get_user_by_username(username: str) -> tuple[User, str] | None:
    """Return (user, password_hash) for the given username, or None."""
    sql = """
        SELECT u_id, username, register_date, password
        FROM user_table
        WHERE username = %s;
    """
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (username,))
            row = cur.fetchone()
    if row is None:
        return None
    return User(row[0], row[1], row[2]), row[3]


def get_user_by_id(u_id: int) -> User | None:
    sql = "SELECT u_id, username, register_date FROM user_table WHERE u_id = %s;"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (u_id,))
            row = cur.fetchone()
    if row is None:
        return None
    return User(*row)

"""Postgres connection helpers."""
import os
from contextlib import contextmanager

import psycopg
from dotenv import load_dotenv

load_dotenv()


def _dsn() -> str:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL environment variable is not set")
    return dsn


@contextmanager
def connect():
    """Yield a psycopg connection that commits on success, rolls back on error."""
    with psycopg.connect(_dsn()) as conn:
        yield conn

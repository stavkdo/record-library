"""Authorization tests for record & member endpoints.

These tests stub the data-layer helpers (no real DB) and override the auth
dependencies so we can exercise the route-level permission checks in isolation.
"""
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from record_library.api import libraries as libraries_api
from record_library.api import records as records_api
from record_library.api.deps import get_current_user, require_user
from record_library.api.main import app
from record_library.records import Record
from record_library.users import User


@pytest.fixture
def fake_user() -> User:
    return User(u_id=42, username="alice", register_date=datetime(2024, 1, 1))


@pytest.fixture
def client(fake_user: User) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[require_user] = lambda: fake_user
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def _make_record(**overrides) -> Record:
    defaults = dict(
        r_id=2, discogs_id=None, master_id=None, r_name="Foo",
        artist="Bar", year=None, thumb_url=None, genres=[], owner="bob",
    )
    defaults.update(overrides)
    return Record(**defaults)


# ---- DELETE /libraries/{l_id}/records/{r_id} ---------------------------------

def test_member_cannot_delete_record(client, monkeypatch):
    monkeypatch.setattr(records_api, "is_owner", lambda u_id, l_id: False)
    called: list = []
    monkeypatch.setattr(
        records_api, "remove_record_from_library",
        lambda *a: called.append(a) or True,
    )

    r = client.delete("/libraries/1/records/2")

    assert r.status_code == 403
    assert called == []


def test_owner_can_delete_record(client, monkeypatch):
    monkeypatch.setattr(records_api, "is_owner", lambda u_id, l_id: True)
    called: list = []
    monkeypatch.setattr(
        records_api, "remove_record_from_library",
        lambda *a: called.append(a) or True,
    )

    r = client.delete("/libraries/1/records/2")

    assert r.status_code == 204
    assert called == [(1, 2)]


# ---- PATCH /libraries/{l_id}/records/{r_id} ----------------------------------

def test_member_cannot_change_record_owner(client, monkeypatch):
    monkeypatch.setattr(records_api, "is_owner", lambda u_id, l_id: False)
    monkeypatch.setattr(records_api, "is_member", lambda u_id, l_id: True)
    called: list = []
    monkeypatch.setattr(
        records_api, "change_record_owner",
        lambda *a: called.append(a) or None,
    )

    r = client.patch("/libraries/1/records/2", json={"u_id": 5})

    assert r.status_code == 403
    assert called == []


def test_owner_can_change_record_owner(client, monkeypatch):
    monkeypatch.setattr(records_api, "is_owner", lambda u_id, l_id: True)
    monkeypatch.setattr(records_api, "is_member", lambda u_id, l_id: True)
    monkeypatch.setattr(
        records_api, "change_record_owner",
        lambda *a: _make_record(owner="bob"),
    )

    r = client.patch("/libraries/1/records/2", json={"u_id": 5})

    assert r.status_code == 200
    assert r.json()["owner"] == "bob"


# ---- DELETE /libraries/{l_id}/members/{u_id} ---------------------------------

def test_member_cannot_remove_member(client, monkeypatch):
    monkeypatch.setattr(libraries_api, "is_owner", lambda u_id, l_id: False)
    # _require_ownership falls back to get_library when not owner; returning a
    # truthy value forces the 403 branch instead of 404.
    monkeypatch.setattr(libraries_api, "get_library", lambda l_id: object())
    called: list = []
    monkeypatch.setattr(
        libraries_api, "remove_member",
        lambda *a: called.append(a) or True,
    )

    r = client.delete("/libraries/1/members/9")

    assert r.status_code == 403
    assert called == []


def test_owner_can_remove_member(client, monkeypatch):
    monkeypatch.setattr(libraries_api, "is_owner", lambda u_id, l_id: True)
    called: list = []
    monkeypatch.setattr(
        libraries_api, "remove_member",
        lambda *a: called.append(a) or True,
    )

    r = client.delete("/libraries/1/members/9")

    assert r.status_code == 204
    assert called == [(1, 9)]


# ---- POST /libraries/{l_id}/records (any member may add) ---------------------

def test_any_member_can_add_manual_record(client, monkeypatch, fake_user):
    monkeypatch.setattr(records_api, "is_owner", lambda u_id, l_id: False)
    monkeypatch.setattr(records_api, "is_member", lambda u_id, l_id: True)
    monkeypatch.setattr(
        records_api, "add_manual_record_to_library",
        lambda *a: _make_record(r_id=99, r_name="Hello", artist="World", year=2020),
    )

    r = client.post(
        "/libraries/1/records",
        json={"kind": "manual", "r_name": "Hello", "artist": "World", "year": 2020},
    )

    assert r.status_code == 201
    body = r.json()
    assert body["r_id"] == 99
    assert body["owner"] == fake_user.username

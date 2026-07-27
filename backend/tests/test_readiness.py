from typing import cast

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.routes.readiness import readiness_check


class FakeDatabaseSession:
    """Small test substitute that records whether SQL was executed."""

    def __init__(self) -> None:
        self.execute_was_called = False

    def execute(self, _statement: object) -> None:
        self.execute_was_called = True


class UnavailableDatabaseSession:
    def execute(self, _statement: object) -> None:
        raise SQLAlchemyError("Database unavailable")


def test_readiness_checks_database_connection() -> None:
    fake_session = FakeDatabaseSession()

    response = readiness_check(cast(Session, fake_session))

    assert response.status == "ready"
    assert response.database == "connected"
    assert fake_session.execute_was_called is True


def test_readiness_returns_503_when_database_is_unavailable() -> None:
    unavailable_session = cast(Session, UnavailableDatabaseSession())

    with pytest.raises(HTTPException) as captured_error:
        readiness_check(unavailable_session)

    assert captured_error.value.status_code == 503

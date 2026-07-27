from collections.abc import Generator

import pytest
from sqlalchemy.orm import Session

from app.infrastructure.database.session import engine


@pytest.fixture
def database_session() -> Generator[Session]:
    """Run each integration test in a transaction that is rolled back."""
    with engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, expire_on_commit=False) as session:
            yield session
        if transaction.is_active:
            transaction.rollback()

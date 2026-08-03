from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from app.application.catalog.service import CatalogService
from app.application.errors import ResourceNotFoundError


def test_service_manages_a_book_and_its_notes(
    database_session: Session,
) -> None:
    service = CatalogService(database_session)
    created_book = service.create_book(
        title="Make It Stick",
        author="Peter C. Brown",
    )
    note = service.create_note(
        created_book.book.id,
        title="Retrieval practice",
        body="Recalling knowledge strengthens later recall.",
        source_location="Chapter 2",
        kind="quote",
    )

    loaded_book = service.get_book(created_book.book.id)
    loaded_notes = service.list_notes(
        created_book.book.id,
        limit=100,
        offset=0,
    )

    assert loaded_book.note_count == 1
    assert loaded_book.last_activity_at >= loaded_book.book.updated_at
    assert loaded_notes == [note]
    assert note.kind == "quote"

    updated_note = service.update_note(
        note.id,
        changes={"source_location": None, "kind": "note"},
    )
    assert updated_note.source_location is None
    assert updated_note.kind == "note"

    service.delete_note(note.id)
    assert service.get_book(created_book.book.id).note_count == 0


def test_service_reports_a_missing_book(
    database_session: Session,
) -> None:
    missing_id = uuid4()

    with pytest.raises(ResourceNotFoundError) as captured_error:
        CatalogService(database_session).get_book(missing_id)

    assert captured_error.value.resource_name == "Book"
    assert captured_error.value.resource_id == missing_id

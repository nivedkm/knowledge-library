import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Book, Note
from app.infrastructure.repositories.catalog import CatalogRepository


def test_repository_creates_and_reads_a_book_with_notes(
    database_session: Session,
) -> None:
    repository = CatalogRepository(database_session)
    book = repository.add_book(
        Book(title="The Pragmatic Programmer", author="David Thomas"),
    )
    note = repository.add_note(
        Note(
            book_id=book.id,
            title="Tracer bullets",
            body="Build an end-to-end path early and refine it.",
            source_location="Chapter 2",
        ),
    )

    loaded_book = repository.get_book(book.id)
    loaded_notes = repository.list_notes_for_book(book.id)

    assert loaded_book is book
    assert loaded_book.created_at.tzinfo is not None
    assert loaded_notes == [note]
    assert note.book is book


def test_repository_updates_and_deletes_a_note(
    database_session: Session,
) -> None:
    repository = CatalogRepository(database_session)
    book = repository.add_book(Book(title="Deep Work", author="Cal Newport"))
    note = repository.add_note(
        Note(book_id=book.id, body="Protect uninterrupted focus."),
    )

    note.body = "Schedule and protect uninterrupted focus."
    database_session.flush()
    database_session.refresh(note)

    assert repository.get_note(note.id) is note
    assert note.body == "Schedule and protect uninterrupted focus."

    repository.delete_note(note)

    assert repository.get_note(note.id) is None


def test_deleting_a_book_cascades_to_its_notes(
    database_session: Session,
) -> None:
    repository = CatalogRepository(database_session)
    book = repository.add_book(
        Book(title="Thinking in Systems", author="Donella Meadows")
    )
    note = repository.add_note(
        Note(book_id=book.id, body="The structure produces the behavior."),
    )
    note_id = note.id

    database_session.expire(book, ["notes"])
    repository.delete_book(book)

    remaining_note = database_session.scalar(
        select(Note).where(Note.id == note_id),
    )
    assert remaining_note is None


def test_database_rejects_blank_required_text(
    database_session: Session,
) -> None:
    database_session.add(Book(title="   ", author="Valid Author"))

    with pytest.raises(IntegrityError):
        database_session.flush()

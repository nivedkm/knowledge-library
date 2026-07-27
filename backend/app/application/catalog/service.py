from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.application.errors import ResourceNotFoundError
from app.infrastructure.database.models import Book, Note
from app.infrastructure.repositories.catalog import CatalogRepository


@dataclass(frozen=True)
class BookOverview:
    """A book plus values calculated from its notes."""

    book: Book
    note_count: int
    last_activity_at: datetime


class CatalogService:
    """Coordinate catalog operations and own their transaction boundary."""

    def __init__(self, session: Session) -> None:
        self._session = session
        self._repository = CatalogRepository(session)

    def create_book(self, *, title: str, author: str) -> BookOverview:
        book = self._repository.add_book(Book(title=title, author=author))
        self._commit()
        return BookOverview(book=book, note_count=0, last_activity_at=book.updated_at)

    def list_books(self, *, limit: int, offset: int) -> list[BookOverview]:
        records = self._repository.list_books_with_activity(
            limit=limit,
            offset=offset,
        )
        return [
            BookOverview(
                book=book,
                note_count=note_count,
                last_activity_at=last_activity_at,
            )
            for book, note_count, last_activity_at in records
        ]

    def get_book(self, book_id: UUID) -> BookOverview:
        record = self._repository.get_book_with_activity(book_id)
        if record is None:
            raise ResourceNotFoundError("Book", book_id)

        book, note_count, last_activity_at = record
        return BookOverview(
            book=book,
            note_count=note_count,
            last_activity_at=last_activity_at,
        )

    def update_book(
        self,
        book_id: UUID,
        *,
        title: str | None = None,
        author: str | None = None,
    ) -> BookOverview:
        book = self._require_book(book_id)
        if title is not None:
            book.title = title
        if author is not None:
            book.author = author

        self._repository.flush()
        self._commit()
        return self.get_book(book_id)

    def delete_book(self, book_id: UUID) -> None:
        self._repository.delete_book(self._require_book(book_id))
        self._commit()

    def create_note(
        self,
        book_id: UUID,
        *,
        body: str,
        title: str | None,
        source_location: str | None,
    ) -> Note:
        self._require_book(book_id)
        note = self._repository.add_note(
            Note(
                book_id=book_id,
                title=title,
                body=body,
                source_location=source_location,
            ),
        )
        self._commit()
        return note

    def list_notes(
        self,
        book_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> list[Note]:
        self._require_book(book_id)
        return self._repository.list_notes_for_book(
            book_id,
            limit=limit,
            offset=offset,
        )

    def get_note(self, note_id: UUID) -> Note:
        return self._require_note(note_id)

    def update_note(
        self,
        note_id: UUID,
        *,
        changes: dict[str, str | None],
    ) -> Note:
        note = self._require_note(note_id)
        for field_name, value in changes.items():
            setattr(note, field_name, value)

        self._repository.flush()
        self._commit()
        return note

    def delete_note(self, note_id: UUID) -> None:
        self._repository.delete_note(self._require_note(note_id))
        self._commit()

    def _require_book(self, book_id: UUID) -> Book:
        book = self._repository.get_book(book_id)
        if book is None:
            raise ResourceNotFoundError("Book", book_id)
        return book

    def _require_note(self, note_id: UUID) -> Note:
        note = self._repository.get_note(note_id)
        if note is None:
            raise ResourceNotFoundError("Note", note_id)
        return note

    def _commit(self) -> None:
        try:
            self._session.commit()
        except SQLAlchemyError:
            self._session.rollback()
            raise

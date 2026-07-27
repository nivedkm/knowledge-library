from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Book, Note


class CatalogRepository:
    """Persist and query books and their notes without owning transactions."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add_book(self, book: Book) -> Book:
        self._session.add(book)
        self._session.flush()
        return book

    def get_book(self, book_id: UUID) -> Book | None:
        return self._session.get(Book, book_id)

    def list_books(self) -> list[Book]:
        statement = select(Book).order_by(Book.title, Book.id)
        return list(self._session.scalars(statement))

    def delete_book(self, book: Book) -> None:
        self._session.delete(book)
        self._session.flush()

    def add_note(self, note: Note) -> Note:
        self._session.add(note)
        self._session.flush()
        return note

    def get_note(self, note_id: UUID) -> Note | None:
        return self._session.get(Note, note_id)

    def list_notes_for_book(self, book_id: UUID) -> list[Note]:
        statement = (
            select(Note)
            .where(Note.book_id == book_id)
            .order_by(Note.created_at, Note.id)
        )
        return list(self._session.scalars(statement))

    def delete_note(self, note: Note) -> None:
        self._session.delete(note)
        self._session.flush()

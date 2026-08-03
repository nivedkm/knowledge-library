from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Book, Note, NoteChunk


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

    def list_books_with_activity(
        self,
        *,
        limit: int,
        offset: int,
    ) -> list[tuple[Book, int, datetime]]:
        last_activity = func.greatest(
            Book.updated_at,
            func.coalesce(func.max(Note.updated_at), Book.updated_at),
        )
        statement = (
            select(
                Book,
                func.count(Note.id),
                last_activity,
            )
            .outerjoin(Note)
            .group_by(Book.id)
            .order_by(last_activity.desc(), Book.id)
            .limit(limit)
            .offset(offset)
        )
        rows = self._session.execute(statement)
        return [(row[0], row[1], row[2]) for row in rows]

    def get_book_with_activity(
        self,
        book_id: UUID,
    ) -> tuple[Book, int, datetime] | None:
        statement = (
            select(
                Book,
                func.count(Note.id),
                func.greatest(
                    Book.updated_at,
                    func.coalesce(func.max(Note.updated_at), Book.updated_at),
                ),
            )
            .outerjoin(Note)
            .where(Book.id == book_id)
            .group_by(Book.id)
        )
        row = self._session.execute(statement).one_or_none()
        if row is None:
            return None
        return row[0], row[1], row[2]

    def delete_book(self, book: Book) -> None:
        self._session.delete(book)
        self._session.flush()

    def add_note(self, note: Note) -> Note:
        self._session.add(note)
        self._session.flush()
        return note

    def add_note_chunk(self, chunk: NoteChunk) -> NoteChunk:
        self._session.add(chunk)
        self._session.flush()
        return chunk

    def get_note(self, note_id: UUID) -> Note | None:
        return self._session.get(Note, note_id)

    def list_notes_for_book(
        self,
        book_id: UUID,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Note]:
        statement = (
            select(Note)
            .where(Note.book_id == book_id)
            .order_by(Note.created_at, Note.id)
            .limit(limit)
            .offset(offset)
        )
        return list(self._session.scalars(statement))

    def list_chunks_for_note(self, note_id: UUID) -> list[NoteChunk]:
        statement = (
            select(NoteChunk)
            .where(NoteChunk.note_id == note_id)
            .order_by(NoteChunk.chunk_index, NoteChunk.id)
        )
        return list(self._session.scalars(statement))

    def delete_note(self, note: Note) -> None:
        self._session.delete(note)
        self._session.flush()

    def flush(self) -> None:
        self._session.flush()

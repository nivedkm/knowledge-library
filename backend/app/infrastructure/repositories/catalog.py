from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.infrastructure.database.models import Book, Note, NoteChunk


@dataclass(frozen=True)
class SearchChunkCandidate:
    chunk: NoteChunk
    note: Note
    book: Book
    semantic_distance: float | None = None
    keyword_rank: float | None = None


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

    def delete_chunks_for_note(self, note_id: UUID) -> None:
        self._session.execute(delete(NoteChunk).where(NoteChunk.note_id == note_id))

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

    def list_notes_without_chunks(self) -> list[Note]:
        statement = (
            select(Note)
            .outerjoin(NoteChunk, NoteChunk.note_id == Note.id)
            .where(NoteChunk.id.is_(None))
            .order_by(Note.created_at, Note.id)
        )
        return list(self._session.scalars(statement))

    def search_chunks_by_embedding(
        self,
        query_embedding: list[float],
        *,
        limit: int,
        kind: str | None = None,
    ) -> list[SearchChunkCandidate]:
        semantic_distance = NoteChunk.embedding.cosine_distance(query_embedding).label(
            "semantic_distance",
        )
        statement = (
            select(NoteChunk, Note, Book, semantic_distance)
            .join(Note, NoteChunk.note_id == Note.id)
            .join(Book, Note.book_id == Book.id)
            .where(NoteChunk.embedding.is_not(None))
            .order_by(semantic_distance.asc(), NoteChunk.updated_at.desc(), NoteChunk.id)
            .limit(limit)
        )
        if kind is not None:
            statement = statement.where(Note.kind == kind)

        rows = self._session.execute(statement)
        return [
            SearchChunkCandidate(
                chunk=row[0],
                note=row[1],
                book=row[2],
                semantic_distance=float(row[3]),
            )
            for row in rows
        ]

    def search_chunks_by_keywords(
        self,
        query: str,
        *,
        limit: int,
        kind: str | None = None,
    ) -> list[SearchChunkCandidate]:
        document = func.to_tsvector("english", NoteChunk.content)
        ts_query = func.websearch_to_tsquery("english", query)
        keyword_rank = func.ts_rank_cd(document, ts_query).label("keyword_rank")
        statement = (
            select(NoteChunk, Note, Book, keyword_rank)
            .join(Note, NoteChunk.note_id == Note.id)
            .join(Book, Note.book_id == Book.id)
            .where(document.op("@@")(ts_query))
            .order_by(keyword_rank.desc(), NoteChunk.updated_at.desc(), NoteChunk.id)
            .limit(limit)
        )
        if kind is not None:
            statement = statement.where(Note.kind == kind)

        rows = self._session.execute(statement)
        return [
            SearchChunkCandidate(
                chunk=row[0],
                note=row[1],
                book=row[2],
                keyword_rank=float(row[3]),
            )
            for row in rows
        ]

    def search_notes_by_keywords(
        self,
        query: str,
        *,
        limit: int,
        kind: str | None = None,
    ) -> list[SearchChunkCandidate]:
        note_document = func.to_tsvector(
            "english",
            func.concat_ws(
                " ",
                Note.title,
                Note.body,
                Note.source_location,
            ),
        )
        ts_query = func.websearch_to_tsquery("english", query)
        keyword_rank = func.ts_rank_cd(note_document, ts_query).label("keyword_rank")
        statement = (
            select(NoteChunk, Note, Book, keyword_rank)
            .join(Note, NoteChunk.note_id == Note.id)
            .join(Book, Note.book_id == Book.id)
            .where(note_document.op("@@")(ts_query))
            .order_by(keyword_rank.desc(), Note.updated_at.desc(), Note.id)
            .limit(limit)
        )
        if kind is not None:
            statement = statement.where(Note.kind == kind)

        rows = self._session.execute(statement)
        return [
            SearchChunkCandidate(
                chunk=row[0],
                note=row[1],
                book=row[2],
                keyword_rank=float(row[3]),
            )
            for row in rows
        ]

    def delete_note(self, note: Note) -> None:
        self._session.delete(note)
        self._session.flush()

    def flush(self) -> None:
        self._session.flush()

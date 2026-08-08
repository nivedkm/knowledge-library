from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.application.search.service import SearchService
from app.infrastructure.database.models import Book, Note, NoteChunk
from app.infrastructure.repositories.catalog import CatalogRepository


class FakeEmbeddingService:
    model_name = "fake-embeddings"

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            seed = sum(ord(character) for character in text)
            vectors.append([
                float((seed + index * 31) % 997) / 997.0
                for index in range(384)
            ])
        return vectors


def test_search_backfills_notes_that_have_no_chunks(
    database_session: Session,
) -> None:
    database_session.execute(delete(NoteChunk))
    database_session.execute(delete(Note))
    database_session.execute(delete(Book))
    repository = CatalogRepository(database_session)
    book = repository.add_book(Book(title="Deep Work", author="Cal Newport"))
    repository.add_note(
        Note(
            book_id=book.id,
            title="Focus",
            body="Protect uninterrupted focus to get difficult work done.",
            source_location="Chapter 2",
        ),
    )

    result = SearchService(
        database_session,
        embedding_service=FakeEmbeddingService(),
    ).search("What helps me focus?")

    assert result.results
    assert result.results[0].book_title == "Deep Work"
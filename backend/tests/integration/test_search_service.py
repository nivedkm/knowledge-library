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


def test_search_service_ranks_semantic_and_keyword_hits(
    database_session: Session,
) -> None:
    database_session.execute(delete(NoteChunk))
    database_session.execute(delete(Note))
    database_session.execute(delete(Book))
    repository = CatalogRepository(database_session)
    book = repository.add_book(Book(title="Make It Stick", author="Peter C. Brown"))
    note = repository.add_note(
        Note(
            book_id=book.id,
            title="Retrieval practice",
            body="Recalling knowledge strengthens later recall.",
            source_location="Chapter 2",
        ),
    )
    repository.add_note_chunk(
        NoteChunk(
            note_id=note.id,
            chunk_index=0,
            content="Recalling knowledge strengthens later recall.",
            embedding=[1.0] * 384,
            embedding_model="fake-embeddings",
        ),
    )

    result = SearchService(
        database_session,
        embedding_service=FakeEmbeddingService(),
    ).search("How does retrieval practice help recall?")

    assert result.answer.startswith("From your notes:")
    assert result.results[0].book_title == "Make It Stick"
    assert result.results[0].source_location == "Chapter 2"
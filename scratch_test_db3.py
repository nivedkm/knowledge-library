import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.config.settings import get_settings
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session
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

engine = create_engine(get_settings().database_url)

with Session(engine) as session:
    session.execute(text("DELETE FROM note_chunks"))
    session.execute(text("DELETE FROM notes"))
    session.execute(text("DELETE FROM books"))
    
    repository = CatalogRepository(session)
    book = repository.add_book(Book(title="Make It Stick", author="Peter C. Brown"))
    note = repository.add_note(
        Note(
            book_id=book.id,
            title="Retrieval practice",
            body="Recalling knowledge strengthens later recall.",
            source_location="Chapter 2",
        ),
    )
    chunk = repository.add_note_chunk(
        NoteChunk(
            note_id=note.id,
            chunk_index=0,
            content="Recalling knowledge strengthens later recall.",
            embedding=[1.0] * 384,
            embedding_model="fake-embeddings",
        ),
    )
    session.flush()
    
    q_emb = FakeEmbeddingService().embed_texts(["How does retrieval practice help recall?"])[0]
    
    # Try raw SQL to see exactly what distance is returned, and why where clause might fail
    res = session.execute(text("SELECT id, embedding <=> :emb as dist FROM note_chunks"), {"emb": str(q_emb)}).fetchall()
    print("Raw SQL query result:", res)
    
    session.rollback()

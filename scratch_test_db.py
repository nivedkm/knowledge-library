import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.config.settings import get_settings
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session
from app.infrastructure.database.models import Book, Note, NoteChunk
from app.infrastructure.repositories.catalog import CatalogRepository

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
    
    # Try to read back the chunk
    stmt = select(NoteChunk)
    chunks = session.execute(stmt).scalars().all()
    print("Chunks in DB:", len(chunks))
    if chunks:
        print("Chunk content:", chunks[0].content)
        
    # Try the search by embedding
    q_emb = [0.5] * 384  # fake embedding
    candidates = repository.search_chunks_by_embedding(q_emb, limit=10)
    print("Candidates by embedding:", len(candidates))
    
    # Try search by keywords
    k_candidates = repository.search_chunks_by_keywords("How does retrieval practice help recall?", limit=10)
    print("Candidates by keywords:", len(k_candidates))
    
    # rollback so we don't pollute the dev db
    session.rollback()

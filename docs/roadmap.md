# Roadmap

## Completed

- Project foundation: FastAPI, React, Vite, TypeScript, linting, tests.
- Local PostgreSQL with Docker and pgvector.
- SQLAlchemy sessions, Alembic migrations, and readiness checks.
- Books, notes, and quotes data model.
- REST API for books and notes/quotes.
- React UI for creating, editing, and deleting books and entries.
- Retrieval storage: `note_chunks` with optional `vector(384)` embeddings.

## Current State

The app is usable as a local book notes manager. Notes and quotes are stored in
PostgreSQL. Quotes render differently in the UI, but retrieval will treat notes
and quotes as the same kind of knowledge.

The database is ready to store embeddings, but the app does not generate or
search embeddings yet.

## Next Milestones

1. Build chunking logic for note/quote bodies.
2. Generate embeddings locally with `sentence-transformers/all-MiniLM-L6-v2`.
3. Add semantic search over `note_chunks`.
4. Add question answering from retrieved chunks only.
5. Add hybrid retrieval with keyword search plus vector search.
6. Add local LLM generation with `llama.cpp`.

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

The database now stores searchable note chunks and embeddings, and the app can
rank note chunks with a hybrid semantic plus keyword search endpoint. The UI can
ask questions of the library and show grounded matches.

## Next Milestones

1. Improve search result presentation with richer source previews and note/book filters.
2. Add answer generation beyond grounded excerpts when a local LLM is available.
3. Expand evaluation coverage for ranking quality and grounding precision.

# Architecture

## Current Shape

WisdomAI is a local-first web app with a React frontend, a FastAPI backend, and
PostgreSQL as the source of truth.

```text
React + TypeScript
localhost:5173
       |
       | HTTP/JSON
       v
FastAPI
localhost:8000
       |
       v
PostgreSQL + pgvector
localhost:5432
```

The catalog and retrieval data path currently looks like this:

```text
React UI
  -> FastAPI
      -> Catalog service
          -> PostgreSQL
              -> books
              -> notes
              -> note_chunks
```

Notes and quotes are the human-facing entries. Chunks are the retrieval-facing
entries that will receive embeddings and later power semantic search.

## Why We Built In Layers

Each milestone adds one major moving part: API, database, data model, frontend,
then retrieval storage. That makes failures easier to understand and keeps the
project interview-friendly: every layer has a clear reason to exist.

## Boundaries

- `api/` understands HTTP concepts such as routes and status codes.
- `application/` coordinates use cases and transaction boundaries.
- `infrastructure/database/` defines SQLAlchemy models and sessions.
- `infrastructure/repositories/` owns database queries.
- `config/` contains values that may differ between environments.
- `schemas/` describes data crossing the API boundary.
- The React `api/` directory owns communication with the backend.
- React components display state but do not construct backend URLs themselves.

We are keeping this as a modular monolith: one backend process with clear
internal boundaries.

## Current Request Lifecycle

```text
1. React submits a book/note/quote request
2. FastAPI validates it with Pydantic
3. CatalogService coordinates the use case
4. CatalogRepository runs SQLAlchemy queries
5. PostgreSQL enforces constraints and stores data
6. FastAPI returns typed JSON
7. React refreshes the affected screen state
```

## Configuration

Configuration is read from environment variables:

- Backend variables begin with `WISDOM_`.
- Frontend variables exposed by Vite begin with `VITE_`.

The committed `.env.example` documents allowed settings. The real `.env` file
is ignored because environment files may eventually contain secrets.

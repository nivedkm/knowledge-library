# Milestone 1 architecture

## What we are building

Milestone 1 creates two small applications:

```text
┌──────────────────────────┐       HTTP/JSON       ┌──────────────────────────┐
│ React + TypeScript       │ ────────────────────> │ FastAPI                  │
│ User interface           │                       │ /api/v1/health           │
│ localhost:5173           │ <──────────────────── │ localhost:8000           │
└──────────────────────────┘    status response    └──────────────────────────┘
```

The backend returns:

```json
{
  "status": "ok",
  "service": "wisdom-api"
}
```

The frontend turns that machine-friendly response into a human-friendly status
message.

The current catalog and retrieval data path now looks like this:

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

## Why this comes before the database

If we introduced React, FastAPI, PostgreSQL, SQLAlchemy, and pgvector together,
an error could come from any of five places. This foundation gives us a known
working path from browser to backend. PostgreSQL becomes the only new variable
in the next milestone.

## Boundaries

- `api/` understands HTTP concepts such as routes and status codes.
- `config/` contains values that may differ between environments.
- `schemas/` describes data crossing the API boundary.
- The React `api/` directory owns communication with the backend.
- React components display state but do not construct backend URLs themselves.

Later milestones will add application, domain, and infrastructure packages when
real use cases exist. Empty architectural layers would create complexity without
providing separation.

## Request lifecycle

```text
1. React mounts
2. React calls fetchHealth()
3. The browser sends GET /api/v1/health
4. FastAPI matches the route
5. FastAPI validates the response against HealthResponse
6. The browser receives JSON
7. React displays connected or unavailable
```

## Configuration

Configuration is read from environment variables:

- Backend variables begin with `WISDOM_`.
- Frontend variables exposed by Vite begin with `VITE_`.

The committed `.env.example` documents allowed settings. The real `.env` file
is ignored because environment files may eventually contain secrets.

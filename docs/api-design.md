# Milestone 4: book and note REST API

## Request flow

```text
JSON request
    │
    ▼
Pydantic schema ── rejects malformed or blank input
    │
    ▼
FastAPI route ──── handles HTTP concerns
    │
    ▼
CatalogService ─── coordinates the use case and transaction
    │
    ▼
Repository ─────── executes focused SQLAlchemy queries
    │
    ▼
PostgreSQL ─────── enforces final data integrity
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/books` | Create a book |
| `GET` | `/api/v1/books` | List books |
| `GET` | `/api/v1/books/{book_id}` | Read one book |
| `PATCH` | `/api/v1/books/{book_id}` | Change selected book fields |
| `DELETE` | `/api/v1/books/{book_id}` | Delete a book and its notes |
| `POST` | `/api/v1/books/{book_id}/notes` | Add a note to a book |
| `GET` | `/api/v1/books/{book_id}/notes` | List a book's notes |
| `GET` | `/api/v1/notes/{note_id}` | Read one note |
| `PATCH` | `/api/v1/notes/{note_id}` | Change selected note fields |
| `DELETE` | `/api/v1/notes/{note_id}` | Delete one note |

List endpoints accept `limit` and `offset`. The maximum limit is 100.

## Status codes

- `200 OK`: a read or update succeeded.
- `201 Created`: a book or note was created.
- `204 No Content`: deletion succeeded.
- `404 Not Found`: a valid UUID identifies no resource.
- `422 Unprocessable Entity`: request structure or values are invalid.
- `503 Service Unavailable`: the readiness check cannot reach PostgreSQL.

## Why PATCH instead of PUT

`PATCH` changes only supplied fields:

```json
{
  "source_location": "Chapter 4"
}
```

The client does not need to resend the note body just to correct its location.
An empty patch is rejected because it expresses no operation.

Optional note fields can explicitly be cleared with `null`. Required book fields
and the note body cannot be set to `null`.

## Book activity

Book responses contain:

- `note_count`
- `last_activity_at`

`last_activity_at` is calculated by PostgreSQL from the book update timestamp
and its latest note update timestamp. It is not duplicated in the database.

## Error boundary

The application service raises a technology-neutral `ResourceNotFoundError`.
FastAPI converts it into a `404` response. This prevents HTTP concerns from
leaking into the service and repository layers.


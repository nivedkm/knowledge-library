# Milestone 2: PostgreSQL foundation

## The pieces

```text
FastAPI request
      │
      ▼
SQLAlchemy Session ─── one short-lived workspace for the request
      │
      ▼
SQLAlchemy Engine ─── owns and reuses a pool of connections
      │
      ▼
psycopg driver ────── translates Python database calls
      │
      ▼
PostgreSQL server ─── stores data and enforces transactions
```

## Server, database, schema, and table

These terms describe different levels:

```text
PostgreSQL server
└── wisdom database
    └── public schema
        ├── books
        ├── notes
        └── note_chunks
```

- The **server** is the running PostgreSQL program.
- A **database** is an isolated collection of data inside that server.
- A **schema** is a namespace inside a database.
- A **table** stores rows with defined columns and constraints.

## Engine versus Session

The SQLAlchemy `Engine` is a long-lived application object. It knows how to
connect and owns a pool so connections can be reused.

A `Session` is short-lived. It groups database work and tracks a transaction.
WisdomAI creates one session per request and closes it afterward.

```text
Engine lifetime:  ─────────────────────────────────────────>

Request A:          [ Session A ]
Request B:                [ Session B ]
Request C:                       [ Session C ]
```

Sessions must not be shared between simultaneous requests.

## Transactions

A transaction groups operations into one all-or-nothing unit:

```text
BEGIN
  create note or quote
  create its chunks
COMMIT
```

If creating chunks fails, `ROLLBACK` prevents a half-finished result. This is why
the application service owns commits instead of each repository method
committing independently.

## Why Alembic exists

SQLAlchemy models describe what the Python application expects now. Alembic
migrations record the ordered steps used to change a real database:

```text
baseline → add books and notes → add note kind → add note chunks
```

This history lets a new developer create the schema and lets an existing
installation upgrade without deleting its data.

## Container storage

The PostgreSQL process runs in a Docker container, while its data lives in the
named volume `wisdom_postgres_data`.

```text
Container (replaceable) ──> Named volume (persistent)
```

Stopping or recreating the container keeps the volume. Deleting the volume
deletes the database.

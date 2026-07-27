# Database migrations

Alembic migrations are the ordered history of the database schema.

Useful commands, run from `backend/`:

```bash
uv run alembic upgrade head
uv run alembic current
uv run alembic downgrade -1
```

Do not use SQLAlchemy's `Base.metadata.create_all()` for the application schema.
It creates missing tables but does not record how a real database should move
between schema versions.


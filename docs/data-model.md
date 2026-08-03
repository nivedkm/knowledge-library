# Milestone 3: book and note data model

## Relationship

```text
books
├── id (UUID primary key)
├── title
├── author
├── created_at
└── updated_at
       │
       │ one book has many notes
       ▼
notes
├── id (UUID primary key)
├── book_id (foreign key)
├── title (optional)
├── kind (`note` or `quote`)
├── body
├── source_location (optional)
├── created_at
└── updated_at
```

## Important invariants

An invariant is a rule that must always remain true:

- A book title cannot be empty or whitespace.
- A book author cannot be empty or whitespace.
- A note body cannot be empty or whitespace.
- Every entry is classified as either a `note` or `quote`.
- Every note belongs to an existing book.
- Deleting a book deletes its notes.
- Optional text is either meaningful text or `NULL`, not an empty string.

These rules are PostgreSQL constraints, not only Python validation. The database
is the final guardian of its own integrity.

## Notes and quotes in retrieval

The `kind` field changes presentation, not knowledge access. Future chunking and
semantic retrieval will use the `body` of both notes and quotes. A question about
a book can therefore retrieve either form of captured knowledge.

## Why there is no `last_activity_at`

The UI wants to display the latest time a book or one of its notes changed.
Storing that value would duplicate information and could become inconsistent.
It will be calculated from:

```text
maximum(book.updated_at, latest note.updated_at)
```

We can optimize it later if measurements show a real need.

## Delete behavior

The note foreign key uses `ON DELETE CASCADE`:

```text
delete book
    └── PostgreSQL automatically deletes its notes
```

This is enforced even when deletion comes from SQL outside the Python
application.

## Repository transaction rule

Repository methods use `flush`, which sends pending SQL to PostgreSQL, but they
do not use `commit`.

```text
Application use case
├── repository operation
├── repository operation
└── one commit
```

The application layer owns the transaction so related operations remain
all-or-nothing.

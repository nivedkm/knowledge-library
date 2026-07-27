"""Add books and notes.

Revision ID: 20260727_02
Revises: 20260727_01
Create Date: 2026-07-27
"""

import sqlalchemy as sa
from alembic import op

revision: str = "20260727_02"
down_revision: str | None = "20260727_01"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create the book catalog and its user-authored notes."""
    op.create_table(
        "books",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(author)) > 0",
            name="ck_books_author_not_blank",
        ),
        sa.CheckConstraint(
            "char_length(btrim(title)) > 0",
            name="ck_books_title_not_blank",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "notes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("book_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("source_location", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "char_length(btrim(body)) > 0",
            name="ck_notes_body_not_blank",
        ),
        sa.CheckConstraint(
            "source_location IS NULL OR char_length(btrim(source_location)) > 0",
            name="ck_notes_source_location_not_blank",
        ),
        sa.CheckConstraint(
            "title IS NULL OR char_length(btrim(title)) > 0",
            name="ck_notes_title_not_blank",
        ),
        sa.ForeignKeyConstraint(
            ["book_id"],
            ["books.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notes_book_id", "notes", ["book_id"])


def downgrade() -> None:
    """Remove notes before books to satisfy the foreign key."""
    op.drop_index("ix_notes_book_id", table_name="notes")
    op.drop_table("notes")
    op.drop_table("books")

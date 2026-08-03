"""Add note chunks for retrieval.

Revision ID: 20260728_04
Revises: 20260728_03
Create Date: 2026-07-28
"""

import pgvector.sqlalchemy
import sqlalchemy as sa
from alembic import op

revision: str = "20260728_04"
down_revision: str | None = "20260728_03"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Create searchable note chunks with optional vector embeddings."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "note_chunks",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("note_id", sa.Uuid(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", pgvector.sqlalchemy.Vector(dim=384), nullable=True),
        sa.Column("embedding_model", sa.String(length=100), nullable=True),
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
            "chunk_index >= 0",
            name="ck_note_chunks_chunk_index_not_negative",
        ),
        sa.CheckConstraint(
            "char_length(btrim(content)) > 0",
            name="ck_note_chunks_content_not_blank",
        ),
        sa.CheckConstraint(
            "embedding_model IS NULL OR char_length(btrim(embedding_model)) > 0",
            name="ck_note_chunks_embedding_model_not_blank",
        ),
        sa.CheckConstraint(
            """
            (embedding IS NULL AND embedding_model IS NULL)
            OR (embedding IS NOT NULL AND embedding_model IS NOT NULL)
            """,
            name="ck_note_chunks_embedding_and_model_together",
        ),
        sa.ForeignKeyConstraint(
            ["note_id"],
            ["notes.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("note_id", "chunk_index", name="uq_note_chunks_position"),
    )
    op.create_index("ix_note_chunks_note_id", "note_chunks", ["note_id"])


def downgrade() -> None:
    """Remove retrieval chunks while leaving the shared vector extension installed."""
    op.drop_index("ix_note_chunks_note_id", table_name="note_chunks")
    op.drop_table("note_chunks")

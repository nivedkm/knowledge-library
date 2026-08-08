"""Add retrieval indexes for note chunks.

Revision ID: 20260728_05
Revises: 20260728_04
Create Date: 2026-08-06
"""

from alembic import op

revision: str = "20260728_05"
down_revision: str | None = "20260728_04"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Speed up semantic and keyword search."""
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_note_chunks_embedding_cosine ON note_chunks USING ivfflat (embedding vector_cosine_ops) WHERE embedding IS NOT NULL",
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_note_chunks_content_fts ON note_chunks USING gin (to_tsvector('english', content))",
    )


def downgrade() -> None:
    """Drop the retrieval indexes."""
    op.execute("DROP INDEX IF EXISTS ix_note_chunks_content_fts")
    op.execute("DROP INDEX IF EXISTS ix_note_chunks_embedding_cosine")
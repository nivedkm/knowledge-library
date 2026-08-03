"""Add a kind to distinguish notes from quotes.

Revision ID: 20260728_03
Revises: 20260727_02
Create Date: 2026-07-28
"""

import sqlalchemy as sa
from alembic import op

revision: str = "20260728_03"
down_revision: str | None = "20260727_02"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Add a non-null kind and preserve existing entries as ordinary notes."""
    op.add_column(
        "notes",
        sa.Column(
            "kind",
            sa.String(length=10),
            server_default="note",
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_notes_kind_is_valid",
        "notes",
        "kind IN ('note', 'quote')",
    )


def downgrade() -> None:
    """Remove the note kind classification."""
    op.drop_constraint("ck_notes_kind_is_valid", "notes", type_="check")
    op.drop_column("notes", "kind")

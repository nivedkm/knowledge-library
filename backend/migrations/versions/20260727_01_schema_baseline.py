"""Establish the initial database schema baseline.

Revision ID: 20260727_01
Revises:
Create Date: 2026-07-27
"""

revision: str = "20260727_01"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    """Establish an Alembic version without application tables yet."""


def downgrade() -> None:
    """Return to the state before Alembic managed the schema."""

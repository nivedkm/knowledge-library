from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.note import Note


EMBEDDING_DIMENSIONS = 384


class NoteChunk(Base):
    """A smaller searchable passage derived from a note or quote."""

    __tablename__ = "note_chunks"
    __table_args__ = (
        CheckConstraint(
            "chunk_index >= 0",
            name="ck_note_chunks_chunk_index_not_negative",
        ),
        CheckConstraint(
            "char_length(btrim(content)) > 0",
            name="ck_note_chunks_content_not_blank",
        ),
        CheckConstraint(
            "embedding_model IS NULL OR char_length(btrim(embedding_model)) > 0",
            name="ck_note_chunks_embedding_model_not_blank",
        ),
        CheckConstraint(
            """
            (embedding IS NULL AND embedding_model IS NULL)
            OR (embedding IS NOT NULL AND embedding_model IS NOT NULL)
            """,
            name="ck_note_chunks_embedding_and_model_together",
        ),
        UniqueConstraint("note_id", "chunk_index", name="uq_note_chunks_position"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    note_id: Mapped[UUID] = mapped_column(
        ForeignKey("notes.id", ondelete="CASCADE"),
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(EMBEDDING_DIMENSIONS),
        nullable=True,
    )
    embedding_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    note: Mapped["Note"] = relationship(back_populates="chunks")

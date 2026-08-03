from datetime import datetime
from typing import TYPE_CHECKING, Literal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.book import Book

NoteKind = Literal["note", "quote"]


class Note(Base):
    """A user-authored note that belongs to exactly one book."""

    __tablename__ = "notes"
    __table_args__ = (
        CheckConstraint(
            "title IS NULL OR char_length(btrim(title)) > 0",
            name="ck_notes_title_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(body)) > 0",
            name="ck_notes_body_not_blank",
        ),
        CheckConstraint(
            "source_location IS NULL OR char_length(btrim(source_location)) > 0",
            name="ck_notes_source_location_not_blank",
        ),
        CheckConstraint(
            "kind IN ('note', 'quote')",
            name="ck_notes_kind_is_valid",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    book_id: Mapped[UUID] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    kind: Mapped[NoteKind] = mapped_column(
        String(10),
        default="note",
        server_default="note",
    )
    body: Mapped[str] = mapped_column(Text)
    source_location: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    book: Mapped["Book"] = relationship(back_populates="notes")

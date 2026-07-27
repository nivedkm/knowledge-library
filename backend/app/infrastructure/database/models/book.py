from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import Base

if TYPE_CHECKING:
    from app.infrastructure.database.models.note import Note


class Book(Base):
    """A book whose reading notes belong to one local catalog."""

    __tablename__ = "books"
    __table_args__ = (
        CheckConstraint(
            "char_length(btrim(title)) > 0",
            name="ck_books_title_not_blank",
        ),
        CheckConstraint(
            "char_length(btrim(author)) > 0",
            name="ck_books_author_not_blank",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255))
    author: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    notes: Mapped[list["Note"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

from datetime import datetime
from typing import Annotated, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator

from app.application.catalog.service import BookOverview
from app.infrastructure.database.models import Note

ShortText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=255),
]
LocationText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100),
]
NoteBody = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=100_000),
]


class BookCreate(BaseModel):
    title: ShortText
    author: ShortText


class BookUpdate(BaseModel):
    title: ShortText | None = None
    author: ShortText | None = None

    @model_validator(mode="after")
    def validate_changes(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Book fields cannot be null.")
        return self


class BookResponse(BaseModel):
    id: UUID
    title: str
    author: str
    created_at: datetime
    updated_at: datetime
    note_count: int
    last_activity_at: datetime

    @classmethod
    def from_overview(cls, overview: BookOverview) -> "BookResponse":
        book = overview.book
        return cls(
            id=book.id,
            title=book.title,
            author=book.author,
            created_at=book.created_at,
            updated_at=book.updated_at,
            note_count=overview.note_count,
            last_activity_at=overview.last_activity_at,
        )


class NoteCreate(BaseModel):
    title: ShortText | None = None
    body: NoteBody
    source_location: LocationText | None = None


class NoteUpdate(BaseModel):
    title: ShortText | None = None
    body: NoteBody | None = None
    source_location: LocationText | None = None

    @model_validator(mode="after")
    def validate_changes(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided.")
        if "body" in self.model_fields_set and self.body is None:
            raise ValueError("Note body cannot be null.")
        return self

    def changes(self) -> dict[str, str | None]:
        return {field: getattr(self, field) for field in self.model_fields_set}


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    book_id: UUID
    title: str | None
    body: str
    source_location: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_note(cls, note: Note) -> "NoteResponse":
        return cls.model_validate(note)

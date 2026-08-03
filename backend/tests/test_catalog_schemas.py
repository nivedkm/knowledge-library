import pytest
from pydantic import ValidationError

from app.schemas.catalog import BookCreate, BookUpdate, NoteCreate, NoteUpdate


def test_create_schemas_trim_surrounding_whitespace() -> None:
    book = BookCreate(title="  Deep Work  ", author="  Cal Newport ")
    note = NoteCreate(body="  Protect focused time.  ")

    assert book.title == "Deep Work"
    assert book.author == "Cal Newport"
    assert note.body == "Protect focused time."


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "   ", "author": "Valid"},
        {"title": "Valid", "author": ""},
    ],
)
def test_book_create_rejects_blank_required_fields(
    payload: dict[str, str],
) -> None:
    with pytest.raises(ValidationError):
        BookCreate.model_validate(payload)


def test_patch_schemas_require_at_least_one_change() -> None:
    with pytest.raises(ValidationError):
        BookUpdate()
    with pytest.raises(ValidationError):
        NoteUpdate()


def test_note_patch_allows_clearing_optional_fields() -> None:
    update = NoteUpdate(title=None, source_location=None)

    assert update.changes() == {
        "title": None,
        "source_location": None,
    }


def test_note_patch_rejects_a_null_body() -> None:
    with pytest.raises(ValidationError):
        NoteUpdate(body=None)


def test_note_kind_defaults_to_note_and_accepts_quote() -> None:
    assert NoteCreate(body="A thought").kind == "note"
    assert NoteCreate(body="Exact words", kind="quote").kind == "quote"

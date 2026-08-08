from app.application.search.chunking import split_note_body


def test_split_note_body_creates_compact_chunks() -> None:
    body = (
        "First idea. Second idea about memory and attention.\n\n"
        "Another paragraph with a longer explanation that should stay together. "
        "A final sentence."
    )

    chunks = split_note_body(body, max_chars=70)

    assert len(chunks) >= 2
    assert chunks[0].startswith("First idea.")
    assert all(len(chunk) <= 70 for chunk in chunks)
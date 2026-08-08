from __future__ import annotations

import re

PARAGRAPH_BOUNDARY = re.compile(r"\n\s*\n+")
SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+")
MAX_CHUNK_CHARS = 780


def split_note_body(body: str, *, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    """Split a note body into compact chunks for embeddings and search."""
    cleaned_body = body.strip()
    if cleaned_body == "":
        return []

    chunks: list[str] = []
    for paragraph in PARAGRAPH_BOUNDARY.split(cleaned_body):
        paragraph = paragraph.strip()
        if paragraph == "":
            continue

        current_chunk = ""
        for sentence in SENTENCE_BOUNDARY.split(paragraph):
            sentence = sentence.strip()
            if sentence == "":
                continue

            if len(sentence) > max_chars:
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                chunks.extend(_split_long_segment(sentence, max_chars=max_chars))
                continue

            candidate = sentence if current_chunk == "" else f"{current_chunk} {sentence}"
            if len(candidate) <= max_chars:
                current_chunk = candidate
            else:
                chunks.append(current_chunk)
                current_chunk = sentence

        if current_chunk:
            chunks.append(current_chunk)

    return chunks


def _split_long_segment(segment: str, *, max_chars: int) -> list[str]:
    words = segment.split()
    if not words:
        return [segment[:max_chars]]

    pieces: list[str] = []
    current_piece = ""
    for word in words:
        if len(word) > max_chars:
            if current_piece:
                pieces.append(current_piece)
                current_piece = ""
            pieces.extend(word[index : index + max_chars] for index in range(0, len(word), max_chars))
            continue

        candidate = word if current_piece == "" else f"{current_piece} {word}"
        if len(candidate) <= max_chars:
            current_piece = candidate
        else:
            pieces.append(current_piece)
            current_piece = word

    if current_piece:
        pieces.append(current_piece)

    return pieces
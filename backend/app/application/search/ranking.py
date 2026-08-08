from __future__ import annotations

import re
from dataclasses import dataclass

STOP_WORDS = {
    "a",
    "about",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "do",
    "for",
    "from",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "show",
    "tell",
    "the",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "you",
    "your",
}

TOKEN_PATTERN = re.compile(r"[a-z0-9']+")


@dataclass(frozen=True)
class RankedSearchResult:
    note_id: object
    book_id: object
    note_kind: str
    note_title: str | None
    book_title: str
    book_author: str
    source_location: str | None
    excerpt: str
    matched_chunks: tuple[str, ...]
    semantic_distance: float
    keyword_rank: float
    score: float


def tokenize(text: str) -> set[str]:
    return {
        token
        for token in TOKEN_PATTERN.findall(text.lower())
        if token not in STOP_WORDS
    }


def score_hit(
    *,
    semantic_distance: float,
    keyword_rank: float,
    question_tokens: set[str],
    evidence_text: str,
) -> float:
    semantic_score = max(0.0, 1.0 - semantic_distance)
    keyword_score = min(1.0, max(0.0, keyword_rank * 5.0))
    evidence_tokens = tokenize(evidence_text)
    if question_tokens:
        overlap = len(question_tokens & evidence_tokens) / len(question_tokens)
    else:
        overlap = 0.0

    return round(
        semantic_score * 0.7 + keyword_score * 0.2 + overlap * 0.1,
        6,
    )


def build_grounded_answer(question: str, results: list[RankedSearchResult]) -> str:
    if not results:
        return "I don't know from your notes."

    top_result = results[0]
    question_tokens = tokenize(question)
    evidence_tokens = tokenize(" ".join(result.excerpt for result in results[:3]))
    overlap = len(question_tokens & evidence_tokens) / len(question_tokens) if question_tokens else 0.0

    if top_result.score < 0.25 or overlap < 0.08:
        return "I don't know from your notes."

    snippets = [result.excerpt for result in results[:3] if result.excerpt.strip()]
    if not snippets:
        return "I don't know from your notes."

    if len(snippets) == 1:
        return f"From your notes: {snippets[0]}"

    return "From your notes: " + " ".join(snippets)
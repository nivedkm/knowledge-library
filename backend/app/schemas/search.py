from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, StringConstraints

from app.application.search.ranking import RankedSearchResult
from app.infrastructure.database.models import NoteKind

ShortText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=500),
]

SearchNoteKind = Literal["all", "note", "quote"]


class SearchRequest(BaseModel):
    question: ShortText
    kind: SearchNoteKind = "all"


class SearchResult(BaseModel):
    note_id: UUID
    book_id: UUID
    note_kind: NoteKind
    note_title: str | None
    book_title: str
    book_author: str
    source_location: str | None
    excerpt: str
    matched_chunks: list[str]
    semantic_distance: float
    keyword_rank: float
    score: float

    @classmethod
    def from_ranked_result(cls, result: RankedSearchResult) -> "SearchResult":
        return cls(
            note_id=result.note_id,
            book_id=result.book_id,
            note_kind=result.note_kind,
            note_title=result.note_title,
            book_title=result.book_title,
            book_author=result.book_author,
            source_location=result.source_location,
            excerpt=result.excerpt,
            matched_chunks=list(result.matched_chunks),
            semantic_distance=result.semantic_distance,
            keyword_rank=result.keyword_rank,
            score=result.score,
        )


class SearchResponse(BaseModel):
    question: str
    answer: str
    results: list[SearchResult]

    @classmethod
    def from_service(
        cls,
        question: str,
        answer: str,
        results: list[RankedSearchResult],
    ) -> "SearchResponse":
        return cls(
            question=question,
            answer=answer,
            results=[SearchResult.from_ranked_result(result) for result in results],
        )
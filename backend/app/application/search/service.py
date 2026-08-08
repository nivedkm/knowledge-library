from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session

from app.application.search.chunking import split_note_body
from app.application.search.embeddings import (
    DEFAULT_EMBEDDING_MODEL,
    EmbeddingService,
    SentenceTransformerEmbeddingService,
)
from app.application.search.ranking import (
    RankedSearchResult,
    build_grounded_answer,
    score_hit,
    tokenize,
)
from app.infrastructure.database.models import Note, NoteChunk, NoteKind
from app.infrastructure.repositories.catalog import (
    CatalogRepository,
    SearchChunkCandidate,
)


@dataclass(frozen=True)
class SearchResponseData:
    question: str
    answer: str
    results: list[RankedSearchResult]


class SearchService:
    """Hybrid semantic and keyword search over note chunks."""

    def __init__(
        self,
        session: Session,
        *,
        embedding_service: EmbeddingService | None = None,
        semantic_limit: int = 20,
        keyword_limit: int = 20,
    ) -> None:
        self._session = session
        self._repository = CatalogRepository(session)
        self._embedding_service = embedding_service or SentenceTransformerEmbeddingService()
        self._semantic_limit = semantic_limit
        self._keyword_limit = keyword_limit

    def search(self, question: str, *, kind: NoteKind | None = None) -> SearchResponseData:
        question = question.strip()
        if question == "":
            return SearchResponseData(question=question, answer="I don't know from your notes.", results=[])

        self._backfill_missing_chunks(kind=kind)
        query_embedding = self._embedding_service.embed_texts([question])[0]
        semantic_candidates = self._repository.search_chunks_by_embedding(
            query_embedding,
            limit=self._semantic_limit,
            kind=kind,
        )
        keyword_candidates = self._repository.search_chunks_by_keywords(
            question,
            limit=self._keyword_limit,
            kind=kind,
        )
        note_keyword_candidates = self._repository.search_notes_by_keywords(
            question,
            limit=self._keyword_limit,
            kind=kind,
        )

        results = rank_search_candidates(
            question,
            semantic_candidates=semantic_candidates,
            keyword_candidates=keyword_candidates + note_keyword_candidates,
        )
        return SearchResponseData(
            question=question,
            answer=build_grounded_answer(question, results),
            results=results,
        )

    def _backfill_missing_chunks(self, *, kind: NoteKind | None) -> None:
        notes = self._repository.list_notes_without_chunks()
        if kind is not None:
            notes = [note for note in notes if note.kind == kind]

        if not notes:
            return

        for note in notes:
            chunks = split_note_body(note.body)
            embeddings = self._embedding_service.embed_texts(chunks)
            if len(embeddings) != len(chunks):
                raise ValueError("Embedding service returned the wrong number of vectors.")

            for chunk_index, (content, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
                self._repository.add_note_chunk(
                    NoteChunk(
                        note_id=note.id,
                        chunk_index=chunk_index,
                        content=content,
                        embedding=embedding,
                        embedding_model=getattr(
                            self._embedding_service,
                            "model_name",
                            DEFAULT_EMBEDDING_MODEL,
                        ),
                    ),
                )

        self._repository.flush()


def rank_search_candidates(
    question: str,
    *,
    semantic_candidates: list[SearchChunkCandidate],
    keyword_candidates: list[SearchChunkCandidate],
) -> list[RankedSearchResult]:
    candidates_by_note: dict[UUID, dict[str, object]] = OrderedDict()
    question_tokens = tokenize(question)

    def add_candidate(candidate: SearchChunkCandidate) -> None:
        note = candidate.note
        book = candidate.book
        entry = candidates_by_note.setdefault(
            note.id,
            {
                "note": note,
                "book": book,
                "chunks": [],
                "semantic_distance": 1.0,
                "keyword_rank": 0.0,
            },
        )
        chunks = entry["chunks"]
        assert isinstance(chunks, list)
        chunks.append(candidate.chunk.content)

        if candidate.semantic_distance is not None:
            entry["semantic_distance"] = min(
                float(entry["semantic_distance"]),
                candidate.semantic_distance,
            )
        if candidate.keyword_rank is not None:
            entry["keyword_rank"] = max(
                float(entry["keyword_rank"]),
                candidate.keyword_rank,
            )

    for candidate in semantic_candidates:
        add_candidate(candidate)
    for candidate in keyword_candidates:
        add_candidate(candidate)

    ranked_results: list[RankedSearchResult] = []
    for entry in candidates_by_note.values():
        note = entry["note"]
        book = entry["book"]
        chunks = tuple(dict.fromkeys(entry["chunks"]))
        semantic_distance = float(entry["semantic_distance"])
        keyword_rank = float(entry["keyword_rank"])
        excerpt = chunks[0] if chunks else note.body[:240]
        score = score_hit(
            semantic_distance=semantic_distance,
            keyword_rank=keyword_rank,
            question_tokens=question_tokens,
            evidence_text=" ".join(chunks),
        )
        ranked_results.append(
            RankedSearchResult(
                note_id=note.id,
                book_id=book.id,
                note_kind=note.kind,
                note_title=note.title,
                book_title=book.title,
                book_author=book.author,
                source_location=note.source_location,
                excerpt=excerpt,
                matched_chunks=chunks,
                semantic_distance=semantic_distance,
                keyword_rank=keyword_rank,
                score=score,
            ),
        )

    ranked_results.sort(
        key=lambda result: (
            -result.score,
            result.semantic_distance,
            -result.keyword_rank,
            result.book_title.lower(),
            result.note_id,
        ),
    )
    return ranked_results
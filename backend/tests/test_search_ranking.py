from uuid import UUID

from app.application.search.ranking import (
    RankedSearchResult,
    build_grounded_answer,
    score_hit,
    tokenize,
)


def test_score_hit_rewards_overlap_and_rank() -> None:
    question_tokens = tokenize("What helps with retrieval practice?")

    score = score_hit(
        semantic_distance=0.05,
        keyword_rank=0.3,
        question_tokens=question_tokens,
        evidence_text="Retrieval practice strengthens later recall.",
    )

    assert score > 0.5


def test_grounded_answer_refuses_weak_evidence() -> None:
    result = RankedSearchResult(
        note_id=UUID(int=1),
        book_id=UUID(int=2),
        note_kind="note",
        note_title=None,
        book_title="Test Book",
        book_author="Author",
        source_location=None,
        excerpt="Unrelated excerpt",
        matched_chunks=("Unrelated excerpt",),
        semantic_distance=0.9,
        keyword_rank=0.0,
        score=0.1,
    )

    assert build_grounded_answer("What is the answer?", [result]) == "I don't know from your notes."
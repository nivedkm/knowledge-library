from fastapi import APIRouter

from app.api.dependencies import DatabaseSession, InjectedEmbeddingService
from app.application.search.service import SearchService
from app.schemas.search import SearchRequest, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.post("")
def search_notes(payload: SearchRequest, session: DatabaseSession, embedding_service: InjectedEmbeddingService) -> SearchResponse:
    kind = None if payload.kind == "all" else payload.kind
    result = SearchService(session, embedding_service=embedding_service).search(payload.question, kind=kind)
    return SearchResponse.from_service(result.question, result.answer, result.results)
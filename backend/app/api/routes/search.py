from fastapi import APIRouter

from app.api.dependencies import DatabaseSession
from app.application.search.service import SearchService
from app.schemas.search import SearchRequest, SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.post("")
def search_notes(payload: SearchRequest, session: DatabaseSession) -> SearchResponse:
    kind = None if payload.kind == "all" else payload.kind
    result = SearchService(session).search(payload.question, kind=kind)
    return SearchResponse.from_service(result.question, result.answer, result.results)
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.api.dependencies import DatabaseSession, InjectedEmbeddingService
from app.application.catalog.service import CatalogService
from app.schemas.catalog import (
    BookCreate,
    BookResponse,
    BookUpdate,
    NoteCreate,
    NoteResponse,
)

router = APIRouter(prefix="/books", tags=["books"])

Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(payload: BookCreate, session: DatabaseSession) -> BookResponse:
    overview = CatalogService(session).create_book(
        title=payload.title,
        author=payload.author,
    )
    return BookResponse.from_overview(overview)


@router.get("", response_model=list[BookResponse])
def list_books(
    session: DatabaseSession,
    limit: Limit = 50,
    offset: Offset = 0,
) -> list[BookResponse]:
    overviews = CatalogService(session).list_books(limit=limit, offset=offset)
    return [BookResponse.from_overview(overview) for overview in overviews]


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, session: DatabaseSession) -> BookResponse:
    return BookResponse.from_overview(CatalogService(session).get_book(book_id))


@router.patch("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: UUID,
    payload: BookUpdate,
    session: DatabaseSession,
) -> BookResponse:
    overview = CatalogService(session).update_book(
        book_id,
        title=payload.title,
        author=payload.author,
    )
    return BookResponse.from_overview(overview)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: UUID, session: DatabaseSession) -> Response:
    CatalogService(session).delete_book(book_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{book_id}/notes",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    book_id: UUID,
    payload: NoteCreate,
    session: DatabaseSession,
    embedding_service: InjectedEmbeddingService,
) -> NoteResponse:
    note = CatalogService(session, embedding_service=embedding_service).create_note(
        book_id,
        title=payload.title,
        body=payload.body,
        source_location=payload.source_location,
        kind=payload.kind,
    )
    return NoteResponse.from_note(note)


@router.get("/{book_id}/notes", response_model=list[NoteResponse])
def list_notes(
    book_id: UUID,
    session: DatabaseSession,
    limit: Limit = 100,
    offset: Offset = 0,
) -> list[NoteResponse]:
    notes = CatalogService(session).list_notes(
        book_id,
        limit=limit,
        offset=offset,
    )
    return [NoteResponse.from_note(note) for note in notes]

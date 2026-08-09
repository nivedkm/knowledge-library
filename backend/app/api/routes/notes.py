from uuid import UUID

from fastapi import APIRouter, Response, status

from app.api.dependencies import DatabaseSession, InjectedEmbeddingService
from app.application.catalog.service import CatalogService
from app.schemas.catalog import NoteResponse, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: UUID, session: DatabaseSession) -> NoteResponse:
    return NoteResponse.from_note(CatalogService(session).get_note(note_id))


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: UUID,
    payload: NoteUpdate,
    session: DatabaseSession,
    embedding_service: InjectedEmbeddingService,
) -> NoteResponse:
    note = CatalogService(session, embedding_service=embedding_service).update_note(
        note_id,
        changes=payload.changes(),
    )
    return NoteResponse.from_note(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: UUID, session: DatabaseSession) -> Response:
    CatalogService(session).delete_note(note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.infrastructure.database.session import get_database_session
from app.application.search.embeddings import EmbeddingService

DatabaseSession = Annotated[Session, Depends(get_database_session)]

def get_embedding_service(request: Request) -> EmbeddingService | None:
    return getattr(request.app.state, "embedding_service", None)

InjectedEmbeddingService = Annotated[EmbeddingService | None, Depends(get_embedding_service)]
